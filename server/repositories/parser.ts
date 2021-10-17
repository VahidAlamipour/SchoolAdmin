import { Op, Transaction } from 'sequelize';
import * as XLSX from 'xlsx';
import * as yup from 'yup';
import uuidv4 from 'uuid/v4';
import dayjs from 'dayjs';
import { log } from '../log';

import models, { sequelize } from '../db';
import { RoleRepository } from './role';
import { Messages } from './messages';
import { BeedError } from '../services/beed';
import { PupilClassRepository } from './relation';
import { emit } from '../services/socket';

const pupilClassRepo = new PupilClassRepository();
const roleRepo = new RoleRepository();

import {
    IImportError,
    IImportResult,
    IStudent,
    ITeacher,
    IParent,
} from '../../sdk/interfaces';
import { IImportOptions } from '../crud';
import { parent_pupilInstance } from "../models/db";

export const parsers: Map<string, IImportResult> = new Map();

interface IGroupedByString<T> {
    [id: string]: T;
}

const direct = {
    mother: 1,
    father: 1,
    guardian: 0,
    '': null,
};

interface IUserFromFile {
    'Last name': string;
    'First name': string;
    Email: string;
    'Middle name': string;
    'Date of birth': Date;
    Nationality: string;
    'Phone number': string;
}

interface ILearnerFromFile extends IUserFromFile {
    Gender: string;
    'Local address': string;
    'Permanent address': string;
    'Mobile number': string;
    Religion: string;
    Race: string;
    'Passport/Birth certificate': string;
    Other: string;
}

interface IEducatorFromFile extends IUserFromFile {
    Segment: string;
    Level: string;
    'Course name': string;
    Education: string;
    University: string;
    Speciality: string;
    Category: string;
    'Year of graduation': Date;
    'Last career training': Date;
}

interface IParentFromFile extends IUserFromFile {
    'Learner email': string;
    'Family role': string;
    'Marital status': string;
    'Passport/ICNo': string;
    Address: string;
    'Mobile phone': string;
    'Designation/Occupation': string;
    Company: string;
    'Company address': string;
    learner_emails?: string[];
}

class EmailError extends Error {
    public readonly emails: string[];

    public constructor(message: string, emails: string[]) {
        super(message);
        this.emails = emails;
    }
}

const parseFile = async (filename: string): Promise<ILearnerFromFile[] | IEducatorFromFile[] | IParentFromFile[]> => {
    const head = await XLSX.readFile(filename, { sheetRows: 2 });
    const body = await XLSX.readFile(filename);

    const headerRow = head.Sheets[head.SheetNames[0]].A1.v.indexOf('Required') > -1 ? 2 : 1;
    const header = new Map();
    Object.keys(head.Sheets[head.SheetNames[0]]).forEach((key: string): void => {
        let numKey = key.replace(/\D/g, '');
        if (Number(numKey) === headerRow) {
            let testVal = String(head.Sheets[head.SheetNames[0]][key].v).toLowerCase();
            testVal = testVal.charAt(0).toUpperCase() + testVal.slice(1);
            header.set(key[0], testVal);
        }
    });
    const result = [];
    Object.keys(body.Sheets[body.SheetNames[0]]).forEach((key: string): void => {
        let numKey = key.replace(/\D/g, '');
        if (Number(numKey) > headerRow) {
            const index: number = Number(numKey) - headerRow - 1;
            if (!result[index]) {
                result[index] = {};
            }
            if (header.get(key[0]) === "Date of birth") {
                result[index][header.get(key[0])] = body.Sheets[body.SheetNames[0]][key].w;
            } else {
                let strVal = String(body.Sheets[body.SheetNames[0]][key].v).trim();
                if (header.get(key[0]) === "Gender") {
                    strVal = strVal.toLowerCase();
                }
                var n = strVal.charCodeAt(0);
                if (n == 8203) {
                    strVal = strVal.substr(1);
                }
                result[index][header.get(key[0])] = strVal;
            }
        }
    });

    return result;
};

