import { Application, Router, Request, Response } from 'express';

import { ITables } from '../models/db.tables';

import { RoleRepository } from '../repositories/role';
import AdminsController from '../controllers/admins';
import ParentsController from '../controllers/parents';
import LearnersController from '../controllers/students'
import { ReqUser } from '../crud';
import { IStudent, ISchool, ITeacherRole, IUser, IAdministrator, ILearnerRole } from '../../sdk/interfaces';
import { Messages } from '../repositories/messages';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../db';
import { BeedError } from '../services/beed';
import { IMessageBodyStudent } from '../repositories/messages';
import { promises } from 'fs';
import { diff } from 'deep-object-diff';

const roleRepo = new RoleRepository();
const adminsController = new AdminsController();
const parentsController = new ParentsController();
const learnersController = new LearnersController();







export default (app: Application, models: ITables): void => {
    const router = Router();

    app.use('/users', router);

    router.post('/:id/activate', async (req: Request, res: Response): Promise<void> => {
        const transaction: Transaction = await sequelize.transaction();

        try {
            let adminRoles = await getAdminAvailableRoles();
            let adminRolesIds = adminRoles.map(role => role.id);
            let roles = await models.user_role.findAll({
                where: {
                    user_id: req.params.id,
                    role_id: adminRolesIds,
                    archived: 0
                },
                transaction
            });
            await models.user_role.update({
                disabled: 0,
            }, {
                where: {
                    user_id: req.params.id,
                    role_id: adminRolesIds,
                    archived: 0
                },
                transaction
            });

            // await models.user.update({
            //     disabled: 0,
            // }, {
            //     where: {
            //         id: req.params.id
            //     },
            //     transaction
            // });

            // await Messages.sendUserStatus(req.params.id, transaction);
            for (let role of roles) {
                let accountRoleIds = roles.filter(role => role.role_id == 76 || role.role_id == 77).map(x => x.role_id);
                let accountFlag = (role.role_id == 76 || role.role_id == 77);
                // Hard code should change 
                await activeSendMessage(accountFlag ? 'ACCOUNT_ADMIN' : 'ADMIN', req.params.id, role.school_id, 'enabled', transaction,
                    role.branch_id, accountFlag ? accountRoleIds : undefined);

            }
            res.json('OK');
        } catch (err) {
            await transaction.rollback();

            throw err;
        }

        await transaction.commit();
    });

    router.post('/:id/deactivate', async (req: Request, res: Response): Promise<void> => {
        const transaction: Transaction = await sequelize.transaction();

        try {
            const isAccountAdministrator = await roleRepo.isAccountAdministrator(req.params.id);

            if (isAccountAdministrator || +req.user.id === +req.params.id) {
                throw new BeedError('You cant disable account administrator', 403)
            }
            let adminRoles = await getAdminAvailableRoles();
            let adminRolesIds = adminRoles.map(role => role.id);
            let roles = await models.user_role.findAll({
                where: {
                    user_id: req.params.id,
                    role_id: adminRolesIds,
                    archived: 0
                },
                transaction
            });
            await models.user_role.update({
                disabled: 1,
            }, {
                where: {
                    user_id: req.params.id,
                    role_id: adminRolesIds,
                    archived: 0
                },
                transaction
            });
            // await models.user.update({
            //     disabled: 1,
            // }, {
            //     where: {
            //         id: req.params.id
            //     },
            //     transaction
            // });

            // await Messages.sendUserStatus(req.params.id, transaction);
            for (let role of roles) {
                let accountRoleIds = roles.filter(role => role.role_id == 76 || role.role_id == 77).map(x => x.role_id);
                let accountFlag = (role.role_id == 76 || role.role_id == 77);
                await activeSendMessage(accountFlag ? 'ACCOUNT_ADMIN' : 'ADMIN', req.params.id, role.school_id, 'disabled'
                    , transaction, role.branch_id, accountFlag ? accountRoleIds : undefined);
            }

            res.json('OK');
        } catch (err) {
            await transaction.rollback();

            throw err;
        }

        await transaction.commit();
    });
    router.post('/:id/activationInSchool', async (req: Request, res: Response): Promise<void> => {
        const transaction: Transaction = await sequelize.transaction();
        try {
            const userId: string = req.params.id;
            const user: ReqUser = req.user;
            let role: string[] = [req.body.role];
            if (req.body.role.toUpperCase() == 'EDUCATOR') {
                role = ['EDUCATOR', 'CURRICULUM_DIRECTOR']; // Hard code 
            }
            const roles = await models.role.findAll({
                where: {
                    disabled: 0,
                    sub_code: role,
                },
            });
            let userType: string = '';
            if (roles && roles.length > 0) {
                userType = roles[0].sub_code;
            }
            const rolIds = roles.map(({ id }): number => id);

            var school_id_query = { school_id: user.school.id };
            if (req.body.role.toUpperCase() == "PARENT") {
                school_id_query = null;
            }
            var firstOldRow = await models.user_role.findOne({
                where: {
                    user_id: userId,
                    role_id: rolIds,
                    ...school_id_query,
                    archived: 0
                },
                transaction
            });

            let stausOfMessage: ('enabled' | 'disabled') = 'enabled';
            if (userType != "PARENT") {
                models.user_role.update({ disabled: (firstOldRow.disabled == 0 ? 1 : 0) },
                    {
                        where: {
                            user_id: userId,
                            role_id: rolIds,
                            ...school_id_query,
                            archived: 0
                        },
                        transaction
                    });
                stausOfMessage = firstOldRow.disabled == 0 ? 'disabled' : 'enabled'
            } else {
                var relationIds: any[] = await sequelize.query(`SELECT pp.id,pp.disabled FROM parent_pupil pp
                LEFT JOIN user_role urs ON urs.id = pp.pupil_id
                WHERE pp.parent_id = ${firstOldRow.id} AND urs.school_id = ${user.school.id} AND pp.archived =0 AND urs.disabled = 0 AND urs.archived = 0`,
                    { type: sequelize.QueryTypes.SELECT, transaction });
                if (relationIds && relationIds.length) {
                    var updatedIds = await sequelize.query(`UPDATE parent_pupil
                        SET disabled =${relationIds[0].disabled ? 0 : 1} 
                        WHERE id IN (${relationIds.map(row => row.id)})`,
                        { type: sequelize.QueryTypes.UPDATE, transaction });
                    stausOfMessage = relationIds[0].disabled ? 'enabled' : 'disabled';
                }
            }
            await activeSendMessage(userType, req.params.id, user.school.id,
                stausOfMessage, transaction);


            //await Messages.sendUserStatus(req.params.id, transaction,manuallyMessage);
            res.json('OK');
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

        await transaction.commit();
    });

    router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
        const transaction: Transaction = await sequelize.transaction();

        try {
            const oldRoles = await roleRepo.getUserRoles(req.params.id, transaction);

            const isAccountAdministrator = await roleRepo.isAccountAdministrator(req.params.id);

            if (isAccountAdministrator || +req.user.id === +req.params.id) {
                throw new BeedError('You cant delete account administrator', 404)
            }

            await models.user_role.update({
                archived: 1,
            }, {
                where: {
                    id: req.params.id
                },
                transaction
            });

            const newRoles = await roleRepo.getUserRoles(req.params.id, transaction);

            await Messages.parseDiff(req.params.id, oldRoles, newRoles, transaction);

            res.json('OK');
        } catch (err) {
            await transaction.rollback();

            throw err;
        }

        await transaction.commit();
    });

    router.put('/:id/roles', async (req: Request, res: Response): Promise<void> => {
        const transaction: Transaction = await sequelize.transaction();
        try {

            const oldRoles = await roleRepo.getUserRoles(req.params.id, transaction);

            const user: ReqUser = req.user;

            const activationStatus = await sequelize.query(`SELECT pp.parent_id, pp.disabled from user_role ur
                                        LEFT JOIN parent_pupil pp ON pp.parent_id = ur.id
                                        LEFT JOIN user_role url ON pp.pupil_id = url.id 
                                        WHERE ur.user_id = ${req.params.id} AND url.school_id = ${user.school.id} AND pp.archived = 0 LIMIT 1`,
                { type: sequelize.QueryTypes.SELECT, transaction });
            if (req.body.studentsIds && req.body.studentsIds.length) {
                await roleRepo.createParent(req.params.id, req.body.studentsIds, transaction, undefined, true, user.school.id);
                //#region Keep all relation the same activation status
                if (activationStatus.length > 0 && activationStatus[0].disabled) {
                    const newConnections = await sequelize.query(`SELECT pp.id from user_role ur
                                                    LEFT JOIN parent_pupil pp ON pp.parent_id = ur.id
                                                    LEFT JOIN user_role url ON pp.pupil_id = url.id 
                                                    WHERE ur.user_id = ${req.params.id} AND url.school_id = ${user.school.id} AND pp.archived = 0`,
                        { type: sequelize.QueryTypes.SELECT, transaction });

                    await sequelize.query(`UPDATE parent_pupil SET disabled = 1 WHERE id IN (${newConnections.map(x => x.id)});`,
                        { type: sequelize.QueryTypes.UPDATE, transaction });
                }

                //#endregion
            }

            if (oldRoles.isParent && oldRoles.isParent.length > 0 && req.body.studentsIds && req.body.studentsIds.length === 0) {
                if (activationStatus.length > 0) {
                    const newConnections = await sequelize.query(`SELECT pp.id from user_role ur
                    LEFT JOIN parent_pupil pp ON pp.parent_id = ur.id
                    LEFT JOIN user_role url ON pp.pupil_id = url.id 
                    WHERE ur.user_id = ${req.params.id} AND url.school_id = ${user.school.id} AND pp.archived = 0`,
                        { type: sequelize.QueryTypes.SELECT, transaction });
                    await sequelize.query(`UPDATE parent_pupil SET disabled = 1, archived = 1 WHERE id IN (${newConnections.map(x => x.id)});`,
                        { type: sequelize.QueryTypes.UPDATE, transaction });
                }
            }

            //#region TeacherHandling
            let eduRoleIds = (await getEduAvailableRoles()).map(x => x.id);
            let disabledTeacher = await models.user_role.findAll({
                attributes: ['id', 'school_id'],
                where: { user_id: req.params.id, role_id: eduRoleIds, archived: 0, disabled: 1 },
                include: [{
                    model: models.role,
                }]
            });
            await roleRepo.createTeachers(req.params.id, req.body.teacherRoles, transaction, undefined, true);
            if (disabledTeacher && disabledTeacher.length) {
                let innerSchoolId = req.body.teacherRoles.map(x => x.schoolId);
                let disabledTeacherIds = [];
                let removeTeacher = [];
                disabledTeacher.forEach(x => {
                    if (innerSchoolId.includes(x.school_id)) {
                        removeTeacher.push(x);
                    } else {
                        disabledTeacherIds.push(x.id);
                    }
                })
                let disabledSchoolId = disabledTeacher.map(x => x.school_id);

                { disabledTeacherIds.length && models.user_role.update({ archived: 0, disabled: 1 }, { where: { id: disabledTeacherIds }, transaction }); }
                if (removeTeacher.length) {
                    let filteredRemovedTeacherRoles = [];
                    removeTeacher.forEach(x => {
                        let inputedRole = req.body.teacherRoles.filter(teacherRole => teacherRole.schoolId == x.school_id)[0];
                        inputedRole.roles = [];
                        if (inputedRole.isDirector) {
                            inputedRole.roles.push('DIRECTOR');
                        }
                        if (inputedRole.isCurriculumDirector) {
                            inputedRole.roles.push('CURRICULUM_DIRECTOR');
                        }
                        if (inputedRole.homeClassId) {
                            inputedRole.roles.push('HOMEROOM_EDUCATOR');
                        }
                        if (inputedRole.headOfSubjectsIds && inputedRole.headOfSubjectsIds.length) {
                            inputedRole.roles.push('HEAD_OF_DEPARTMENT');
                        }
                        if (inputedRole.teacherSubjects && inputedRole.teacherSubjects.length) {
                            inputedRole.roles.push('EDUCATOR');
                        }
                        if (!inputedRole.roles.includes(x.role.code)) {
                            filteredRemovedTeacherRoles.push(x.id);
                        }
                    });
                    models.user_role.update({ archived: 1, disabled: 1 }, { where: { id: filteredRemovedTeacherRoles }, transaction });
                }
            }
            //#endregion


            await Promise.all([
                ...(user.access.isSuperAdmin || user.access.branchesId.length) ? [
                    roleRepo.createAdmins(req.params.id, req.body.adminSchoolsIds, [], transaction, undefined, true),
                    req.body.accountRole && user.school.branch && roleRepo.createAccountians(req.params.id, user.school.branch.id, req.body.accountRole, transaction, undefined, true),
                ] : []
            ]);
            //#region learnerHandeling
            let lernerRoleIds = await getLearnerAvailableRoles();
            let disabledLearners = await models.user_role.findAll({
                attributes: ['id', 'school_id'],
                where: { user_id: req.params.id, role_id: lernerRoleIds, archived: 0, disabled: 1 }
            });
            await roleRepo.createLearners(req.params.id, req.body.learnerRoles, transaction, undefined, true); // req.body.learnerReles.map((data): number => data.class_id)
            if (disabledLearners && disabledLearners.length) {
                let innerSchoolId = req.body.learnerRoles.map(x => x.school_id);
                let disabledLearnerIds = [];
                let removeLearner = [];
                disabledLearners.forEach(x => {
                    if (innerSchoolId.includes(x.school_id)) {
                        removeLearner.push(x.id);
                    } else {
                        disabledLearnerIds.push(x.id);
                    }
                });

                { disabledLearnerIds.length && models.user_role.update({ archived: 0, disabled: 1 }, { where: { id: disabledLearnerIds }, transaction }); }
            }


            //#endregion


            const learnerAndEducatorInClassValid = await roleRepo.checkLearnerAndEducatorInClass(req.params.id,
                req.body.learnerRoles, req.body.teacherRoles.filter((teacher: ITeacherRole): number => teacher.homeClassId),transaction);
            if (!learnerAndEducatorInClassValid) {
                const errorr: any = new Error("User cannot be both educator and learner in the same class");
                errorr.code = 500;
                throw errorr;
            }
            const newRoles = await roleRepo.getUserRoles(req.params.id, transaction);


            await Messages.parseDiff(req.params.id, oldRoles, newRoles, transaction, undefined, undefined, user.school);

            res.json('OK');
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

        await transaction.commit();
    });

    router.get('/:id/roles', async (req: Request, res: Response): Promise<void> => {
        const userId: number = req.params.id;

        const reqUser: ReqUser = req.user;

        const [
            user,
            students,
            teacherRoles,
            admin,
            learnerRoles,
        ]: [
                Partial<IUser>,
                IStudent[],
                ITeacherRole[],
                IAdministrator,
                ILearnerRole[],
            ] = await Promise.all([
                models.user.findOne({
                    where: {
                        id: userId
                    },
                }).then((user): Partial<IUser> => ({
                    id: user.id,
                    name: user.name,
                    lastName: user.surname,
                    middleName: user.middle_name,
                    msisdn: user.msisdn,
                })),
                parentsController.findOne(userId, req.user, req.query).then((parent): IStudent[] => parent.students).catch((): [] => []),
                roleRepo.getTeachersUserRoles(userId),
                (reqUser.access.isSuperAdmin || reqUser.access.branchesId.length) && adminsController.findOne(userId, req.user, req.query).catch((): any => ({})),
                roleRepo.getLearnersUserRole(userId)
            ]);


        const staffTypes = new Set(admin.types);
        res.json({
            user,
            ...admin ? {
                isAccountAdministrator: staffTypes.has('ACCOUNT_ADMINISTRATOR'),
                accountRoles: {
                    isDirector: staffTypes.has('ACCOUNT_DIRECTOR'),
                    isCurriculumDirector: staffTypes.has('ACCOUNT_CURRICULUM_DIRECTOR'),
                },
                adminRoles: admin.schools && admin.schools.map((school): { school: Partial<ISchool> } => ({ school })),
            } : {
                accountRoles: {}
            },
            students,
            teacherRoles,
            learnerRoles
        });
    });

    const activeSendMessage = async (userType: string, id: number, schoolId: number, status: 'enabled' | 'disabled',
        transaction: Transaction, branchId?: number, roleIds?: number[]): Promise<void> => {
        const baseMessage = await roleRepo.getUserMessage(id, transaction);
        let accountId = branchId;
        if (schoolId) {
            accountId = await models.school.findById(schoolId, {
                attributes: ['branch_id'],
                transaction,
            }).then((school): number => school.branch_id);
        }
        if (userType === 'LEARNER') {
            baseMessage.message = await roleRepo.addStudentInfo(id, +accountId, +schoolId, baseMessage.message as IMessageBodyStudent, transaction);
            baseMessage.message.status = status;
            await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'UPDATED', 'student');
        } else if (userType === 'CURRICULUM_DIRECTOR' || userType === 'EDUCATOR') {
            let teacherOptions = await models.teacher.findById(id, {
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
            var roles: any[] = await sequelize.query(`SELECT ur.id,ro.code FROM role ro
            LEFT JOIN user_role ur ON ur.role_id = ro.id
            WHERE ur.user_id = ${id} AND ur.school_id = ${schoolId} 
            AND ur.archived = 0 AND ro.sub_code IN ('CURRICULUM_DIRECTOR','EDUCATOR')`,
                { type: sequelize.QueryTypes.SELECT, transaction });
            let rolesCodes: string[] = roles.map(item => item.code);
            const options: any = {
                ...teacherOptions,
                isDirector: rolesCodes.indexOf('DIRECTOR') > -1,
                isCurriculumDirector: rolesCodes.indexOf('CURRICULUM_DIRECTOR') > -1,
                teacherSubjects: [],
                headOfSubjectsIds: [],
                homeClassId: []
            };
            let educatorRows: any[] = roles.filter(item => item.code === 'EDUCATOR');
            let headRows: any[] = roles.filter(item => item.code === 'HEAD_OF_DEPARTMENT');
            let homeRows: any[] = roles.filter(item => item.code === 'HOMEROOM_EDUCATOR');


            if (educatorRows && educatorRows.length) {
                let subs: any[] = await sequelize.query(`SELECT ts.subject_id,ts.level_id FROM teacher_subject ts 
                    WHERE ts.teacher_id = ${educatorRows[0].id} AND ts.disabled = 0`,
                    { type: sequelize.QueryTypes.SELECT, transaction });
                options.teacherSubjects = subs.map(item => ({ subject: { id: item.subject_id }, level: { id: item.level_id } }));
            }
            if (headRows && headRows.length) {
                let subs: any[] = await sequelize.query(`SELECT ts.subject_id FROM teacher_subject ts 
                WHERE ts.teacher_id = ${headRows[0].id} AND ts.disabled = 0`,
                    { type: sequelize.QueryTypes.SELECT, transaction });
                options.headOfSubjectsIds = subs.map(item => item.subject_id);
            }
            if (homeRows && homeRows.length) {
                let subs: any[] = await sequelize.query(`SELECT thc.class_id FROM teacher_head_class thc 
                WHERE thc.teacher_id = ${homeRows[0].id} AND thc.disabled = 0`,
                    { type: sequelize.QueryTypes.SELECT, transaction });
                options.homeClassId = subs.map(item => item.class_id);
            }

            baseMessage.message.status = status;
            baseMessage.message = { ...baseMessage.message, ...options }
            await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'UPDATED', 'teacher');
        } else if (userType === 'PARENT') {
            var studentsIds = await sequelize.query(`
            SELECT us.external_id FROM user us
                JOIN (
                SELECT ur.user_id FROM user_role ur 
                LEFT JOIN parent_pupil pp ON ur.id = pp.pupil_id 
                WHERE pp.parent_id = (SELECT ur.id FROM user_role ur
                WHERE ur.user_id = ${id} AND ur.role_id = 72 LIMIT 1) AND ur.school_id = ${schoolId} AND ur.disabled = 0 AND pp.archived = 0
                ) uids ON uids.user_id = us.id
            `, { type: sequelize.QueryTypes.SELECT });

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
            baseMessage.message = { ...baseMessage.message, ...parent }
            if (studentsIds) {
                studentsIds = studentsIds.map(row => row.external_id);
                baseMessage.message["studentsIds"] = studentsIds;
            }


            baseMessage.message.status = status;
            await Messages.prepareMessage(baseMessage, +accountId, +schoolId, 'UPDATED', 'parent');
        } else if (userType === 'ADMIN') {
            baseMessage.message.status = status;
            await Messages.prepareMessage(baseMessage, +accountId, schoolId ? +schoolId : undefined, 'UPDATED', 'admin');
        } else if (userType === 'ACCOUNT_ADMIN') {
            let message: any = { ...baseMessage.message };
            message.status = status;
            message.isCurriculumDirector = roleIds.includes(76);
            message.isDirector = roleIds.includes(77);
            baseMessage.message = message;
            await Messages.prepareMessage(baseMessage, +accountId, schoolId ? +schoolId : undefined, 'UPDATED', 'teacher');
        }
    };
    const getAdminAvailableRoles = async (): Promise<{ id: number; code: string }[]> => {
        const roles = await models.role.findAll({
            where: {
                disabled: 0,
                [Op.or]: [{
                    code: {
                        [Op.like]: 'ACCOUNT%'
                    },
                }, {
                    sub_code: ['ADMINISTRATOR'] // HARDCODE
                }]
            },
            order: [['code', 'ASC']],
            attributes: ['id', 'code']
        });

        return roles;
    }
    const getEduAvailableRoles = async (): Promise<{ id: number; code: string }[]> => {
        const roles = await models.role.findAll({
            where: {
                disabled: 0,
                sub_code: ['EDUCATOR', 'CURRICULUM_DIRECTOR'] // HARDCODE
            },
            order: [['code', 'ASC']],
            attributes: ['id', 'code']
        });

        return roles.filter((role): boolean => !role.code.startsWith('ACCOUNT'));
    }
    const getLearnerAvailableRoles = async (): Promise<number[]> => {
        const roles = await models.role.findAll({
            where: {
                disabled: 0,
                sub_code: 'LEARNER',
            },
        });
        return roles.map(({ id }): number => id);
    }


};
