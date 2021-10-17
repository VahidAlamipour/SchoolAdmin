import models from '../db';
import { sequelize } from '../db';
const { MessageQueue } = require('../services/queue');
const { rmqLog } = require('../log');
const config = require('../config').load();
const queue = new MessageQueue(config.rabbitmq.connectstring);
import { diff } from 'deep-object-diff';
import { Transaction } from 'sequelize';
import { RoleRepository } from './role';
import dayjs from 'dayjs';

const roleRepo = new RoleRepository();

type ActionType = 'CREATED' | 'UPDATED' | 'DELETED';
type EntityType = 'admin' | 'teacher' | 'parent' | 'student' | 'user' | 'school' | 'activeYear';

export interface IMessage {
    header: IBaseUserInfo;
    message: IMessageBody | IMessageBodyStudent | IMessageBodyTeacher | IMessageBodySchool;
}

export interface IBaseUserInfo {
    id: number;
    oauthId: number;
}

export interface IMessageBody {
    id: number;
    oauthId: number;
    name: string;
    lastName: string;
    middleName: string;
    msisdn: string;
    email: string;
    birthday: Date;
    address?: string;
    active: boolean;
    gender?: string;
    status: 'enabled' | 'disabled';
    teacherInformation?: {
        education: string;
        university: string;
        speciality: string;
        category: string;
        graduationYear: string;
        trainingYear: string;
    };
}

export interface IMessageBodyStudent extends IMessageBody {
    localAddress: string;
    phoneNumber: string;
    passportBirthCertificate: string;
    nationality: string;
    religion: string;
    race: string;
    other: string;
    parents: IBaseUserInfo[];
    subclasses: number[];
    educationalClassId: number;
    academicYearId: number;
    oldEducationalClassId: number;
}

export interface IMessageBodyTeacher extends IMessageBody {
    education: string;
    university: string;
    speciality: string;
    category: string;
    graduationYear: string;
    trainingYear: string;
    isDirector: boolean;
    isCurriculumDirector: boolean;
    headOfSubjectsIds: number;
    educator: [{
        subject: {
            id: number;
        };
        level: {
            id: number;
        };
    }];
    homeClassId: number[];
}
export interface IMessageBodySchool extends IMessageBody {
    fullName: string;
    cityId: number;
    adminId: number[];
    branch: { id: number, name: string, domain: string };
}

export class Messages {
    private static async emit(headers: any = {}, payload: any = {}): Promise<void> {
        if (headers.entity === 'teacher') {
            delete (payload.gender);
            delete (payload.address);
            payload.trainingYear = payload.trainingYear ? dayjs(payload.trainingYear).format('YYYY') : null;
            payload.graduationYear = payload.graduationYear ? dayjs(payload.graduationYear).format('YYYY') : null;

        } else if (headers.entity === 'admin') {
            delete (payload.gender);
        } else if (headers.entity === 'user') {
            if (payload.teacherInformation) {
                delete (payload.gender);
                delete (payload.address);
                payload.teacherInformation.trainingYear = payload.teacherInformation.trainingYear ? dayjs(payload.teacherInformation.trainingYear).format('YYYY') : null;
                payload.teacherInformation.graduationYear = payload.teacherInformation.graduationYear ? dayjs(payload.teacherInformation.graduationYear).format('YYYY') : null;
            }
        }

        rmqLog.info(`Message sent to queue: {\n\theaders: ${JSON.stringify(headers)},\n\tpayload: ${JSON.stringify(payload)}\n}`);
        await queue.emit('beedos.sync', payload, headers);
    }

    public static async parseDiff(userId: number, oldRoles, newRoles, transaction: Transaction,
        options?: any,
        destination?: {
            fromYearId?: number, toYearId: number,
            classId: number, msgType: string,
            oldClassId?: number, subclasses?: number[]
        }, school?: any): Promise<void> {
        if (!oldRoles) {
            oldRoles = roleRepo.getEmptyRole();
        }
        if (!newRoles) {
            newRoles = roleRepo.getEmptyRole();
        }
        const baseMessage = await roleRepo.getUserMessage(userId, transaction);

        const diffs: any = diff(oldRoles, newRoles);

        const accounts = diffs.accounts;
        let schools = diffs.schools;
        const isParent = diffs.isParent;

        if (accounts) {
            await Messages.accountUpdate(accounts, oldRoles, newRoles, baseMessage);
        }

        if (schools || (options && options.forceUpdate)) {
            if(!schools && (options && destination.classId == destination.oldClassId)){
                schools= {};
                schools[options.forceUpdate]=[];
                schools[options.forceUpdate] = oldRoles.schools[options.forceUpdate];
                destination.oldClassId = undefined;
            }
            await Messages.schoolsUpdate(userId, schools, oldRoles, newRoles, baseMessage, transaction, destination);
        }

        if (isParent || (options && options.parent)) {
            await Messages.parentUpdate(userId, oldRoles.isParent, newRoles.isParent, baseMessage, transaction, school, options ? options.type : undefined)
        }
    }