const sendMessage = async (id: number, transaction: Transaction,
    destination?: {
        fromYearId: number,
        toYearId: number,
        classId: number,
        msgType: string,
        oldClassId?: number,
        subclasses?: number[]
    }, option?: { parent?: boolean, forceUpdate?: boolean, school?: any }): Promise<void> => {
    //#region definition 
    let fromYearId = undefined;
    let toYearId = undefined;
    if (destination && destination.fromYearId && destination.toYearId) {
        fromYearId = destination.fromYearId;
        toYearId = destination.toYearId;
    } else if (destination && destination.toYearId) {
        fromYearId = destination.toYearId;
        toYearId = destination.toYearId;
    }
    //#endregion
    if (option) {
        option.parent = false
    }



    const oldRoles = await roleRepo.getUserRoles(id, undefined, fromYearId);
    const newRoles = await roleRepo.getUserRoles(id, transaction, toYearId);


    const school =  option && option.school ? option.school : undefined; 

    await Messages.parseDiff(id, oldRoles, newRoles, transaction, option, destination,school);
};

const errorFormater = (line: number, error: any, data?: any): IImportError[] => {
    // console.log(error.errors ? error.errors : error);
    const errors: IGroupedByString<IImportError> = {
        UNDEFINED: {
            name: 'The user was not imported because the user already exists in the system.',
        },
        LAST_NAME_EMPTY: {
            name: 'Last name is not specified'
        },
        FIRST_NAME_EMPTY: {
            name: 'First name is not specified'
        },
        EMAIL_NOT_VALID: {
            name: 'Incorrect email.',
            description: 'Should be in the “name@example.com” format.'
        },
        EMAIL_EMPTY: {
            name: 'Email is not specified.'
        },
        GENDER_TYPE: {
            name: 'Incorrect gender.',
            description: 'Should be male or female only.'
        },
        GENDER_EMPTY: {
            name: 'Gender is not specified'
        },
        LEARNER_EMAIL_EMPTY: {
            name: 'Learner email is not specified.'
        },
        LEARNER_EMAIL_NOT_VALID: {
            name: 'Incorrect learner emails.',
            description: ' If you need to add multiple learners, separate their email addresses with commas.'
        },
        SEGMENT_EMPTY: {
            name: 'Segment is not found in the Institution.'
        },
        LEVEL_EMPTY: {
            name: 'Level is not found in the Institution.'
        },
        COURSE_EMPTY: {
            name: 'Course is not found in the Institution.'
        },
        DATE_NOT_VALID: {
            name: 'Incorrect format of Date of Birth.',
            description: 'Should be in the “YYYY-MM-DD” format.'
        },
        FAMILY_ROLE_INCORRECT: {
            name: 'Incorrect family role.',
            description: 'Should be mother, father or guardian.'
        },
        LEARNER_NOT_FOUND: {
            name: 'Incorrect family role.'
        },
        PHONE_NOT_NUMBER: {
            name: 'Incorrect phone number.'
        },
        MOBILE_NOT_NUMBER: {
            name: 'Incorrect mobile number.'
        },
        USER_ALREDY_DISABLED: {
            name: 'User has not been imported.',
            description: 'The user was previously deactivated in the System.'
        },
        MOBILE_ALREADY_EXISTS: {
            name: 'User with this phone number already exists.',
        },
        PARENT_ALREADY_EXIST: {
            name: `There is a parent with '${error.parentEmail}' in this school please use update`
        },
        TEACHER_ALREADY_EXIST: {
            name: `There is an educator with '${error.educatorEmail}' in this school please use update`
        }
    };
    if (error.errors) {
        return error.errors.map((e: string) => {
            const errorFormated: IImportError = errors[e] ? errors[e] : errors['UNDEFINED'];
            return { line: line, name: errorFormated.name, description: errorFormated.description };
        });
    }
    if (error.emails) {
        return error.emails.map((email) => {
            return {
                line: line,
                name: `Learner email ${email} is not found.`,
                description: 'Please create a Learner first.'
            };
        });
    }

    const errorFormated: IImportError = errors[error.message] ? errors[error.message] : errors['UNDEFINED'];
    return [{ line: line, name: errorFormated.name, description: errorFormated.description }];
};

