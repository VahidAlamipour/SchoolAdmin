import dayjs from 'dayjs';
import { Op, fn, Transaction } from 'sequelize';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import { IClass } from '../../sdk/interfaces';

import { RoleRepository } from '../repositories/role';
import { BeedError } from '../services/beed';

import { sequelize } from '../db';

const roleRepo = new RoleRepository();
export default class CRUD extends GenericController<IClass> {
    public entity: string = 'class';
    public resource = '/classes';

    public async create(data: IClass, me: ReqUser, query, transaction: Transaction): Promise<number> {
        let year: any;
        if (data.yearId) {
            year = await this.models.report_year.findOne({
                attributes: ['id'],
                where: {
                    school_id: me.school.id,
                    disabled: false
                },
                include: [{
                    attributes: ['id'],
                    model: this.models.academic_year,
                    where: {
                        start: {
                            [Op.lte]: fn('YEAR', fn('NOW'))
                        },
                        end: {
                            [Op.gte]: fn('YEAR', fn('NOW'))
                        }
                    }
                }],
                order: [[{ model: this.models.academic_year }, 'end', 'desc']],
                transaction
            });
        }
        if (!year && !data.yearId) {
            throw new BeedError('Not created academic year', 500)
        }

        const model = await this.models.class.create({
            id: null,
            name: data.name,
            level_id: data.levelId,
            shift_id: 1,
            year_id: data.yearId || year.id,
            school_id: me.school.id,
            show_name: data.showName ? 1 : 0,
            transmitted: 0,
            graduated: 0,
        }, {
            transaction
        });

        await roleRepo.linkClassTeacher(model.id, data.teacherId, transaction);

        data.yearId = model.year_id;

        return model.id;
    }
    public async find(query: IPageQuery & { levelId?: number, yearId?: number, currentAndFuture?: boolean; isSLC ?: boolean }, me: ReqUser): Promise<{ rows: IClass[]; count: number }> {
        const schoolId: number = query.schoolId || me.school.id;
        let currentAndFutureIds = [];
        let ordering: any[] = [['name', query.order]];
        if (query.yearId && query.currentAndFuture) {
            currentAndFutureIds = await sequelize.query(`SELECT ry.id FROM report_year ry
            LEFT JOIN academic_year ay ON ay.id = ry.academic_year_id
            WHERE ry.school_id = ${schoolId} AND ay.start >=  (SELECT start FROM academic_year WHERE id = 
                (SELECT academic_year_id from report_year WHERE id = (SELECT active_report_year FROM school WHERE id = ${schoolId})))`,
                { type: sequelize.QueryTypes.SELECT });

            ordering = [[this.models.report_year, this.models.academic_year, 'start', 'asc'],
            [this.models.report_year, this.models.academic_year, 'end', 'asc'],
            ['name', 'asc']
            ];
        }
        if (currentAndFutureIds.length <= 0 && query.yearId) {
            currentAndFutureIds.push(query.yearId)
        } else {
            currentAndFutureIds = currentAndFutureIds.map(item => item.id);
        }
        const options = {
            where: {
                disabled: 0,
                ...query.query ? {
                    name: {
                        [Op.like]: `%${query.query}%`,
                    },
                } : {},
                ...query.id ? {
                    id: query.id,
                } : {},
                ...query.levelId ? {
                    level_id: query.levelId,
                } : {},
                ...query.yearId ? {
                    year_id: currentAndFutureIds,
                } : {},
                school_id: schoolId,
            },
        };
        let disabledQuery = { disabled: 0 }
        let disabledQueryUserRole;
        disabledQueryUserRole = query.isSLC ? disabledQuery : 1;

        const [data, count] = await Promise.all([
            this.models.class.findAll({
                order: ordering,
                offset: query.page * query.limit,
                limit: query.limit,
                include: [
                    {
                        model: this.models.segment_level,
                        where: {
                            disabled: 0
                        },
                        include: [{
                            model: this.models.level,
                            where: {
                                disabled: 0
                            }
                        },{
                            model: this.models.segment,
                            where: {
                                disabled: 0,
                            }
                        }]
                    },
                    {
                        required: false,
                        model: this.models.user_role,
                        as: 'teachers',
                        through: {
                            where: {
                                // disabled: 0,
                                is_assigned: 0,
                                ... disabledQueryUserRole
                            },
                        },
                        where: {
                            ... disabledQueryUserRole
                            // disabled: 0
                        },
                        include: [
                            this.models.user
                        ]
                    },{
                        model: this.models.report_year,
                        include: [{
                            model: this.models.academic_year,
                        }]
                    }
                ],
                ...options,
            }),
            this.models.class.count(options),
        ]);

        const studentsCounts = await Promise.all(data.map(({ id }) => {
            return this.models.user.count({
                distinct: true,
                include: [
                    {
                        required: true,
                        model: this.models.user_role,
                        where: {
                            archived: 0,
                            disabled: 0
                        },
                        include: [{
                            required: true,
                            model: this.models.pupil_class,
                            where: {
                                class_id: id,
                                disabled: 0,
                            },
                        }]
                    }
                ]
            })
        }));

        const classes: IClass[] = data.map((c: any, index) => {
            const teacherUserRole = c.teachers.find(row => row);

            const teacher = teacherUserRole ? teacherUserRole.user : null;

            return {
                id: c.id,
                name: c.name,
                showName: !!c.show_name,
                teacher: teacher ? {
                    id: teacher.id,
                    name: teacher.name,
                    lastName: teacher.surname,
                    middleName: teacher.middle_name,
                    msisdn: teacher.msisdn,
                    email: teacher.email,
                    birthday: teacher.birthday,
                    address: teacher.address,
                } : undefined,
                levelId: c.level_id,
                level: {
                    id: c.segment_level.id,
                    name: c.segment_level.level.name
                },
                studentsCount: studentsCounts[index],
                yearId: c.year_id,
                segmentname: c.segment_level.segment.name,
                start: c.report_year.academic_year.start,
                end: c.report_year.academic_year.end
            }
        });

        return {
            count,
            rows: classes,
        };
    }
    public async update(id: number, data: IClass, me: ReqUser, query, transaction: Transaction): Promise<void> {
        if (data.teacherId > 0) {
            const learnerAndEducatorInClassValid = await roleRepo.checkLearnerAndEducatorInClass(data.teacherId,
                [], [{ homeClassId: parseInt(id.toString()) }]);
            if (!learnerAndEducatorInClassValid) {
                const errorr: any = new Error("User cannot be both educator and learner in the same class");
                errorr.code = 500;
                throw errorr;
            }
        }
        const model = await this.models.class.findOne({
            attributes: ['id', 'year_id'],
            where: { disabled: 0, id },
            transaction
        });

        await Promise.all([
            model.update({
                name: data.name,
                show_name: data.showName ? 1 : 0,
            }, {
                transaction
            }),
            roleRepo.linkClassTeacher(id, data.teacherId, transaction),
        ]);

        data.yearId = model.year_id;
    }
    public async multiDelete(ids: number[], transaction: Transaction, school?): Promise<void> {
        await Promise.all([
            this.models.pupil_class.update({
                disabled: 1,
            }, {
                where: {
                    class_id: ids,
                },
                transaction
            }),
            this.models.class.update({
                disabled: dayjs().unix(),
            }, {
                where: {
                    id: ids,
                    disabled: 0
                },
                transaction
            }),
            this.models.schedule.update({ //in lesson.ts, query don't include class table, but class id in schedule
                disabled: 1,
            }, {
                where: {
                    class_id: ids,
                },
                transaction
            }),
            (async (): Promise<void> => {
                const refs = await this.models.teacher_head_class.findAll({
                    where: {
                        class_id: ids
                    },
                    transaction
                });
 
                const teacherClasses = await this.models.teacher_head_class.findAll({
                    where: {
                        teacher_id: refs.map((row): number => row.teacher_id)
                    },
                    transaction
                });
               
                await this.models.teacher_head_class.destroy({
                    where: {
                        id: refs.map((row): number => row.id)
                    },
                    transaction
                });

                if(teacherClasses.length === 1) {
                    await this.models.user_role.destroy({
                        where: {
                            id: refs.map((row): number => row.teacher_id)
                        },
                        transaction
                    });
                }
                
            })()
        ]);
        
        if (school) {
            await Promise.all(ids.map(async (id: number): Promise<void> => {
                await this.sendDeleteMessages(id, school, transaction)
            }))
        }
    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await this.multiDelete([id], transaction);
    }
}
