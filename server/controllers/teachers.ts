import { Op, literal, Transaction } from 'sequelize';
import { sequelize } from '../db';
import Dayjs from 'dayjs';
import { Request, Response } from 'express';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import { ITeacher } from '../../sdk/interfaces';

import { RoleRepository } from '../repositories/role';
import {
    TeacherHeadClassRepository,
    TeacherHeadSubjectRepository
} from '../repositories/relation';
import { Messages } from '../repositories/messages';
import { BeedError } from '../services/beed';

const roleRepo = new RoleRepository();
const teacherClassRepo = new TeacherHeadClassRepository();
const teacherHeadSubjectRepo = new TeacherHeadSubjectRepository();

export default class CRUD extends GenericController<ITeacher> {
    public entity: string = 'teacher';
    public resource = '/teachers';

    private startOfYearDate(date): Date {
        if (date) {
            return Dayjs(date).startOf('year').add(1, 'day').toDate();
        } else {
            return null;
        }
    }

    public async create(data: ITeacher, me: ReqUser, query, transaction: Transaction): Promise<number> {
        try {
            const id = await roleRepo.createUser(data, undefined, transaction, true);
            const oldRolesForMessage = await roleRepo.getUserRoles(id, transaction);


            const availableRoles = await this.getAvailableRoles();
            let oldRoles = await this.models.user_role.findAll({
                where: {
                    user_id: id,
                    school_id: me.school.id,
                    role_id: availableRoles.map(role => role.id)
                }
            });
            if (oldRoles && oldRoles.length) {
                const activeRoles = oldRoles.filter(role => role.disabled == 0 && role.archived == 0);
                const disabledRoles = oldRoles.filter(role => role.disabled == 1 && role.archived == 0);
                const archivedRoles = oldRoles.filter(role => role.disabled == 1 && role.archived == 1);
                if (activeRoles && activeRoles.length) {
                    throw new BeedError('Teacher with such email already exists in this school', 500)
                }
                if (disabledRoles && disabledRoles.length) {
                    //     var sqlQuery = `UPDATE user_role
                    //     SET disabled = 0
                    //     WHERE id IN (${disabledRoles.map(drole=>drole.id)})`;
                    //     console.log(`++++++++++++++++ sqlQuery =>+++++++++++++++++++++++`,sqlQueryh)
                    //     var updatedId = await sequelize.query(sqlQuery,{ type: sequelize.QueryTypes.UPDATE});
                    // console.log(`++++++++++++++++ updatedId =>+++++++++++++++++++++++`,updatedId)
                    throw new BeedError('There is a inactive teacher with such email in this school', 500)
                }
                if (archivedRoles && archivedRoles.length) {
                    var updatedId = await sequelize.query(`UPDATE user_role
                    SET school_id = NULL,description=${me.school.id}
                    WHERE id IN (${archivedRoles.map(arole => arole.id)})`,
                        { type: sequelize.QueryTypes.UPDATE, transaction });
                }
            }

            await Promise.all([
                this.models.teacher.update({
                    education: data.education || '',
                    university: data.university,
                    speciality: data.speciality,
                    category: data.category,
                    graduation_year: this.startOfYearDate(data.graduationYear),
                    training_year: this.startOfYearDate(data.trainingYear),
                }, {
                    where: {
                        id
                    },
                    transaction
                }),
                roleRepo.createTeachers(id, [{
                    schoolId: me.school.id,
                    ...data
                }], transaction, true)
            ]);

            const newRoles = await roleRepo.getUserRoles(id, transaction);

            await Messages.parseDiff(id, oldRolesForMessage, newRoles, transaction);

            return id;
        } catch (error) {
            console.log(error);
            throw error;

        }

    }
    public async find(query: IPageQuery & {
        subjectId?: number; levelId?: number;
        type?: string, disabled?: number, yearId?: number
    }, me: ReqUser): Promise<{ rows: ITeacher[]; count: number }> {
        let te = [];

        const availableRoles = await this.getAvailableRoles();
        var disabledQuery = null;
        if (query.disabled != undefined && query.disabled != null) {
            disabledQuery = { disabled: query.disabled }
        }
        if (query.subjectId) {
            te = await this.models.user_role.findAll({
                where: {
                    school_id: me.school.id,
                    ...disabledQuery,
                    archived: 0,
                },
                include: [
                    {
                        model: this.models.role,
                        where: {
                            id: availableRoles.map(({ id }): number => id),
                        },
                    },
                    {
                        required: false,
                        model: this.models.teacher_subject,
                        where: {
                            subject_id: query.subjectId,
                            disabled: 0,
                            ...query.levelId ? {
                                [Op.or]: [{
                                    level_id: query.levelId
                                }, {
                                    level_id: null
                                }]
                            } : {},
                        }
                    }
                ]
            });
            te = te.filter((row): number => row.teacher_subjects.length);
            te = te.map(({ user_id }): number => user_id);
        }

        const searchField = ['name', 'surname', 'middle_name', 'msisdn', 'email'];
        const searchFields = searchField.map((key): string => 'user.' + key);
        const res = await this.models.user.findAndCountAll({
            distinct: true,
            limit: query.limit,
            offset: query.page * query.limit,
            order: searchField.map((field): [string, string] => [field, query.order]),
            where: {
                ...query.id ? {
                    id: query.id
                } : {},
                ...query.subjectId ? {
                    id: te
                } : {},
                ...query.query ? {
                    [Op.and]: [
                        query.fullTextSearch
                            ? literal(`MATCH(${searchFields.join(', ')}) AGAINST('${query.query}*' IN BOOLEAN MODE)`)
                            : literal(`CONCAT_WS(${searchFields.join(', " ",')}) LIKE '%${query.query}%'`)
                    ]
                } : {}
            },
            include: [
                {
                    model: this.models.teacher,
                    required: false,
                },
                {
                    model: this.models.role,
                    where: {
                        id: availableRoles.map(({ id }): number => id),
                        ...query.type ? {
                            code: query.type
                        } : null
                    },
                    through: {
                        where: {
                            school_id: me.school.id,
                            archived: 0,
                            ...disabledQuery,
                        },
                    },
                },
                {
                    model: this.models.user_role,
                    where: {
                        school_id: me.school.id,
                        archived: 0,
                        ...disabledQuery,
                    },
                    include: [{
                        model: this.models.teacher_head_class,
                        include: [{
                            model: this.models.class,
                            include: [{
                                model: this.models.segment_level,
                                where: { disabled: 0 },
                            },
                            ]
                        }]
                    },
                    {
                        model: this.models.teacher_subject,
                        where: { disabled: 0 },
                        required:false
                    }],
                },
            ],
        });

        const yearId = query.yearId ? +query.yearId : null;
        let rows = res.rows
            .map((o): any => o.toJSON())
            .map((row): ITeacher => {
                return this.mapper(row, yearId);
            });

        return {
            rows,
            count: res.count,
        };
    }
    private mapper(user, yearId): ITeacher {
        var eduRoles = user.roles.filter(x => (x.sub_code == "EDUCATOR" ||
            x.sub_code == "CURRICULUM_DIRECTOR"));
        eduRoles = eduRoles.map(x => x.id);

        const teacher = user.teacher || {};

        let homeClass = user.user_roles.find((userRole): number => userRole.teacher_head_classes.length);
        if (yearId && homeClass) {
            homeClass.teacher_head_classes = homeClass.teacher_head_classes
                .filter(hc => hc.disabled == 0 && hc.is_assigned == 0 && hc.class.year_id == yearId);
            if (homeClass.teacher_head_classes.length < 1) {
                homeClass = undefined;
            }
        }
        let disabled: number = 0;
        for (var role of user.user_roles) {
            if (eduRoles.indexOf(role.role_id) >= 0) {
                disabled = role.disabled;
                break;
            }
        }
        //#region check home room educater classes
        let strRoles : string[] = user.roles.map(({ code }): string => code);
        var isHomeRoom = strRoles.indexOf('HOMEROOM_EDUCATOR');
        if(isHomeRoom > -1 && !homeClass){
            strRoles.splice(isHomeRoom,1);
        }


        //#endregion
        return {
            id: user.id,
            name: user.name,
            lastName: user.surname,
            middleName: user.middle_name,
            msisdn: user.msisdn,
            email: user.email,
            address: user.address,
            birthday: user.birthday,
            education: teacher.education,
            university: teacher.university,
            speciality: teacher.speciality,
            category: teacher.category,
            graduationYear: teacher.graduation_year,
            trainingYear: teacher.training_year,
            //active: user.activated ? !user.disabled : null,
            active: !disabled,
            types: strRoles,
            homeClass: homeClass && !homeClass.teacher_head_classes[0].is_assigned ? homeClass.teacher_head_classes[0].class : undefined,
        };
    }
    public async update(id: number, data: ITeacher, me: ReqUser, query, transaction: Transaction): Promise<void> {
        const teacherInformation = {
            education: data.education,
            university: data.university,
            speciality: data.speciality,
            category: data.category,
            graduation_year: this.startOfYearDate(data.graduationYear),
            training_year: this.startOfYearDate(data.trainingYear),
        };

        await Promise.all([
            (async (): Promise<void> => {
                const baseMessage = await roleRepo.updateUser(id, data, transaction);

                await Messages.prepareMessage(baseMessage, undefined, undefined, 'UPDATED', 'user', {
                    teacherInformation: {
                        education: teacherInformation.education,
                        university: teacherInformation.university,
                        speciality: teacherInformation.speciality,
                        category: teacherInformation.category,
                        graduationYear: teacherInformation.graduation_year,
                        trainingYear: teacherInformation.training_year,
                    }
                })
            })(),
            this.models.teacher.update(teacherInformation, {
                where: { id },
                transaction
            }),
        ]);

    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        const oldRoles = await roleRepo.getUserRoles(id, transaction);

        const availableRoles = await this.getAvailableRoles();

        const userRoles: any = await this.models.user_role.findAll({
            where: {
                user_id: id,
                school_id: me.school.id
            },
            include: [
                {
                    model: this.models.role,
                    where: {
                        id: availableRoles.map(({ id }): number => id),
                    },
                }
            ],
            transaction
        });

        const rolesMap: Map<string, number> = new Map(userRoles.map((userRole): [string, number] => [userRole.role.code, userRole.id]));
        await this.models.user_role.update({
            disabled: 1,
            archived: 1,
        }, {
            where: {
                id: userRoles.map((r): number => r.id),
            },
            transaction
        });
        for (const role of userRoles) {
            await teacherClassRepo.linkTeacherToClasses(role.id, [], transaction)
        }
        rolesMap.has('EDUCATOR') ? await teacherHeadSubjectRepo.linkHeadTeacherToSubjects(rolesMap.get('EDUCATOR'), [], transaction) : null
        await this.models.venue.update({
            teacher_id: null,
        }, {
            where: {
                teacher_id: id,
                school_id: me.school.id
            },
            transaction
        });

        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, oldRoles, newRoles, transaction);
    }
    private async getAvailableRoles(): Promise<{ id: number; code: string }[]> {
        const roles = await this.models.role.findAll({
            where: {
                disabled: 0,
                sub_code: ['EDUCATOR', 'CURRICULUM_DIRECTOR'] // HARDCODE
            },
            order: [['code', 'ASC']],
            attributes: ['id', 'code']
        });

        return roles.filter((role): boolean => !role.code.startsWith('ACCOUNT'));
    }
    public extra(): void {
        this.router.get('/roles', async (req: Request, res: Response): Promise<void> => {
            const roles = await this.getAvailableRoles();

            res.json({
                page: 0,
                pages: 1,
                count: roles.length,
                rows: roles.map(({ code }): string => code),
            });
        });
    }
}
