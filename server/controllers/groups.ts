import { keyBy, uniqBy, flattenDeep, sortBy } from 'lodash';
import {Op, Transaction} from 'sequelize';
import dayjs from 'dayjs';

import {GenericController, IPageQuery, ReqUser} from '../crud';
import {IGroup, ISubGroup, IUser} from '../../sdk/interfaces';
import {bunchInstance, classInstance} from '../models/db';

import { GroupRepository, PupilGroupRepository } from '../repositories/relation';
import {BeedError} from '../services/beed';

const pupilGroupRepo = new PupilGroupRepository();
const groupRepo = new GroupRepository();

const whereNotDisabled = { disabled: 0 };

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IBunchInstance extends bunchInstance {
    class?: classInstance;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IMixed {
    rows: IBunchInstance[];
    count: number;
}

export default class CRUD extends GenericController<IGroup> {
    public resource = '/groups';
    public entity = 'group';
    
    private async findMixed(mixin, subject?, transaction: Transaction | null = null): Promise<IMixed> {
        return  await this.models.bunch.findAndCountAll({
            distinct: true,
            include: [{
                required: false,
                model: this.models.group,
                where: whereNotDisabled,
                include: [{
                    required: false,
                    model: this.models.pupil_group,
                    where: whereNotDisabled,
                }]
            }, {
                model: this.models.subject,
                where: {
                    is_disabled: 0,
                    ...subject ? {
                        name: {
                            [Op.like]: `${subject}%`,
                        },
                    } : null
                }
            }],
            ...mixin,
            transaction
        });
    }
    private async findClass(id, transaction: Transaction | null = null) {
        const res = await this.models.class.findOne({
            where: {
                ...whereNotDisabled,
                id
            },
            include: [{
                required: false,
                model: this.models.segment_level,
                where: whereNotDisabled,
                include: [{
                    model: this.models.level,
                    where: whereNotDisabled
                }]
            }, {
                required: false,
                model: this.models.pupil_class,
                where: whereNotDisabled,
                include: [{
                    required: true,
                    model: this.models.user_role,
                    where: {
                        disabled: 0,
                        archived: 0
                    },
                    include: [{
                        required: true,
                        model: this.models.user,
                    }]
                }]
            }],
            transaction
        });

        if (!res) {
            throw new BeedError(`Class[${id}] not found`, 400);
        }

        return res;
    }
    public async find(query: IPageQuery & { classId?: number; subjectId?: number }): Promise<{ rows: IGroup[]; count: number }> {
        const [{ count, rows }, studyClass]: any[] = await Promise.all([
            this.models.subject.findAndCountAll({
                distinct: true,
                where: {
                    is_disabled: 0,
                    ...query.subjectId ? {
                        id: query.subjectId
                    } : {},
                    ...query.query ? {
                        name: {
                            [Op.like]: `%${query.query}%`,
                        },
                    } : null
                },
                include: [{
                    required: true,
                    model: this.models.bunch,
                    where: {
                        ...query.id ? {
                            id: query.id
                        } : {},
                        ...query.classId ? {
                            class_id: query.classId
                        } : {},
                        disabled: 0,
                    },
                    include: [{
                        required: false,
                        model: this.models.group,
                        where: whereNotDisabled,
                        include: [{
                            required: false,
                            model: this.models.pupil_group,
                            where: whereNotDisabled,
                        }]
                    }]
                }],
                limit: query.limit,
                offset: query.limit * query.page,
                order: [['name', query.order]]
            }),
            query.classId && this.findClass(query.classId)
        ]);

        return {
            count,
            rows: rows.map((row: any): IGroup => {
                const bunch = row.bunches[0];
                const assigned = flattenDeep(bunch.groups.map((group): number[] => group.pupil_groups.map((pupil_group): number => pupil_group.pupil_class_id)));

                return {
                    id: bunch.id,
                    classId: bunch.classId,
                    subject: row,
                    subgroups: bunch.groups.map((group): ISubGroup => ({
                        id: group.id,
                        name: group.name
                    })),
                    unassignedStudentsCount: studyClass && Math.max(0, new Set(studyClass.pupil_classes.map(pc => pc.user_role.user.id).filter(Boolean)).size - assigned.length),
                };
            }),
        };
    }
    public async findOne(id: number): Promise<IGroup> {
        const row = await this.getRows(id);

        const unassignedStudents = row.class.pupil_classes;

        const unassignedStudentsById = keyBy(unassignedStudents, 'id');

        const assigned = new Set();

        return {
            id: row.id,
            subject: row.subject,
            class: {
                id: row.class.id,
                name: row.class.name,
                showName: row.class.showName,
                level: row.class.segment_level ? {
                    id: row.class.segment_level.id,
                    name: row.class.segment_level.level.name,
                } : undefined
            },
            subgroups: row.groups.map((row): ISubGroup => {
                const students: Partial<IUser>[] = row.pupil_groups
                    .filter((pupil_group): boolean => unassignedStudentsById[pupil_group.pupil_class_id])
                    .map((pupil_group): Partial<IUser> => {
                        try {
                            const user_role = unassignedStudentsById[pupil_group.pupil_class_id].user_role;

                            const user = user_role.user;
    
                            assigned.add(pupil_group.pupil_class_id);
    
                            return {
                                id: user_role.id,
                                name: user.name,
                                lastName: user.surname,
                                middleName: user.middle_name
                            };
                        } catch {
                            return {};
                        }
                    });

                return {
                    id: row.id,
                    name: row.name,
                    students: sortBy(uniqBy(students, 'id'), ['name', 'lastName']),
                }
            }),
            unassignedStudents: sortBy(unassignedStudents.filter((row): boolean => !assigned.has(row.id)).map((pupil_group): Partial<IUser> => {
                const user_role = pupil_group.user_role;

                try {
                    const user = user_role.user;

                    return {
                        id: user_role.id,
                        name: user.name,
                        lastName: user.surname,
                        middleName: user.middle_name
                    };
                } catch {
                    return null;
                }
            }).filter(Boolean), ['name', 'lastName']),
        };
    }
    private async studMap(studentsIds: number[], transaction: Transaction): Promise<number[]> {
        const students = await this.models.pupil_class.findAll({
            where: {
                pupil_id: studentsIds,
            },
            transaction
        });

        try {
            return students.map(({ id }): number => id);
        } catch {
            return [];
        }
    }
    private async updateBunchGroups(bunchId: number, subgroups: ISubGroup[], transaction: Transaction): Promise<void> {
        const newGroups = subgroups.filter((group: ISubGroup): boolean => !group.id);

        await groupRepo.linkCreateBunchToGroups(bunchId, newGroups, transaction);

        await Promise.all([
            groupRepo.linkUpdateBunchToGroups(bunchId, subgroups, transaction),
            groupRepo.linkDeleteBunchToGroups(bunchId, subgroups, transaction),
            ...subgroups.map(async (subgroup: ISubGroup): Promise<void> => {
                const students = await this.studMap(subgroup.studentsIds, transaction);
                await pupilGroupRepo.linkGroupToPupils(subgroup.id, students, transaction);
            })
        ]);
    }
    public async create(data: IGroup, me: ReqUser, query, transaction: Transaction): Promise<number> {
        const model = await this.models.bunch.create({
            id: null,
            class_id: data.classId,
            subject_res_id: data.subjectId,
            disabled: 0,
        }, {
            transaction
        }).catch((error): any => {
            if (error.message === 'Validation error') { 
                const errorr: any = new Error("Subclasses already exist for this course. Please edit the existing subclasses");
                errorr.code = 500;
                throw errorr;
            } 
        });

        await model.reload({
            transaction
        });

        await this.updateBunchGroups(model.id, data.subgroups, transaction);

        return model.id;
    }
    public async update(bunchId: number, data: IGroup, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await this.updateBunchGroups(bunchId, data.subgroups, transaction);

        await this.getUnassignedStudents(bunchId, data, transaction);
        await this.updateStudentIds(data, transaction);
    }
    public async delete(bunchId: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await Promise.all([
            this.models.bunch.update({
                disabled: dayjs().unix(),
            }, {
                where: {
                    id: bunchId
                },
                transaction
            }),
            this.updateBunchGroups(bunchId, [], transaction),
        ]);
    }

    private async getUnassignedStudents(id: number, data: IGroup, transaction: Transaction | null = null): Promise<void> {
        const row = await this.getRows(id, transaction);

        const assignedStudentIds: number[] = [];

        for (const subgroup of data.subgroups) {
            for (const studentId of subgroup.studentsIds) {
                assignedStudentIds.push(studentId);
            }
        }

        data.unassignedStudents = row.class.pupil_classes.filter((unassignedStudent): boolean => {
            return assignedStudentIds.indexOf(unassignedStudent.pupil_id) === -1
        }).map((unassignedStudent): number => {
            const user_role = unassignedStudent.user_role;

            try {
                const user = user_role.user;

                return user.external_id;
            } catch {
                return null;
            }
        });

        data.unassignedStudentsCount = data.unassignedStudents.length;
    }

    private async getRows(id: number, transaction: Transaction | null = null): Promise<any> {
        const bunch = await this.findMixed({
            where: { id, disabled: 0 },
        }, undefined, transaction);

        if (bunch.count != 1) {
            throw new BeedError(`found ${bunch.count} items`, 404)
        }

        const row = bunch.rows[0];

        row.class = await this.findClass(row.class_id, transaction);

        return row;
    }

    private async updateStudentIds(date: IGroup, transaction: Transaction | null = null): Promise<void> {
        for (const subgroup of date.subgroups) {
            const students = await this.models.user.findAll({
                attributes: ['external_id'],
                include: [{
                    model: this.models.user_role,
                    where: {
                        id: subgroup.studentsIds
                    }
                }],
                transaction
            });

            const studentsIds: number[] = students.map((student): number => {
                return student.external_id
            });

            if (subgroup.studentsIds.length !== studentsIds.length) {
                throw new Error(`Not all students found, was ${subgroup.studentsIds.length} found ${studentsIds.length}`)
            }

            subgroup.studentsIds = studentsIds;
        }
    }
}