    public static async prepareMessage(message: IMessage | { header: {}, message: { id: number } }
        , accountId: number, schoolId: number, event: ActionType,
        entity: EntityType, options = {}): Promise<void> {
        await Messages.emit({
            ...message.header,
            accountId,
            schoolId,
            event,
            entity,
        }, {
            ...message.message,
            ...options,
        });
    }

    private static async accountUpdate(accounts, oldRoles, newRoles, baseMessage: IMessage): Promise<void> {
        for (const accountId in accounts) {
            const account = accounts[accountId];
            if (account.admin) {
                const oldAccountAdmin = oldRoles.accounts[accountId] ? oldRoles.accounts[accountId].admin : {};
                const newAccountAdmin = newRoles.accounts[accountId] ? newRoles.accounts[accountId].admin : {};

                if (!oldAccountAdmin.admin && newAccountAdmin.admin) {
                    await Messages.prepareMessage(baseMessage, +accountId, undefined, 'CREATED', 'admin')
                } else if (!newAccountAdmin.admin && oldAccountAdmin.admin) {
                    await Messages.prepareMessage(baseMessage, +accountId, undefined, 'DELETED', 'admin')
                }
            }

            if (account.teacher) {
                if (!Object.values(account.teacher).length) {
                    continue;
                }

                const oldAccountTeacher = oldRoles.accounts[accountId] ? oldRoles.accounts[accountId].teacher : {};
                const newAccountTeacher = newRoles.accounts[accountId] ? newRoles.accounts[accountId].teacher : {};
                const options = {
                    isDirector: !!newAccountTeacher.director,
                    isCurriculumDirector: !!newAccountTeacher.curriculumDirector,
                };

                if (!(
                    oldAccountTeacher.director ||
                    oldAccountTeacher.curriculumDirector
                ) && (
                        newAccountTeacher.director ||
                        newAccountTeacher.curriculumDirector
                    )) {
                    await Messages.prepareMessage(baseMessage, +accountId, undefined, 'CREATED', 'teacher', options)
                } else if (!(
                    newAccountTeacher.director ||
                    newAccountTeacher.curriculumDirector
                ) && (
                        oldAccountTeacher.director ||
                        oldAccountTeacher.curriculumDirector
                    )) {
                    await Messages.prepareMessage(baseMessage, +accountId, undefined, 'DELETED', 'teacher', options)
                } else {
                    await Messages.prepareMessage(baseMessage, +accountId, undefined, 'UPDATED', 'teacher', options)
                }
            }
        }
    }

    private static async schoolsUpdate(id: number, schools, oldRoles, newRoles, baseMessage: IMessage, transaction: Transaction,
        destination?: {
            fromYearId?: number, toYearId: number,
            classId: number, msgType: string,
            oldClassId?: number, subclasses?: number[]
        }): Promise<void> {
        let teacherOptions;
        for (const schoolId in schools) {
            const school = schools[schoolId];
            const accountId = await models.school.findById(schoolId, {
                attributes: ['branch_id'],
                transaction,
            }).then((school): number => school.branch_id);

            if (school.admin) {
                const oldSchoolAdmin = oldRoles.schools[schoolId] ? oldRoles.schools[schoolId].admin : {};
                const newSchoolAdmin = newRoles.schools[schoolId] ? newRoles.schools[schoolId].admin : {};

                if (!oldSchoolAdmin.admin && newSchoolAdmin.admin) {
                    await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'CREATED', 'admin')
                } else if (!newSchoolAdmin.admin && oldSchoolAdmin.admin) {
                    await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'DELETED', 'admin')
                }
            }

