import { flatten, groupBy, keyBy } from 'lodash';
import { Transaction } from 'sequelize';

import models, { sequelize } from '../db';
import { IAccountRole, IClass, ISubject, ITeacherRole, ITeacherSubject, IUser, ILearnerRole } from '../../sdk/interfaces';

import beed, { BeedError } from '../services/beed';
import { IMessage, IMessageBodyStudent } from './messages';

import {
    ParentPupilRepository,
    PupilClassRepository,
    TeacherHeadClassRepository,
    TeacherHeadSubjectRepository,
    TeacherSubjectRepository,
    UserRoleRepository
} from './relation';

const parentPupilRepo = new ParentPupilRepository();
const teacherSubjectRepo = new TeacherSubjectRepository();
const teacherHeadClassRepo = new TeacherHeadClassRepository();
const teacherHeadSubjectRepo = new TeacherHeadSubjectRepository();
const userRoleRepository = new UserRoleRepository();
const pupilClassRepo = new PupilClassRepository();

export class RoleRepository {
    private async registerUser(user: IUser, redirect?: string, transaction: Transaction | null = null): Promise<any> {
        if (user.email.endsWith('.test')) {
            return {
                external_id: null,
                activated: 1
            };
        }

        // DEFAULT url to redirect user after registration
        if (!redirect) {
            const iface = await models.interface.findOne({
                where: { code: 'DIARY' },
                transaction
            });

            redirect = iface.pass_through_auth_url;
        }

        const beedUser = await beed.createNewUser({
            username: user.email,
            Email: user.email,
            FirstName: user.name,
            lastname: user.lastName,
            phonenumber: user.msisdn,
            ReturnUrl: redirect
        });

        return {
            external_id: beedUser.id,
            activated: 1 // FIXME TODO replace with 0
        };
    }

    public async createUser(user: IUser, redirect?, transaction: Transaction | null = null, returnExistUserId?: boolean): Promise<number> {
        if (!user.email) {
            throw new BeedError('Empty email', 400)
        }

        const existUser = await models.user.findOne({
            attributes: ['id', 'disabled', 'activated'],
            where: {
                email: user.email
            },
            transaction
        });
        if (existUser) {
            if (!returnExistUserId) {
                throw new BeedError('User with such email already exists', 500)
            }
            if (existUser.disabled === 1) {
                throw new Error('USER_ALREDY_DISABLED');
            }

            try {
                await models.user.update({
                    name: user.name,
                    surname: user.lastName,
                    middle_name: user.middleName,
                    msisdn: user.msisdn || null,
                    address: user.address,
                    birthday: user.birthday,
                    gender: user.gender && user.gender.toLowerCase(),
                }, {
                    where: {
                        id: existUser.id,
                    },
                    transaction,
                });
            } catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError') {
                    throw new Error('MOBILE_ALREADY_EXISTS');
                }
            }