const defaultShema = {
    'Last name': yup.string().required('LAST_NAME_EMPTY'),
    'First name': yup.string().required('FIRST_NAME_EMPTY'),
    Email: yup
        .string()
        .required('EMAIL_EMPTY')
        .email('EMAIL_NOT_VALID'),
    'Phone number': yup.string().typeError('INCORRECT_PHONE_NUMBER')
};

const learnerFormater = async (user: ILearnerFromFile): Promise<IStudent> => {
    const shema = yup.object().shape({
        ...defaultShema,
        Gender: yup
            .mixed()
            .oneOf(['male', 'female'], 'GENDER_TYPE')
            .required('GENDER_EMPTY'),
        //'Mobile number': yup.number().typeError('MOBILE_NOT_NUMBER')
    });
    await shema.validate(user, { abortEarly: false });
    return {
        lastName: user['Last name'],
        name: user['First name'],
        email: user['Email'],
        gender: user['Gender'] === 'male' ? 'male' : 'female',
        middleName: user['Middle name'],
        birthday: user['Date of birth'],
        localAddress: user['Local address'],
        phoneNumber: user['Phone number'],
        msisdn: user['Mobile number'],
        address: user['Permanent address'],
        nationality: user['Nationality'],
        religion: user['Religion'],
        race: user['Race'],
        passportBirthCertificate: user['Passport/Birth certificate'],
        other: user['Other']
    };
};

const parentFormater = async (user: IParentFromFile): Promise<IParent> => {
    user.learner_emails = user['Learner email']
        ? user['Learner email'].split(',').map((email: string) => email.trim())
        : [];
    let shema = yup.object().shape({
        ...defaultShema,
        learner_emails: yup
            .array()
            .of(
                yup
                    .string()
                    .required('LEARNER_EMAIL_EMPTY')
                    .email('LEARNER_EMAIL_NOT_VALID')
            )
            .required('LEARNER_EMAIL_EMPTY'),
        'Family role': yup
            .mixed()
            .nullable()
            .notRequired()
            .oneOf(['mother', 'father', 'guardian'], 'FAMILY_ROLE_INCORRECT')
    });
    await shema.validate(user, { abortEarly: false });

    return {
        lastName: user['Last name'],
        name: user['First name'],
        email: user['Email'],
        gender: user['Gender'] === 'male' ? 'male' : 'female',
        middleName: user['Middle name'],
        msisdn: user['Mobile number'],
        birthday: user['Date of birth'],
        address: user['Address'],
        phoneNumber: user['Phone number'],
        passportBirthCertificate: user['Passport/ICNo'],
        nationality: user['Nationality'],
        familyRole:
            user['Family role'] === 'mother' ? 'mother' : user['Family role'] === 'father' ? 'father' : 'guardian',
        designation: user['Designation/Occupation'],
        company: user['Company'],
        companyAddress: user['Company address'],
        studentsEmails: Array.from(new Set(user.learner_emails)),
        parentsStatus: user['Marital status'],
    };
};

const educatorFormater = async (user: IEducatorFromFile): Promise<ITeacher> => {
    let shema = yup.object().shape({
        ...defaultShema,
        Segment: yup.string().required('SEGMENT_EMPTY'),
        Level: yup.string().required('LEVEL_EMPTY'),
        'Course name': yup.string().required('COURSE_EMPTY'),
        'Year of graduation': yup
            .number()
            .nullable()
            .notRequired()
            .min(1900, 'GRADUATION_INCORRECT')
            .max(dayjs().format('YYYY'), 'GRADUATION_INCORRECT'),
        'Last career training': yup
            .number()
            .nullable()
            .notRequired()
            .min(1900, 'GRADUATION_INCORRECT')
            .max(dayjs().format('YYYY'), 'GRADUATION_INCORRECT')
    });
    await shema.validate(user, { abortEarly: false });

    return {
        lastName: user['Last name'],
        name: user['First name'],
        email: user['Email'],
        middleName: user['Middle name'],
        birthday: user['Date of birth'],
        msisdn: user['Phone number'],
        address: '',
        education: user['Education'],
        university: user['University'],
        speciality: user['Speciality'],
        category: user['Category'],
        graduationYear: user['Year of graduation'],
        trainingYear: user['Last career training']
    };
};