            if (school.teacher) {
                const oldSchoolTeacher = oldRoles.schools[schoolId] ? oldRoles.schools[schoolId].teacher : {};
                const newSchoolTeacher = newRoles.schools[schoolId] ? newRoles.schools[schoolId].teacher : {};
                if (!teacherOptions) {
                    teacherOptions = await models.teacher.findById(id, {
                        transaction
                    }).then(data => {
                        return {
                            education: data ? data.education : '',
                            university: data ? data.university : '',
                            speciality: data ? data.speciality : '',
                            category: data ? data.category : '',
                            graduationYear: data ? data.graduation_year : '',
                            trainingYear: data ? data.training_year : '',
                        }
                    });
                }

                const options: any = {
                    ...teacherOptions,
                    isDirector: !!newSchoolTeacher.director,
                    isCurriculumDirector: !!newSchoolTeacher.curriculumDirector,
                };
                {
                    if (oldSchoolTeacher.headOfDepartment) oldSchoolTeacher.headOfDepartment = oldSchoolTeacher.headOfDepartment.filter(x => x.status);
                    if (newSchoolTeacher.headOfDepartment) newSchoolTeacher.headOfDepartment = newSchoolTeacher.headOfDepartment.filter(x => x.status);
                }
                if (newSchoolTeacher.headOfDepartment) {
                    options.headOfSubjectsIds = newSchoolTeacher.headOfDepartment.map((subject): number => subject.subjectId)
                }

                if (newSchoolTeacher.educator) {
                    options.teacherSubjects = newSchoolTeacher.educator.filter(teacher => teacher.status).map(teacher => {
                        return {
                            subject: {
                                id: teacher.subjectId
                            },
                            level: {
                                id: teacher.levelId
                            }
                        }
                    })
                }

                if (newSchoolTeacher.homeroomEducator) {
                    options.homeClassId = newSchoolTeacher.homeroomEducator
                        .filter(homeClass => homeClass.status)
                        .map(homeClass => homeClass.classId);
                }


                if (!(
                    oldSchoolTeacher.director ||
                    oldSchoolTeacher.curriculumDirector ||
                    oldSchoolTeacher.teacher ||
                    (oldSchoolTeacher.headOfDepartment && oldSchoolTeacher.headOfDepartment.length) ||
                    (oldSchoolTeacher.homeroomEducator && oldSchoolTeacher.homeroomEducator.length)
                ) && (
                        newSchoolTeacher.director ||
                        newSchoolTeacher.curriculumDirector ||
                        newSchoolTeacher.teacher ||
                        (newSchoolTeacher.headOfDepartment && newSchoolTeacher.headOfDepartment.length) ||
                        (newSchoolTeacher.homeroomEducator && newSchoolTeacher.homeroomEducator.length)
                    )) {
                    await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'CREATED', 'teacher', options)
                } else if (!(
                    newSchoolTeacher.director ||
                    newSchoolTeacher.curriculumDirector ||
                    newSchoolTeacher.teacher ||
                    (newSchoolTeacher.headOfDepartment && newSchoolTeacher.headOfDepartment.length) ||
                    (newSchoolTeacher.homeroomEducator && newSchoolTeacher.homeroomEducator.length)
                ) && (
                        oldSchoolTeacher.director ||
                        oldSchoolTeacher.curriculumDirector ||
                        oldSchoolTeacher.teacher ||
                        (oldSchoolTeacher.headOfDepartment && oldSchoolTeacher.headOfDepartment.length) ||
                        (oldSchoolTeacher.homeroomEducator && oldSchoolTeacher.homeroomEducator.length)
                    )) {
                    await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'DELETED', 'teacher', options)
                } else if (
                    options.isDirector ||
                    options.isCurriculumDirector ||
                    options.headOfSubjectsIds.length ||
                    options.teacherSubjects.length ||
                    options.homeClassId.length
                ) {
                    await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'UPDATED', 'teacher', options)
                }
            }

            if (school.student ? Object.keys(school.student).length : false) {
                const oldStudent = oldRoles.schools[schoolId] ? oldRoles.schools[schoolId].student : {};
                const newStudent = newRoles.schools[schoolId] ? newRoles.schools[schoolId].student : {};
                baseMessage.message = await roleRepo.addStudentInfo(id, +accountId, +schoolId, baseMessage.message as IMessageBodyStudent, transaction);
                if (destination) {
                    let tempMsg = baseMessage.message as IMessageBodyStudent;
                    tempMsg.educationalClassId = destination.classId;
                    tempMsg.academicYearId = destination.toYearId;
                    if (destination.oldClassId) {
                        tempMsg.oldEducationalClassId = destination.oldClassId;
                    }
                    if (destination.subclasses) {
                        tempMsg.subclasses = destination.subclasses;
                    }
                    baseMessage.message = tempMsg;
                    await Messages.prepareMessage(baseMessage, +accountId, +schoolId, destination.msgType as ActionType, 'student')
                } else {

                    if (!(oldStudent.class || oldStudent.parentRoleIds) && (newStudent.class || newStudent.parentRoleIds)) {
                        if (newStudent.class) {
                            const newClass = await models.class.findById(newStudent.class);
                            if (newClass) {
                                let tempMsg = baseMessage.message as IMessageBodyStudent;
                                tempMsg.educationalClassId = newClass.id;
                                tempMsg.academicYearId = newClass.year_id;
                                baseMessage.message = tempMsg;
                            }
                        }
                        await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'CREATED', 'student')
                    } else if (!(newStudent.class || newStudent.parentRoleIds) && (oldStudent.class || oldStudent.parentRoleIds)) {
                        if (oldStudent.class) {
                            const oldClass = await models.class.findById(oldStudent.class);
                            if (oldClass) {
                                let tempMsg = baseMessage.message as IMessageBodyStudent;
                                tempMsg.educationalClassId = oldClass.id;
                                tempMsg.academicYearId = oldClass.year_id;
                                baseMessage.message = tempMsg;
                            }
                        }
                        await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'DELETED', 'student')
                    } else {
                        await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'UPDATED', 'student')
                    }
                }
            }
        }
    }

    private static async parentUpdate(id: number, oldParent = [], newParent = [], baseMessage: IMessage,
        transaction: Transaction, school?: any, type?: 'CREATE' | 'UPDATE'): Promise<void> {
        const oldParentData = oldParent;
        const parent = await models.parent.findById(id, {
            transaction
        }).then(data => {
            return {
                nationality: data ? data.nationality : '',
                passportBirthCertificate: data ? data.passport_id : '',
                phoneNumber: data ? data.phone_number : '',
                designation: data ? data.designation : '',
                company: data ? data.company : '',
                companyAddress: data ? data.company_address : '',
                parentsStatus: data ? data.material_status : '',
                familyRole: ((gender: string): string => {
                    if (gender === 'female') {
                        return 'mother'
                    } else if (gender === 'male') {
                        return 'father'
                    } else {
                        return 'guardian'
                    }
                })(baseMessage.message.gender)
            }
        });
        let studentsOAuthIds;
        if (school && school.id) {
            const newConnections = await sequelize.query(`SELECT url.user_id,pp.disabled from user_role ur
                    LEFT JOIN parent_pupil pp ON pp.parent_id = ur.id
                    LEFT JOIN user_role url ON pp.pupil_id = url.id 
                    WHERE ur.user_id = ${id} AND url.school_id = ${school.id} AND pp.archived = 0`,
                { type: sequelize.QueryTypes.SELECT, transaction });
            newParent = newConnections.map(x => x.user_id);
            if (!type || type !== 'CREATE') oldParent = newParent;
            // const newConnections = await sequelize.query(`SELECT pp.disabled from user_role ur
            //         LEFT JOIN parent_pupil pp ON pp.parent_id = ur.id
            //         LEFT JOIN user_role url ON pp.pupil_id = url.id 
            //         WHERE ur.user_id = ${id} AND url.school_id = ${school.id} AND pp.archived = 0 LIMIT 1`,
            //     { type: sequelize.QueryTypes.SELECT, transaction });
            baseMessage.message.status = newConnections[0] && newConnections[0].disabled ? 'disabled' : 'enabled';


            // let filteredUsers = await models.user.findAll({
            //     attributes: ['external_id'],
            //     where: {
            //         id: newParent
            //     },
            //     include: [{
            //         model: models.user_role,
            //         where: {
            //             school_id: school.id,
            //             role_id: 73 //hard code
            //         }
            //     }],
            //     transaction
            // });
            // studentsOAuthIds = filteredUsers.map((user): number => user.external_id);
        }
        studentsOAuthIds = await models.user.findAll({
            attributes: ['external_id'],
            where: {
                id: newParent
            },
            transaction
        }).map((user): number => user.external_id);
        const options = {
            ...parent,
            studentsIds: studentsOAuthIds
        };

        if (!oldParent.length && newParent.length) {
            await Messages.prepareMessage(baseMessage, school.branch.id, school.id, 'CREATED', 'parent', options)
        } else if (!newParent.length && oldParent.length) {
            await Messages.prepareMessage(baseMessage, school.branch.id, school.id, 'DELETED', 'parent', options)
        } else if(oldParentData.length && !newParent.length && studentsOAuthIds.length === 0) {
            await Messages.prepareMessage(baseMessage, school.branch.id, school.id, 'DELETED', 'parent', options)
        } else {
            await Messages.prepareMessage(baseMessage, school.branch.id, school.id, 'UPDATED', 'parent', options)
        }
    }

    public static async sendUserStatus(id: number, transaction: Transaction,
        manuallyMessage: { schoolId: number, forceStatus: 'enabled' | 'disabled' } = null): Promise<void> {
        const message = await roleRepo.getUserMessage(id, transaction);
        if (manuallyMessage) {
            message.message.status = manuallyMessage.forceStatus;
        }
        await Messages.prepareMessage(message, undefined,
            manuallyMessage ? manuallyMessage.schoolId : undefined, 'UPDATED', 'user');
    }
}