            return existUser.id;
        }

        const registatedUser = await this.registerUser(user, redirect, transaction);

        const userModel = await models.user.create({
            id: null,
            name: user.name,
            surname: user.lastName,
            middle_name: user.middleName,
            msisdn: user.msisdn || null, // HACK to pass unique check on empty value
            email: user.email,
            address: user.address,
            birthday: user.birthday,
            gender: user.gender && user.gender.toLowerCase(),
            disabled: 0,
            reset_pass: 0,
            two_factor_auth: 0,
            type: 'lms',
            ...registatedUser
        }, {
            transaction
        }).catch((error): any => {
            if (error.message === 'Validation error') {
                throw new BeedError(`${error.errors[0].path} '${error.errors[0].value}' has already been taken.`, 409);
            }

            throw error;
        });

        await Promise.all([
            models.parent.create({
                id: userModel.id
            }, {
                transaction
            }),
            models.teacher.create({
                id: userModel.id
            }, {
                transaction
            }),
        ]);

        return userModel.id;
    }
    public async updateUser(id: number, user: IUser, transaction: Transaction | null = null) {
        if (!user.email) {
            throw new BeedError('Email not defined', 409);
        }

        await models.user.update({
            name: user.name,
            surname: user.lastName,
            middle_name: user.middleName,
            msisdn: user.msisdn,
            email: user.email,
            address: user.address,
            birthday: user.birthday,
            gender: user.gender,
        }, {
            where: { id },
            transaction
        }).catch((error): void => {
            if (error.message === 'Validation error') {
                throw new BeedError(`${error.errors[0].path} '${error.errors[0].value}' has already been taken.`, 409);
            }

            throw error;
        });

        return await this.getUserMessage(id, transaction);
    }
    public async addUserRole(user_id: number, role: string, etc?: { school_id?: number; branch_id?: number }, transaction: Transaction | null = null): Promise<number> {
        const roleModel = await models.role.findOne({
            where: {
                disabled: 0,
                code: role,
            },
            transaction
        });

        if (!roleModel) {
            throw new Error(`role ${role} not found in db`);
        }

        const userRole = await models.user_role.findOne({
            where: {
                user_id,
                role_id: roleModel.id,
                ...etc,
            }
        });

        if (userRole) {
            await models.user_role.update({
                disabled: 0,
                archived: 0,
                update_date: new Date(),
            }, {
                where: { id: userRole.id },
                transaction
            });
            return userRole.id;
        }

        const userRoleModel = await models.user_role.create({
            id: null,
            user_id,
            role_id: roleModel.id,
            disabled: 0,
            update_date: new Date(),
            archived: 0,
            ...etc,
            assignment_date: new Date(),
        }, {
            transaction
        });

        await userRoleModel.reload({
            transaction
        });

        return userRoleModel.id;
    }
    private async getRole(code, transaction: Transaction | null = null): Promise<{ id: number }> {
        return models.role.findOne({
            where: {
                code,
                disabled: 0,
            },
            transaction
        });
    }
    private async linker(code, userId, schools = [], branches = [], transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<{ id: number; school_id: number }[]> {
        const role = await this.getRole(code, transaction);

        return userRoleRepository.update2({
            user_id: userId,
            role_id: role.id,
        }, [
            ...schools.filter(Boolean).map((id: number): { school_id: number } => ({ school_id: id })),
            ...branches.filter(Boolean).map((id: number): { branch_id: number } => ({ branch_id: id })),
        ], (row): string => [row.school_id, row.branch_id].join(';'), {}, transaction, noStop, toArchive);
    }
    public async createParent(userId, studentsIds = [], transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean, schoolId?: number): Promise<void> {
        const parentRole = await this.getRole('PARENT', transaction);

        const parentsRoles = await userRoleRepository.update2({
            user_id: userId,
            role_id: parentRole.id,
        }, [{
            branch_id: null,
            school_id: null,
        }], (row): string => [row.branch_id, row.school_id].join(';'), {}, transaction);

        await Promise.all(parentsRoles.map((userRole): Promise<void> => parentPupilRepo.linkParentToPupils(userRole.id, studentsIds, transaction, noStop, toArchive, schoolId)));
    }
    public async createAdmins(userId, schoolsIds = [], branchesIds = [], transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<void> {
        await this.linker('ADMINISTRATOR', userId, schoolsIds, branchesIds, transaction, noStop, toArchive);
    }
    public async createAccountAdministrator(userId: number, branchesId: number, transaction: Transaction | null = null): Promise<void> {
        await this.linker('ACCOUNT_ADMINISTRATOR', userId, [], [branchesId], transaction);
    }
    public async createAccountians(userId: number, branchId: number, roles: IAccountRole, transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<void> {
        await Promise.all([
            this.linker('ACCOUNT_DIRECTOR', userId, [], roles.isDirector ? [branchId] : [], transaction, noStop, toArchive),
            this.linker('ACCOUNT_CURRICULUM_DIRECTOR', userId, [], roles.isCurriculumDirector ? [branchId] : [], transaction, noStop, toArchive),
        ]);
    }
    public async setDirectorSchools(userId: number, schoolsIds: number[], transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<void> {
        await this.linker('DIRECTOR', userId, schoolsIds, [], transaction, noStop, toArchive);
    }
    public async setCurriculumDirectorSchools(userId: number, schoolsIds: number[], transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<void> {
        await this.linker('CURRICULUM_DIRECTOR', userId, schoolsIds, [], transaction, noStop, toArchive);
    }
    public async setHeadOfSubjects(userId, schoolTeachers, transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<void> {
        const teachersBySchool = keyBy(schoolTeachers, 'schoolId');

        const userRoles = await this.linker('HEAD_OF_DEPARTMENT', userId, schoolTeachers.map((teacher): number => teacher.schoolId), [], transaction, noStop, toArchive);

        await Promise.all(userRoles.map((userRole): Promise<void> => {
            const teacher = teachersBySchool[userRole.school_id];

            return teacherHeadSubjectRepo.linkHeadTeacherToSubjects(userRole.id, teacher ? teacher.headOfSubjectsIds : [], transaction, noStop);
        }));
    }
    public async setTeachersSchools(userId: number, schoolTeachers, transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<void> {
        const teachersBySchool = keyBy(schoolTeachers, 'schoolId');

        const userRoles = await this.linker('EDUCATOR', userId, schoolTeachers.map(teacher => teacher.schoolId), [], transaction, noStop, toArchive);

        await Promise.all(userRoles.map((userRole): Promise<void> => {
            const teacher = teachersBySchool[userRole.school_id];

            return teacherSubjectRepo.linkTeacherToSubjects(userRole.id, teacher ? flatten(
                teacher.teacherSubjects ? teacher.teacherSubjects.map(
                    (row): any => row.levelsIds.map(
                        (level_id): any => ({
                            level_id,
                            subject_id: row.subjectId,
                        })
                    )
                ) : []
            ) : [], transaction, noStop);
        }));
    }
    public async linkClassTeacher(classId: number, userId: number, transaction: Transaction | null = null): Promise<void> {
        // getting role row
        const role = await models.role.findOne({
            where: {
                disabled: 0,
                code: 'HOMEROOM_EDUCATOR'
            },
            transaction
        });

        //getting current head row
        const userRolesRefs = await models.teacher_head_class.findAll({
            where: {
                class_id: classId,
                is_assigned: 0,
            },
            transaction
        });

        // destroy last head 
        await models.teacher_head_class.destroy({
            where: {
                id: userRolesRefs.map((row): number => row.id),
                is_assigned: 0,
            },
            transaction
        });

        //check for other academic years 
        const allOldClasses: number = await models.teacher_head_class.count({
            where: {
                teacher_id: userRolesRefs.map((row): number => row.teacher_id),
                disabled: 0
            },
            transaction
        });

        // remove role for old teacher if exist 
        if(allOldClasses <= 0){
            await models.user_role.update({
                disabled: 1
            }, {
                where: {
                    id: userRolesRefs.map((row): number => row.teacher_id)
                },
                transaction
            });    
        }
        if (userId && classId) {
            // get the class
            const klass = await models.class.findOne({
                where: {
                    disabled: 0,
                    id: classId
                },
                transaction
            });

            const userRole = await models.user_role.findOrCreate({
                where: {
                    role_id: role.id,
                    user_id: userId,
                    school_id: klass.school_id,
                },
                defaults: {
                    id: null,
                    role_id: role.id,
                    user_id: userId,
                    school_id: klass.school_id,
                    update_date: new Date(),
                    assignment_date: new Date(),
                    disabled: 0,
                    archived: 0,
                },
                transaction
            });

            if (!userRole[1]) {
                await userRole[0].update({
                    update_date: new Date(),
                    assignment_date: new Date(),
                    disabled: 0,
                    archived: 0,
                }, {
                    transaction
                });
            }
            var thcExist = await models.teacher_head_class.findOne({
                where: {
                    class_id: classId,
                    disabled: 0
                },
                transaction
            });
            if (thcExist) {
                thcExist.update(
                    {
                        class_id: classId,
                        teacher_id: userRole[0].id,
                        disabled: 0,
                        is_assigned: 0,
                    },
                    {
                        transaction
                    }
                )
            } else {
                await models.teacher_head_class.create({
                    id: null,
                    class_id: classId,
                    teacher_id: userRole[0].id,
                    disabled: 0,
                    is_assigned: 0,
                }, {
                    transaction
                });
            }


            const allHeads = await models.teacher_head_class.findAll({
                where: {
                    teacher_id: userRole[0].id,
                    disabled: 0,
                    is_assigned: 0,
                },
                include: [{
                    model: models.class,
                    where: {
                        year_id: klass.year_id
                    }
                }],
                transaction
            });
            if (allHeads.length > 1) {
                throw new Error('Trying to create more than two classes with one teacher')
            }
        }
    }
    public async setHeadOfClassSchools(userId: number, schoolTeachers, transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<void> {
        const role = await models.role.findOne({
            where: {
                disabled: 0,
                code: 'HOMEROOM_EDUCATOR'
            },
            transaction
        });

        const roles = await models.user_role.findAll({
            where: {
                user_id: userId,
                role_id: role.id
            },
            transaction
        });

        await models.teacher_head_class.destroy({
            where: {
                teacher_id: roles.map((row): number => row.id),
            },
            transaction,
        });

        const teachersBySchool = keyBy(schoolTeachers, 'schoolId');

        const userRoles = await this.linker('HOMEROOM_EDUCATOR', userId, schoolTeachers.map((teacher): number => teacher.schoolId), [], transaction, noStop, toArchive);

        await Promise.all(userRoles.map(async (userRole): Promise<void> => {
            const teacher = teachersBySchool[userRole.school_id];

            await teacherHeadClassRepo.linkTeacherToClasses(userRole.id, (teacher && teacher.homeClassId) ? flatten([teacher.homeClassId]) : [], transaction);
        }));
    }
    public async createLearners(userId, learnerRoles: {
        school_id: number;
        class_id: number;
    }[] = [], transaction: Transaction, noStop?: boolean, toArchive?: boolean): Promise<void> {
        const userRoles = await this.linker('LEARNER', userId, learnerRoles.map((data): number => data.school_id), [], transaction, noStop, toArchive);

        await Promise.all(userRoles.map(async (userRole): Promise<void> => {
            await pupilClassRepo.linkPupilToClasses(userRole.id, learnerRoles
                .filter((data): boolean => data.school_id === userRole.school_id)
                .map((data): number => data.class_id),
                transaction, true);
        }))
    }
    public async deleteLearner(userId, schoolId, transaction: Transaction): Promise<void> {
        const role = await this.getRole('LEARNER', transaction);

        const userRole = await models.user_role.findOne({
            attributes: ['id'],
            where: {
                user_id: userId,
                role_id: role.id,
                school_id: schoolId,
            },
            transaction
        }).then(data => data ? data.id : undefined);

        if (!userRole) {
            throw new Error('User role not found');
        }

        await Promise.all([
            models.user_role.update({
                archived: 1,
                disabled: 1,
            }, {
                where: { id: userRole },
                transaction
            }),
            parentPupilRepo.linkPupilToParents(userRole, [], transaction),
            pupilClassRepo.linkPupilToClasses(userRole, [], transaction),
        ]);
    }
    public async createTeachers(userId, teacherRoles = [], transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean): Promise<void> {
        const schoolTeachers = teacherRoles.filter((teacher): boolean => teacher.schoolId);

        await Promise.all([
            this.setDirectorSchools(userId, schoolTeachers
                .filter((teacher: ITeacherRole): boolean => teacher.isDirector)
                .map((teacher: ITeacherRole): number => teacher.schoolId), transaction, noStop, toArchive),
            this.setCurriculumDirectorSchools(userId, schoolTeachers
                .filter((teacher: ITeacherRole): boolean => teacher.isCurriculumDirector)
                .map((teacher: ITeacherRole): number => teacher.schoolId), transaction, noStop, toArchive),
            this.setHeadOfSubjects(userId, schoolTeachers
                .filter((teacher: ITeacherRole): number => teacher.headOfSubjectsIds && teacher.headOfSubjectsIds.length), transaction, noStop, toArchive),
            this.setTeachersSchools(userId, schoolTeachers
                .filter((teacher: ITeacherRole): number => teacher.teacherSubjects && teacher.teacherSubjects.length), transaction, noStop, toArchive),
            this.setHeadOfClassSchools(userId, schoolTeachers
                .filter((teacher: ITeacherRole): number => teacher.homeClassId), transaction, noStop, toArchive),
        ]);
    }
    private async getHeadClassRole(userId, uid: number): Promise<IClass[]> {
        let join = uid != undefined ? `INNER JOIN user_role ur on ur.id=thc.teacher_id` : ``;
        let where = uid != undefined ? `ur.user_id =${uid}` : `thc.teacher_id = ${userId}`;

        const vClasses = await sequelize.query(`SELECT cl.id,cl.name,cl.show_name,cl.year_id, se.id segment_id,se.name segment_name ,
        le.id level_id,le.name level_name,ay.start,ay.end FROM class cl
        LEFT JOIN segment_level sl ON sl.id = cl.level_id 
        LEFT JOIN level le ON le.id = sl.level_id
        LEFT JOIN segment se ON se.id = sl.segment_id
        LEFT JOIN report_year ry ON ry.id = cl.year_id
        LEFT JOIN academic_year ay ON ay.id = ry.academic_year_id
        WHERE cl.id IN (SELECT class_id FROM teacher_head_class thc ${join} WHERE ${where} AND thc.disabled= 0 AND thc.is_assigned= 0) 
        AND cl.disabled = 0`, { type: sequelize.QueryTypes.SELECT });
        if (vClasses && vClasses.length <= 0) return undefined;
        return vClasses.map(item => ({
            id: item.id, name: item.name,
            showName: Boolean(item.show_name),
            level: item.level_id ? { id: item.level_id, name: item.level_name } : undefined,
            segment: item.segment_id ? { id: item.segment_id, name: item.segment_name } : undefined,
            start: item.start,
            end: item.end,
            yearId: item.year_id
        }));
        // const teacherClasses = await models.teacher_head_class.findAll({
        //     where: {
        //         teacher_id: userId,
        //         disabled: 0,
        //         is_assigned: 0,
        //     }
        // });

        // const vClasses = await sequelize.query(`SELECT cl.id,cl.name,cl.show_name, se.id segment_id,se.name segment_name ,
        // le.id level_id,le.name level_name,ay.start,ay.end FROM class cl
        // LEFT JOIN segment_level sl ON sl.id = cl.level_id 
        // LEFT JOIN level le ON le.id = sl.level_id
        // LEFT JOIN segment se ON se.id = sl.segment_id
        // LEFT JOIN report_year ry ON ry.id = cl.year_id
        // LEFT JOIN academic_year ay ON ay.id = ry.academic_year_id
        // WHERE cl.id IN (${teacherClasses.map((row): number => row.class_id)}) AND cl.disabled = 0`
        //     , { type: sequelize.QueryTypes.SELECT });



        // const classes = await models.class.findAll({
        //     where: {
        //         id: teacherClasses.map((row): number => row.class_id),
        //         disabled: 0
        //     }
        // });

        // if (classes[0]) {
        //     const headClass = classes[0];

        //     const segmentLevel = await models.segment_level.findOne({
        //         where: {
        //             disabled: 0,
        //             id: headClass.level_id,
        //         },
        //     });

        //     const level = await models.level.findOne({
        //         where: {
        //             id: segmentLevel.level_id
        //         }
        //     });

        //     const segment = await models.segment.findOne({
        //         where: {
        //             id: segmentLevel.segment_id
        //         }
        //     });

        //     const ry = await models.report_year.findOne({
        //         where: {
        //             id: headClass.year_id
        //         }
        //     });

        //     const ay = await models.academic_year.findOne({
        //         where: {
        //             id: ry.academic_year_id
        //         }
        //     });
        //     return {
        //         id: headClass.id,
        //         name: headClass.name,
        //         showName: Boolean(headClass.show_name),
        //         level: level ? {
        //             id: level.id,
        //             name: level.name,
        //         } : undefined,
        //         segment: segment ? {
        //             id: segment.id,
        //             name: segment.name
        //         } : undefined,
        //         start: ay.start,
        //         end: ay.end,

        //     };
        // }
    }

    private async getHeadSubjectRole(userId): Promise<ISubject[]> {
        const s = await models.teacher_subject.findAll({
            where: {
                teacher_id: userId,
                level_id: null, // HeadSubject
                disabled: 0,
            },
        });
        let subj: ISubject[] = undefined;
        const ids = s.map(({ subject_id }): number => subject_id);
        if (ids && ids.length > 0)
            subj = await models.subject.findAll({
                where: {
                    id: ids,
                    is_disabled: 0
                },
            });

        return subj;
    }
    private async getTeachersRoles(userId): Promise<ITeacherSubject[]> {
        const teacherSubjects = await models.teacher_subject.findAll({
            where: {
                teacher_id: userId,
                disabled: 0,
            }
        });

        const segmentLevelsById = keyBy(await models.segment_level.findAll({
            where: {
                id: teacherSubjects.map((row): number => row.level_id),
                disabled: 0
            },
            include: [{
                model: models.level,
                where: { disabled: 0 }
            }]
        }), 'id');

        const teachersBySubjectsById: any = groupBy(teacherSubjects, 'subject_id')

        const subjectsById = keyBy(await models.subject.findAll({
            where: {
                id: Object.keys(teachersBySubjectsById),
                is_disabled: 0
            },
        }), 'id');

        return Object.keys(teachersBySubjectsById).map(subjectId => {
            const levels = teachersBySubjectsById[subjectId]
                .map(teacherSubject => segmentLevelsById[teacherSubject.level_id])
                .filter(Boolean)
                .map(segmentLevel => ({
                    id: segmentLevel.id,
                    name: segmentLevel.level.name
                }));
            return {
                subject: subjectsById[subjectId],
                levels,
            }
        });
    }
    private async getSchoolTeacherRoles(roles: any[]): Promise<ITeacherRole> {
        const rolesMap = new Map(roles.map((userRole): [string, any] => [userRole.role.code, userRole]));

        const headSubjectRole: any = rolesMap.get('HEAD_OF_DEPARTMENT');

        const teacherRole: any = rolesMap.get('EDUCATOR');

        let headClassRole: any = rolesMap.get('HOMEROOM_EDUCATOR');

        let [homeClass, headOfSubjects, teacherSubjects] = await Promise.all([
            headClassRole && this.getHeadClassRole(headClassRole.id, undefined),
            headSubjectRole && this.getHeadSubjectRole(headSubjectRole.id),
            teacherRole && this.getTeachersRoles(teacherRole.id)
        ]);

        // if (homeClass == undefined) {
        //     [homeClass] = await Promise.all([this.getHeadClassRole(undefined, roles[0].user_id)]);
        // }

        return {
            isDirector: rolesMap.has('DIRECTOR'),
            isCurriculumDirector: rolesMap.has('CURRICULUM_DIRECTOR'),
            homeClass,
            headOfSubjects,
            teacherSubjects,
        };
    }
    public async getTeachersUserRoles(userId): Promise<ITeacherRole[]> {

        //Getting all the teacher roles for this userId 
        const teachers = await models.user_role.findAll({
            where: {
                user_id: userId,
                branch_id: null,
                disabled: 0,
                archived: 0,
            },
            include: [
                {
                    model: models.role,
                    where: {
                        sub_code: ['EDUCATOR', 'CURRICULUM_DIRECTOR'],
                        disabled: 0
                    }
                },
                {
                    required: false,
                    model: models.school,
                    include: [
                        {
                            model: models.branch,
                            required: false
                        },
                        models.city
                    ]
                },
            ]
        });


        const schools = keyBy(teachers.filter((role): number => role.school_id).map((role: any): any => role.school), 'id');

        const teachersHash = groupBy(teachers, 'school_id');
        const result = await Promise.all(Object.keys(schools).map((schoolId: string): Promise<ITeacherRole> => {
            return this.getSchoolTeacherRoles(teachersHash[schoolId])
                .then((teacher: ITeacherRole): ITeacherRole => {
                    const school = schools[schoolId];
                    if (teacher.isDirector ||
                        teacher.isCurriculumDirector ||
                        (teacher.homeClass && teacher.homeClass.length > 0) ||
                        (teacher.headOfSubjects && teacher.headOfSubjects.length > 0) ||
                        (teacher.teacherSubjects && teacher.teacherSubjects.length > 0)) {
                        return {
                            school: {
                                ...this.mapBranchSchool(school)
                            },
                            ...teacher,
                        };
                    } else {
                        return undefined;
                    }


                });
        }));

        return result.filter(x => x != undefined);
    }
    public async isAccountAdministrator(userId: number): Promise<boolean> {
        return models.user_role.findOne({
            where: {
                user_id: userId,
                disabled: 0,
                archived: 0,
            },
            include: [{
                model: models.role,
                where: {
                    disabled: 0,
                    code: 'ACCOUNT_ADMINISTRATOR'
                }
            }]
        }).then(Boolean);
    }
    private mapBranchSchool(row) {
        return row ? {
            id: row.id,
            name: row.name,
            city: row.city ? {
                id: row.city.id,
                name: row.city.name
            } : undefined
        } : undefined;
    }

    public async getUserRoles(id: number, transaction: Transaction, yearId?: number) {
        const user = {
            accounts: {},
            schools: {},
            isParent: [],
        };

        const roles: any[] = await models.user_role.findAll({
            where: {
                user_id: id,
            },
            include: [{
                model: models.role
            }],
            transaction
        });

        for (const role of roles) {
            if (role.branch_id) {
                let branch = user.accounts[role.branch_id];
                if (!branch) {
                    user.accounts[role.branch_id] = {
                        admin: {},
                        teacher: {},
                    };
                    branch = user.accounts[role.branch_id];
                }

                if (!role.disabled) {
                    if (role.role.code === 'ACCOUNT_ADMINISTRATOR') {
                        branch.admin.admin = true;
                    } else if (role.role.code === 'ACCOUNT_DIRECTOR') {
                        branch.teacher.director = true;
                    } else if (role.role.code === 'ACCOUNT_CURRICULUM_DIRECTOR') {
                        branch.teacher.curriculumDirector = true;
                    }
                }
            } else if (role.school_id) {
                let school = user.schools[role.school_id];
                if (!school) {
                    user.schools[role.school_id] = {
                        admin: {},
                        teacher: {
                            educator: [],
                            headOfDepartment: [],
                            homeroomEducator: [],
                        },
                        student: {}
                    };

                    school = user.schools[role.school_id];
                }

                if (!role.archived) {
                    if (role.role.code === 'ADMINISTRATOR') {
                        school.admin.admin = !role.disabled;
                    } else if (role.role.code === 'DIRECTOR') {
                        school.teacher.director = !role.disabled;
                    } else if (role.role.code === 'CURRICULUM_DIRECTOR') {
                        school.teacher.curriculumDirector = !role.disabled;
                    } else if (role.role.code === 'EDUCATOR') {
                        school.teacher.teacher = true;

                        const subjects = await models.teacher_subject.findAll({
                            where: {
                                teacher_id: role.id,
                            },
                            transaction
                        });

                        for (const subject of subjects) {
                            school.teacher.educator.push({
                                subjectId: subject.subject_id,
                                levelId: subject.level_id,
                                status: !subject.disabled
                            });
                        }
                    } else if (role.role.code === 'HEAD_OF_DEPARTMENT') {
                        const subjects = await models.teacher_subject.findAll({
                            where: {
                                teacher_id: role.id,
                            },
                            transaction
                        });

                        for (const subject of subjects) {
                            school.teacher.headOfDepartment.push({
                                subjectId: subject.subject_id,
                                status: !subject.disabled
                            });
                        }
                    } else if (role.role.code === 'HOMEROOM_EDUCATOR') {
                        const headClasses = await models.teacher_head_class.findAll({
                            where: {
                                teacher_id: role.id,
                                is_assigned: 0,
                            },
                            transaction
                        });

                        for (const headClass of headClasses) {
                            school.teacher.homeroomEducator.push({
                                classId: headClass.class_id,
                                status: !headClass.disabled,
                            })
                        }
                    } else if (role.role.code === 'LEARNER') {
                        if (yearId) {
                            school.student.class = await models.pupil_class.findOne({
                                attributes: ['class_id'],
                                where: {
                                    pupil_id: role.id,
                                    disabled: 0
                                },
                                include: [{
                                    model: models.class,
                                    where: {
                                        year_id: yearId,
                                        disabled: 0,
                                    }
                                }],
                                transaction
                            }).then(data => data ? data.class_id : undefined)
                        } else {
                            school.student.class = await models.pupil_class.findOne({
                                attributes: ['class_id'],
                                where: {
                                    pupil_id: role.id,
                                    disabled: 0
                                },
                                transaction
                            }).then(data => data ? data.class_id : undefined)
                        }

                        await Promise.all([
                            // (async () => {
                            //     school.student.class = await models.pupil_class.findOne({
                            //         attributes: ['class_id'],
                            //         where: {
                            //             pupil_id: role.id,
                            //             disabled:0
                            //         },
                            //         transaction
                            //     }).then(data => data ? data.class_id : undefined)
                            // })(),
                            (async () => {
                                school.student.parentRoleIds = await models.parent_pupil.findAll({
                                    attributes: ['parent_id'],
                                    where: {
                                        pupil_id: role.id,
                                    },
                                    transaction
                                }).map(data => data.parent_id)
                            })()
                        ]);
                    }
                }
            } else {
                if (role.role.code === 'PARENT') {
                    const pupilRoleIds = await models.parent_pupil.findAll({
                        attributes: ['pupil_id'],
                        where: {
                            parent_id: role.id,
                            archived: 0,
                        },
                        transaction
                    }).map((pupils): number => pupils.pupil_id);

                    user.isParent = await models.user_role.findAll({
                        attributes: ['user_id'],
                        where: {
                            id: pupilRoleIds
                        },
                        transaction
                    }).map((user): number => user.user_id);
                }
            }
        }

        return user
    }

    public async getLearnersUserRole(id: number): Promise<ILearnerRole[]> {
        const learners = await models.user_role.findAll({
            attributes: ['id'],
            include: [{
                attributes: [],
                model: models.role,
                where: {
                    code: 'LEARNER',
                    disabled: 0,
                }
            }, {
                attributes: ['id', 'name'],
                model: models.school,
                include: [{
                    attributes: ['id', 'name'],
                    model: models.city
                }]
            }, {
                model: models.class,
            }],
            where: {
                user_id: id,
                disabled: 0,
            }
        }).map((stusentInfo) => {
            return {
                roleId: stusentInfo.id,
                school: {
                    id: stusentInfo.school.id,
                    name: stusentInfo.school.name,
                    city: {
                        id: stusentInfo.school.city.id,
                        name: stusentInfo.school.city.name,
                    }
                }
            }
        });

        return (await Promise.all(await learners.map((learner) => {
            return models.pupil_class.findOne({
                attributes: ['id'],
                where: {
                    pupil_id: learner.roleId,
                    disabled: 0,
                },
                include: [{
                    model: models.class,
                    attributes: ['id', 'name'],
                    where: {
                        disabled: 0,
                    },
                    include: [{
                        attributes: ['id'],
                        model: models.segment_level,
                        include: [{
                            model: models.level,
                            attributes: ['id', 'name'],
                            where: {
                                disabled: 0,
                            },
                        }]
                    }],
                }],
            }).then((data): ILearnerRole => {
                if (data && data.class && data.class.segment_level && data.class.segment_level.level) {

                    return {
                        class: {
                            id: data.class.id,
                            name: data.class.name,
                            level: {
                                id: data.class.segment_level.level.id,
                                name: data.class.segment_level.level.name,
                            },
                        },
                        school: learner.school
                    }
                }
            })
        }))).filter((data): boolean => !!data)
    }

    public async getUserMessage(id: number, transaction: Transaction): Promise<IMessage> {
        const user = await models.user.findById(id, { transaction });

        return {
            header: {
                id: user.id,
                oauthId: user.external_id
            },
            message: {
                id: user.id,
                oauthId: user.external_id,
                name: user.name,
                lastName: user.surname,
                middleName: user.middle_name,
                msisdn: user.msisdn,
                email: user.email,
                birthday: user.birthday,
                address: user.address,
                active: !!user.activated,
                gender: user.gender,
                status: user.disabled ? 'disabled' : 'enabled',
            }
        }
    }

    public getEmptyRole() {
        return {
            accounts: {},
            schools: {},
            isParent: [],
        }
    }

    public async addStudentInfo(id: number, accountId: number, schoolId: number, body: IMessageBodyStudent, transaction: Transaction): Promise<IMessageBodyStudent> {
        await Promise.all([
            (async (): Promise<void> => {
                body = {
                    ...body,
                    ...await models.pupil.findByPrimary(id, {
                        attributes: ['local_address', 'local_msisdn', 'passport_id', 'nationality', 'religion', 'race', 'other'],
                        transaction
                    }).then(data => {
                        return {
                            localAddress: data ? data.local_address : undefined,
                            phoneNumber: data ? data.local_msisdn : undefined,
                            passportBirthCertificate: data ? data.passport_id : undefined,
                            nationality: data ? data.nationality : undefined,
                            religion: data ? data.religion : undefined,
                            race: data ? data.race : undefined,
                            other: data ? data.other : undefined,
                        }
                    })
                };
            })(),
            (async (): Promise<void> => {
                const role = await this.getUserRole(id, 'LEARNER', schoolId, transaction);
                const roleId = role.id;
                body.status = role.disabled ? 'disabled' : 'enabled';
                await Promise.all([
                    (async (): Promise<void> => {
                        body.subclasses = [];
                        body.educationalClassId = await models.pupil_class.findOne({
                            attributes: ['class_id'],
                            where: {
                                pupil_id: roleId,
                                disabled: 0,
                            },
                            transaction,
                        }).then((data): number => data ? data.class_id : undefined);

                        if (body.educationalClassId) {
                            body.subclasses = await models.pupil_group
                                .findAll({
                                    attributes: ['group_id'],
                                    where: { disabled: 0 },
                                    include: [{
                                        required: true,
                                        model: models.pupil_class,
                                        where: {
                                            pupil_id: roleId,
                                            class_id: body.educationalClassId,
                                            disabled: 0,
                                        },
                                    }],
                                    transaction,
                                })
                                .map((value): number => value.group_id);
                        }
                    })(),
                    (async (): Promise<void> => {
                        const parantRoleIds = await models.parent_pupil.findAll({
                            transaction,
                            attributes: ['parent_id'],
                            where: {
                                pupil_id: roleId,
                                disabled: 0,
                            },
                        }).map((data): number => data ? data.parent_id : undefined);

                        body.parents = await models.user_role.findAll({
                            transaction,
                            where: {
                                id: parantRoleIds
                            },
                            include: [{
                                model: models.user,
                                attributes: ['id', 'external_id']
                            }]
                        }
                        ).map((data: any) => {
                            return {
                                id: data.user.id,
                                oauthId: data.user.external_id
                            }
                        })
                    })(),
                ]);
            })(),
        ]);

        return body;
    }

    private async getUserRoleId(id: number, code: string, schoolId: number = null, transaction: Transaction,): Promise<number> {
        let user_role_query: any = {
            user_id: id,
        };
        if (schoolId) {
            user_role_query.school_id = schoolId;
        }

        const roleId = await models.user_role.findOne({
            attributes: ['id'],
            where: user_role_query,
            include: [{
                model: models.role,
                where: {
                    code,
                    disabled: 0,
                }
            }],
            transaction
        }).then((data): number => data.id);

        if (!roleId) {
            throw new Error(`Role ${code} for user ${id}, not found`)
        }

        return roleId
    }
    private async getUserRole(id: number, code: string,
        schoolId: number = null, transaction: Transaction): Promise<any> {
        let user_role_query: any = {
            user_id: id,
        };
        if (schoolId) {
            user_role_query.school_id = schoolId;
        }

        const role = await models.user_role.findOne({
            where: user_role_query,
            include: [{
                model: models.role,
                where: {
                    code,
                    disabled: 0,
                }
            }],
            transaction
        });

        if (!role) {
            throw new Error(`Role ${code} for user ${id}, not found`)
        }

        return role
    }
    public async checkLearnerAndEducatorInClass(userId: number, learners, homeRoomTeachers, transaction?): Promise<any> {
        var dbLearners: any[] = await sequelize.query(
            `SELECT pc.class_id FROM user_role ur
        LEFT JOIN pupil_class pc ON pc.pupil_id = ur.id
        WHERE ur.user_id = ${userId} AND ur.archived = 0 AND ur.role_id = 73 AND pc.disabled = 0`,
            { type: sequelize.QueryTypes.SELECT, transaction });
        var dbTeachers: any[] = await sequelize.query(
            `SELECT thc.class_id FROM user_role ur
                LEFT JOIN teacher_head_class thc ON thc.teacher_id = ur.id
                WHERE ur.user_id = ${userId} AND ur.archived = 0 AND ur.role_id = 78
                UNION
                SELECT sc.class_id FROM schedule sc WHERE sc.teacher_id = ${userId} AND sc.disabled = 0`,
            { type: sequelize.QueryTypes.SELECT, transaction });
        dbLearners = dbLearners.map(x => x.class_id);
        let clLearners = learners.map(x => x.class_id);
        let concatedLearners = [...dbLearners];
        clLearners.forEach(element => {
            if (concatedLearners.indexOf(element) < 0) {
                concatedLearners.push(element);
            }
        });

        dbTeachers = dbTeachers.map(x => x.class_id);
        let clTeachers = homeRoomTeachers.map(x => x.homeClassId);
        let concatedTeachers = [...dbTeachers];
        clTeachers.forEach(element => {
            if (concatedTeachers.indexOf(element) < 0) {
                concatedTeachers.push(element);
            }
        });


        var theSameList = [];

        concatedLearners.forEach(learner => {
            if (concatedTeachers.indexOf(learner) > -1) { theSameList.push(learner); }
        })


        return !(theSameList.length > 0);
    }

}

