/* eslint-disable @typescript-eslint/no-parameter-properties */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import models from '../db';
import Config from '../config';
import { Transaction, Op } from 'sequelize';
import { BeedError } from '../services/beed';
import { ISubGroup } from '../../sdk/interfaces';
import { sequelize } from '../db';

const config = Config.load();

class RelationRepository {
    constructor(public table, public base = {}, public disabled = {
        disabled: 1,
    }, public active = {
        disabled: 0,
    }) { };

    async update2(whereMe, whereThey: any[], mapper, base = {}, transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean, schoolId?: number) {
        if (!whereMe) {
            throw new Error('No where for me');
        }

        let dbList = await this.table.findAll({
            where: whereMe,
            transaction
        });
        if (schoolId && this.table.name === 'parent_pupil') {
            dbList = await sequelize.query(`SELECT pp.* FROM parent_pupil pp
            LEFT JOIN user_role url ON pp.pupil_id = url.id 
            WHERE url.school_id = ${schoolId} AND pp.parent_id = ${whereMe.parent_id}`, { type: sequelize.QueryTypes.SELECT, transaction })
        }


        const futureKeys = new Set(whereThey.map(mapper));

        const nowKeys = new Set(dbList.map(mapper));

        const toActive = dbList.filter(row => futureKeys.has(mapper(row))).map(row => row.id);

        const toStop = !noStop ? dbList.filter(row => !futureKeys.has(mapper(row))).map(row => row.id) : [];

        const needs_to_create = whereThey.filter(row => !nowKeys.has(mapper(row)));
        await Promise.all([
            this.updateByIds(toActive, toArchive ? { disabled: 0, archived: 0 } : this.active, transaction),
            this.updateByIds(toStop, toArchive ? { disabled: 1, archived: 1 } : this.disabled, transaction),
            needs_to_create && needs_to_create.length && this.table.bulkCreate(needs_to_create.map((row): any => ({
                id: null,
                ...this.active,
                ...this.base,
                ...whereMe,
                ...base,
                ...row,
            })), {
                transaction
            }),
        ]);

        const news = await this.table.findAll({
            where: { ...whereMe, ...this.active },
            transaction
        });

        return news;
    }

    async updateByIds(ids: number[], data, transaction: Transaction | null = null) {
        if (ids && ids.length) {
            await this.table.update(data, {
                where: {
                    id: ids
                },
                transaction
            });
        }
    }

    async update(whereMe, they, theirId: any[] = [], base = {}, transaction: Transaction | null = null, noStop: boolean | null = false, toArchive?: boolean, schoolId?: number) {
        return this.update2(whereMe, theirId.map(id => ({
            [they]: id,
        })), row => row[they], base, transaction, noStop, toArchive, schoolId);
    }

};

export class GroupRepository extends RelationRepository {
    constructor() {
        super(models.group);
    }

    async linkUpdateBunchToGroups(bunchId: number, subGroups: ISubGroup[], transaction: Transaction): Promise<void> {
        const limit = config.reqUserConfig.subgroupsMaxCount;

        if (subGroups.length > limit) {
            throw new BeedError(`There must be ${limit} or less groups`, 400);
        }

        for await (const subGroup of subGroups) {
            await this.table.update({
                name: subGroup.name,
                bunch_id: bunchId,
                disabled: 0,
            }, {
                where: {
                    id: subGroup.id
                },
                transaction,
            })
        }
    }

    async linkCreateBunchToGroups(bunchId: number, subGroups: ISubGroup[], transaction: Transaction): Promise<void> {
        for await (const subGroup of subGroups) {
            subGroup.id = await this.table.findOrCreate({
                attributes: ['id'],
                where: {
                    name: subGroup.name,
                    bunch_id: bunchId,
                },
                defaults: {
                    name: subGroup.name,
                    bunch_id: bunchId,
                    disabled: 0,
                },
                transaction,
            }).then((data): number => data[0].id);
        }
    }

    async linkDeleteBunchToGroups(bunchId: number, subGroups: ISubGroup[], transaction: Transaction): Promise<void> {
        await this.table.update({
            disabled: 1,
        }, {
            where: {
                id: {
                    [Op.notIn]: subGroups.map((subGroup: ISubGroup): number => subGroup.id)
                },
                bunch_id: bunchId,
            },
            transaction,
        })
    }
}

export class ParentPupilRepository extends RelationRepository {
    constructor() {
        super(models.parent_pupil, {
            created: new Date(),
            rank: 0,
            archived: 0,
        });
    }

    async userMap(role, usersIds, transaction: Transaction | null = null, schoolId?: number) {
        // HACK to map user.id => user_role.id
        const schoolCon = schoolId ? {school_id: schoolId} : {};
        const users = models.user_role.findAll({
            where: {
                user_id: usersIds,
                ...schoolCon,
            },
            include: [{
                model: models.role,
                where: {
                    code: role,
                },
            }],
            attributes: ['id'],
            transaction
        });

        return users.map(({ id }) => id);
    }