const createLearner = async (data: ILearnerFromFile, transaction: Transaction, options: any): Promise<number> => {
    const user = await learnerFormater(data as ILearnerFromFile);
    user.id = await roleRepo.createUser(user, undefined, transaction, true);
    const learnerAndEducatorInClassValid = await roleRepo.checkLearnerAndEducatorInClass(user.id,
        [{ class_id: options.classId }], []);
    if (!learnerAndEducatorInClassValid) {
        const errorr: any = new Error("User cannot be both educator and learner in the same class");
        errorr.code = 500;
        throw errorr;
    }

    const id = await roleRepo.addUserRole(user.id, 'LEARNER', { school_id: options.user.school.id }, transaction);

    const learners = await models.pupil.findOrCreate({
        where: { id: user.id },
        defaults: {
            id: user.id,
            local_address: user.localAddress,
            local_msisdn: user.phoneNumber,
            passport_id: user.passportBirthCertificate,
            nationality: user.nationality,
            religion: user.religion,
            race: user.race,
            other: user.other
        },
        transaction
    });

    //#region check existing in other class in this academic year
    let msgOptions = {
        fromYearId: undefined,
        toYearId: options.academicYearId,
        classId: options.classId,
        msgType: 'CREATED',
        oldClassId: null
    };
    const role: any = await models.user_role.findOne({
        where: {
            user_id: user.id,
            school_id: options.user.school.id,
        },
        include: [{
            model: models.role,
            where: {
                code: 'LEARNER',
                disabled: 0,
            }
        }],
        transaction
    });
    var otherClassInThisYear = await models.pupil_class.findAll({
        where: {
            pupil_id: role.id,
            disabled: 0
        },
        include: [{
            attributes: ["id"],
            model: models.class,
            where: {
                year_id: options.academicYearId,
                disabled: 0,
            }
        }],
        transaction
    });
    if (otherClassInThisYear && otherClassInThisYear.length > 0) {
        var pupClassIds = otherClassInThisYear.map((item) => {
            return item.id;
        });
        await models.pupil_class.update({ disabled: 1 }, { where: { id: pupClassIds }, transaction });
        await models.pupil_group.update({ disabled: 1 }, { where: { pupil_class_id: pupClassIds }, transaction });
        msgOptions.msgType = 'UPDATED';
        msgOptions.oldClassId = otherClassInThisYear[0].class_id;
    }
    //#endregion

    await pupilClassRepo.linkPupilToClasses(id, [options.classId], transaction, true);
    await sendMessage(user.id, transaction, msgOptions, { forceUpdate: options.user.school.id });

    return user.id;
};

