import dayjs from 'dayjs';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import { ISegment } from '../../sdk/interfaces';

import LevelController from '../controllers/levels';
import {Transaction} from 'sequelize';
import {BeedError} from '../services/beed';
import { sequelize } from '../db';

const levelController = new LevelController();

export default  class CRUD extends GenericController<ISegment> {
    public entity: string = 'segment';
    public resource = '/segments';

    public async create(data: ISegment, me: ReqUser, query, transaction: Transaction): Promise<number> {
        const model = await this.models.segment.create({
            id: null,
            name: data.name,
            school_id: me.school.id,
            branch_id: me.school.branch.id
        }, {
            transaction
        });

        return model.id;
    }
    public async find(query: IPageQuery, me: ReqUser): Promise<{ rows: ISegment[]; count: number }> {
        const { rows, count } = await this.models.segment.findAndCountAll({
            where: {
                ...query.id ? {
                    id: query.id
                } : {},
                disabled: 0,
                school_id: query.schoolId || me.school.id,
            },
            order: [
                ['name', query.order]
            ],
            offset: query.page * query.limit,
            limit: query.limit,
        });

        return {
            count,
            rows: rows.map(row => ({
                id: row.id,
                name: row.name,
            })),
        };
    }
    public async update(id: number, data: ISegment, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await this.models.segment.update({
            name: data.name
        }, {
            where: { id, disabled: 0 },
            transaction
        });
    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await sequelize.query(`                                               
            SELECT 
                ma.id AS id
            FROM
                mark ma
                    JOIN
                user_role ur ON ma.learner_id = ur.user_id
                    JOIN
                pupil_class pc ON ur.id = pc.pupil_id
                    JOIN
                class cl ON pc.class_id = cl.id
                    JOIN
                segment_level sl ON cl.level_id = sl.id
            WHERE
                sl.segment_id = :id
            LIMIT 1                                
        `, {
            replacements: {id},
            type: sequelize.QueryTypes.SELECT,
            transaction,
        }).then((data): void => {
            if (data.length) {
                throw new BeedError('There are grades present for this segment and it can not be deleted.', 500);
            }
        });

        const segment_levels = await this.models.segment_level.findAll({
            where: {
                segment_id: id,
                disabled: 0
            },
            transaction
        });

        await Promise.all([
            this.models.segment.update({
                disabled: dayjs().unix(),
            }, {
                where: { id, disabled: 0 },
                transaction
            }),
            segment_levels.length && levelController.multiDelete(segment_levels.map((s): number => s.id), transaction, me.school, true),
        ])
    }
}