    async linkParentToPupils(parentId: number, pupilsId: number[], transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean, schoolId?: number) {
        // HACK to map students user.id => user_role.id
        const ids = await this.userMap('LEARNER', pupilsId, transaction, schoolId);

        await this.update({ parent_id: parentId }, 'pupil_id', ids, {}, transaction, noStop, toArchive, schoolId);
    }

    async linkPupilToParents(pupilId: number, parentsId: number[], transaction: Transaction | null = null, noStop?: boolean, toArchive?: boolean) {
        // HACK to map parents user.id => user_role.id
        const ids = await this.userMap('PARENT', parentsId, transaction);

        await this.update({ pupil_id: pupilId }, 'parent_id', ids, {}, transaction, noStop, toArchive);
    }
};

export class PupilClassRepository extends RelationRepository {
    constructor() {
        super(models.pupil_class, {
            date_time: new Date(),
        });
    }

    async linkPupilToClasses(pupilId: number, classesId: number[], transaction: Transaction | null = null, noStop?: boolean): Promise<void> {
        await this.update({ pupil_id: pupilId }, 'class_id', classesId, {}, transaction, noStop);
    }
}

export class PupilGroupRepository extends RelationRepository {
    constructor() {
        super(models.pupil_group);
    }

    async linkGroupToPupils(groupId: number, pupilsId: number[], transaction: Transaction | null = null) {
        await this.update({ group_id: groupId }, 'pupil_class_id', pupilsId, {}, transaction);
    }
};


export class StudyDaysRepository extends RelationRepository {
    constructor() {
        super(models.study_days);
    }

    async linkYearToDays(year_id: number, days: number[], transaction: Transaction | null = null): Promise<void> {
        await this.update({ year_id }, 'day_id', days, {}, transaction);
    }
}

export class TeacherHeadClassRepository extends RelationRepository {
    constructor() {
        super(models.teacher_head_class);
    }

    async linkTeacherToClasses(teacherId: number, classesId: number[], transaction: Transaction): Promise<void> {
        await models.teacher_head_class.destroy({
            where: {
                teacher_id: teacherId,
            },
            transaction
        });
        await this.update({ teacher_id: teacherId }, 'class_id', classesId, {}, transaction);
    }
}

export class TeacherHeadSubjectRepository extends RelationRepository {
    constructor() {
        super(models.teacher_subject);
    }

    async linkHeadTeacherToSubjects(teacherId: number, subjectsId: number[], transaction: Transaction | null = null, noStop?: boolean) {
        await this.update({ teacher_id: teacherId, level_id: null }, 'subject_id', subjectsId, {}, transaction,noStop);
    }
}

interface IHeading {
    subject_id: number;
    level_id: number;
};

export class TeacherSubjectRepository extends RelationRepository {
    constructor() {
        super(models.teacher_subject);
    }

    async linkTeacherToSubjects(teacherId: number, headings: IHeading[], transaction: Transaction | null = null, noStop?: boolean): Promise<void> {
        await this.update2({ teacher_id: teacherId }, headings, (row: IHeading): string => [row.subject_id, row.level_id].join(':'), {}, transaction, noStop);
    }
}

export class TimeSetRepository extends RelationRepository {
    constructor() {
        super(models.time_set);
    }

    async linkYearToTimeSets(year_id: number, names: string[]) {
        await this.update({ year_id }, 'name', names);
    }
};

export class UserRoleRepository extends RelationRepository {
    constructor() {
        super(models.user_role, {
            school_id: null,
            branch_id: null,
            assignment_date: new Date(),
            archived: 0,
        });
    }

    async linkUserToSchools(userId: number, schoolsId: number[], roleId) {
        await this.update({ user_id: userId, role_id: roleId }, 'school_id', schoolsId);
    }

    async linkUserToBranches(userId: number, branchesId: number[], roleId) {
        await this.update({ user_id: userId, role_id: roleId }, 'branch_id', branchesId);
    }

    async linkSchoolToUsers(schoolId: number, adminsIds: number[], roleId, transaction: Transaction | null = null) {
        await this.update({ school_id: schoolId, role_id: roleId }, 'user_id', adminsIds, {}, transaction);
    }

    async linkBranchToUsers(branch_id: number, adminsIds: number[], roleId) {
        await this.update({ branch_id, role_id: roleId }, 'user_id', adminsIds);
    }
};

export class VenueSubjectRepository extends RelationRepository {
    constructor() {
        super(models.venue_subject);
    }

    async linkRoomToSubject(roomId: number, subjectsId: number[], transaction: Transaction | null = null) {
        await this.update({ venue_id: roomId }, 'subject_id', subjectsId, {}, transaction);
    }
};