const createTeacher = async (data: IEducatorFromFile, transaction: Transaction, options: any): Promise<number> => {
    const user = await educatorFormater(data as IEducatorFromFile);
    user.id = await roleRepo.createUser(user, undefined, transaction, true);
    //#region educator check in school 
    const roles = await models.role.findAll({
        where: {
            disabled: 0,
            sub_code: ['EDUCATOR', 'CURRICULUM_DIRECTOR']
        },
        order: [['code', 'ASC']],
        attributes: ['id', 'code']
    });

    let availableRoles = roles.filter((role): boolean => !role.code.startsWith('ACCOUNT'));
    let oldRoles = await models.user_role.findAll({
        where: {
            user_id: user.id,
            school_id: options.user.school.id,
            role_id: availableRoles.map(role => role.id)
        }
    });
    if (oldRoles && oldRoles.length) {
        const activeRoles = oldRoles.filter(role => role.disabled == 0 && role.archived == 0);
        const disabledRoles = oldRoles.filter(role => role.disabled == 1 && role.archived == 0);
        const archivedRoles = oldRoles.filter(role => role.disabled == 1 && role.archived == 1);
        if (activeRoles && activeRoles.length || disabledRoles && disabledRoles.length) {
            var tempError: any = new Error('TEACHER_ALREADY_EXIST');
            tempError.code = 500;
            tempError.educatorEmail = user.email;
            throw tempError;
        }
        if (archivedRoles && archivedRoles.length) {
            var updatedId = await sequelize.query(`UPDATE user_role
                SET school_id = NULL,description=${options.user.school.id}
                WHERE id IN (${archivedRoles.map(arole => arole.id)})`,
                { type: sequelize.QueryTypes.UPDATE, transaction });
        }
    }
    //#endregion

    // prettier-ignore
    const [level, course] = await Promise.all([
        models.segment_level.findOne({
            attributes: ['id'],
            where: { disabled: 0 },
            include: [{
                model: models.level,
                where: { name: data['Level'], disabled: 0 }
            }, {
                model: models.segment,
                where: { name: data['Segment'], disabled: 0, school_id: options.user.school.id }
            }]
        }),
        models.subject.findOne({
            attributes: ['id'],
            where: { name: data['Course name'], is_disabled: 0 },
            include: [{
                model: models.school_subject,
                where: {
                    disabled: 0,
                    [Op.or]: [{ school_id: options.user.school.id }, { branch_id: options.user.school.branchId }]
                }
            }]
        })
    ]);
    if (!level) {
        throw new Error('LEVEL_EMPTY');
    }
    if (!course) {
        throw new Error('COURSE_EMPTY');
    }

    await models.teacher.update({
        education: user.education,
        university: user.university,
        speciality: user.speciality,
        category: user.category,
        graduation_year: new Date(`${user.graduationYear}-01-01 12:00:00`),
        training_year: new Date(`${user.trainingYear}-01-01 12:00:00`),
    }, {
        where: {
            id: user.id,
        },
        transaction
    });

    // prettier-ignore
    user.teacherSubjects = [{
        levelsIds: [level.id],
        subjectId: course.id
    }];
    user.schoolId = options.user.school.id;
    await roleRepo.createTeachers(user.id, [user], transaction, true);

    return user.id;
};

const createParent = async (data: IParentFromFile, transaction: Transaction, options: any): Promise<number> => {
    const user = await parentFormater(data as IParentFromFile);
    user.id = await roleRepo.createUser(user, undefined, transaction, true);
    //#region check parent in this school
    let oldRole = await models.user_role.findOne({
        where: {
            user_id: user.id,
        },
        include: [{
            model: models.role,
            where: { code: 'PARENT', disabled: 0 }
        }]
    });
    if (oldRole) {
        var studentsInThisSchool = await sequelize.query(`SELECT urs.user_id FROM parent_pupil pp
        LEFT JOIN user_role urs ON urs.id = pp.pupil_id
        WHERE pp.parent_id = ${oldRole.id} AND urs.school_id = ${options.user.school.id} AND pp.archived =0 AND urs.disabled = 0 AND urs.archived = 0`,
            { type: sequelize.QueryTypes.SELECT, transaction });
        if (studentsInThisSchool && studentsInThisSchool.length) {
            // throw new EmailError(
            //     'PARENT_ALREADY_EXIST',
            //     [user.email]
            // );
            var tempError: any = new Error('PARENT_ALREADY_EXIST');
            tempError.code = 500;
            tempError.parentEmail = user.email;
            throw tempError;
        }
    }
    //#endregion

    await models.parent.update({
        nationality: user.nationality,
        passport_id: user.passportBirthCertificate,
        phone_number: user.phoneNumber,
        designation: user.designation,
        company: user.company,
        company_address: user.companyAddress,
        material_status: user.parentsStatus,
        direct: direct[user.familyRole],
    }, {
        where: {
            id: user.id,
        },
        transaction
    });

    const id = await roleRepo.addUserRole(user.id, 'PARENT', {}, transaction);

    // prettier-ignore
    const learners = await models.user.findAll({
        where: { email: user.studentsEmails, disabled: 0 },
        include: [{
            model: models.user_role,
            where: { school_id: options.user.school.id, disabled: 0, archived: 0 },
            include: [{
                model: models.role,
                where: { code: 'LEARNER', disabled: 0 }
            }]
        }]
    });

    if (user.studentsEmails.length !== learners.length) {
        throw new EmailError(
            'LEARNER_NOT_FOUND',
            user.studentsEmails.filter((email) => !learners.some((learner) => {
                return email === learner.email;
            }))
        );
    }

    const learnerLinks: ([parent_pupilInstance, boolean])[] = [];

    for await (const learner of learners) {
        // prettier-ignore
        learnerLinks.push(
            await models.parent_pupil.findOrCreate({
                where: { parent_id: id, pupil_id: Number(learner['user_roles'][0].id) },
                defaults: {
                    id: null, parent_id: id, pupil_id: Number(learner['user_roles'][0].id),
                    archived: 0, rank: 0, disabled: 0, created: new Date()
                },
                transaction
            })
        );
    }

    await models.parent_pupil.update({ disabled: 0, archived: 0 }, {
        where: {
            id: {
                [Op.in]: learnerLinks.map((link): number => link[0].id),
            }
        },
        transaction,
    });

    return user.id;
};

export async function userParser(file: any, options: IImportOptions): Promise<void> {
    const users = await parseFile(file.tempFilePath);
    const result: IImportResult = {
        id: uuidv4(),
        mode: options.role,
        progress: {
            value: 0,
            parsed: 0,
            notParsed: 0,
            lines: users.length,
            errors: []
        },
        structure: {
            city: options.user.school.city.name,
            school: options.user.school.name,
            segment: options.segmentName ? options.segmentName : null,
            level: options.levelName ? options.levelName : null,
            class: options.className ? options.className : null
        }
    };
    parsers.set(result.id, result);
    if (options.role === 'learner') {
        options.academicYearId = Number(options.academicYearId);
        options.segmentId = Number(options.segmentId);
        options.levelId = Number(options.levelId);
        options.classId = Number(options.classId);
    }
    for await (const [key, data] of users.entries()) {
        if (!parsers.has(result.id)) {
            break;
        }
        try {
            const transaction: Transaction = await sequelize.transaction();
            try {
                let userId;
                switch (options.role) {
                    case 'educator':
                        userId = await createTeacher(data as IEducatorFromFile, transaction, options);
                        break;
                    case 'learner':
                        userId = await createLearner(data as ILearnerFromFile, transaction, options);
                        break;
                    case 'parent':
                        userId = await createParent(data as IParentFromFile, transaction, options);
                        break;
                }
                //if (options.role == 'learner') {
                // let msgOptions = {
                //     fromYearId: undefined,
                //     toYearId: options.academicYearId,
                //     classId: options.classId,
                //     msgType: 'CREATED',
                //     oldClassId: null
                // };
                // const role: any = await models.user_role.findOne({
                //     where: {
                //         user_id: userId,
                //         school_id: options.user.school.id,
                //     },
                //     include: [{
                //         model: models.role,
                //         where: {
                //             code: 'LEARNER',
                //             disabled: 0,
                //         }
                //     }],
                //     transaction
                // });
                // var otherClassInThisYear = await models.pupil_class.findAll({
                //     where: {
                //         pupil_id: role.id,
                //         disabled: 0
                //     },
                //     include: [{
                //         attributes: ["id"],
                //         model: models.class,
                //         where: {
                //             year_id: options.academicYearId,
                //             disabled: 0,
                //         }
                //     }],
                // });
                // if (otherClassInThisYear && otherClassInThisYear.length > 0) {
                //     var pupClassIds = otherClassInThisYear.map((item) => {
                //         return item.id;
                //     });
                //     await models.pupil_class.update({ disabled: 1 }, { where: { id: pupClassIds } });
                //     await models.pupil_group.update({ disabled: 1 }, { where: { pupil_class_id: pupClassIds } });
                //     msgOptions.msgType = 'UPDATED';
                //     msgOptions.oldClassId = otherClassInThisYear[0].class_id;
                // }
                // await sendMessage(userId, transaction, msgOptions);
                //}
                if (options.role !== 'learner') {
                    await sendMessage(userId, transaction, undefined, { school: options.user.school });
                }

                await transaction.commit();
                result.progress.parsed += 1;
            } catch (error) {
                log.error(`Error import user ${data.Email}: ${error}`);
                await transaction.rollback();
                throw error;
            }
        } catch (err) {
            result.progress.errors.push(...errorFormater(key + 3, err, data));
            result.progress.notParsed += 1;
        }
        result.progress.value = Math.floor((100 / result.progress.lines) * (key + 1));
        if (key % 5 == 0) {
            emit({ msg: result, userId: options.user.oauthId, event: 'file_received' });
        }
    }

    if (parsers.has(result.id)) {
        result.progress.value = 100;
        parsers.delete(result.id);
    }
    emit({ msg: result, userId: options.user.oauthId, event: 'file_received' });
}
export async function learnerImporterFromList(learners: any,
    options: IImportOptions & { sameYear: boolean, toYear?: number, fromYear?: number }): Promise<void> {
    const users = learners;
    const result: IImportResult = {
        id: uuidv4(),
        mode: options.role,
        progress: {
            value: 0,
            parsed: 0,
            notParsed: 0,
            lines: users.length,
            errors: []
        },
        structure: {
            city: options.user.school.city.name,
            school: options.user.school.name,
            segment: options.segmentName ? options.segmentName : null,
            level: options.levelName ? options.levelName : null,
            class: options.className ? options.className : null
        }
    };
    parsers.set(result.id, result);
    if (options.role === 'learner') {
        options.segmentId = Number(options.segmentId);
        options.levelId = Number(options.levelId);
        options.classId = Number(options.classId);
    }
    var errorUsers = [];
    for await (const [key, data] of users.entries()) {
        if (!parsers.has(result.id)) {
            break;
        }
        const transaction: Transaction = await sequelize.transaction();
        let userId = data.id;
        let msgOptions = {
            fromYearId: options.fromYear,
            toYearId: options.toYear,
            classId: options.classId,
            msgType: 'CREATED',
            oldClassId: null,
            subclasses: []
        };
        if (options.role === 'learner') {
            const learnerAndEducatorInClassValid = await roleRepo.checkLearnerAndEducatorInClass(userId,
                [{ class_id: options.classId }], []);
            if (!learnerAndEducatorInClassValid) {
                errorUsers.push(data);
                transaction.rollback();
            } else {
                const role: any = await models.user_role.findOne({
                    where: {
                        user_id: userId,
                        school_id: options.user.school.id,
                    },
                    include: [{
                        model: models.role,
                        where: {
                            code: 'LEARNER',
                            disabled: 0,
                        }
                    }],
                    transaction
                });
                var otherClassInThisYear = await models.pupil_class.findAll({
                    where: {
                        pupil_id: role.id,
                        disabled: 0
                    },
                    include: [{
                        attributes: ["id"],
                        model: models.class,
                        where: {
                            year_id: options.toYear,
                            disabled: 0,
                        }
                    }],
                });
                if (otherClassInThisYear && otherClassInThisYear.length > 0) {
                    var pupClassIds = otherClassInThisYear.map((item) => {
                        return item.id;
                    });

                    await models.pupil_class.update({ disabled: 1 }, { where: { id: pupClassIds } });
                    await models.pupil_group.update({ disabled: 1 }, { where: { pupil_class_id: pupClassIds } });
                    msgOptions.msgType = 'UPDATED';
                    msgOptions.oldClassId = otherClassInThisYear[0].class_id;
                }

                await pupilClassRepo.linkPupilToClasses(role.id, [options.classId], transaction, true);
                await sendMessage(userId, transaction, msgOptions);

                await transaction.commit();
            }
        }
    }
    if (errorUsers.length) {
        let strUsers = '';
        errorUsers.forEach((x, index) => {
            const seprator = index + 1 === errorUsers.length ? '' : ', ';
            strUsers += `${x.name} ${x.lastName}${seprator}`
        });
        const errorr: any = new Error(`${strUsers} cannot be both educator and learner in the same class`);
        errorr.code = 500;
        throw errorr;
    }
}
