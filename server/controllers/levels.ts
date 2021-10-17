import { keyBy, sortBy } from 'lodash';
import {Op, Transaction} from 'sequelize';
import dayjs from 'dayjs';
import { Request, Response } from 'express';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import {ILevel} from '../../sdk/interfaces';

import ClassController from '../controllers/classes';
import {BeedError} from '../services/beed';
import Sequelize from 'sequelize';
import config from '../config';
export const sequelize = new Sequelize(config.get('db'));

const classController = new ClassController();

export default class CRUD extends GenericController<ILevel> {
    public entity: string = 'level';
    public resource = '/levels';

    // TODO REMOVE times will be deprecated with new api
    private async getOrCreateLevelByName(code: number, transaction: Transaction | null = null) {
        let level = await this.models.level.findOne({
            where: {
                name: code,
                disabled: 0
            },
            transaction
        });

        if (!level) {
            const error: any = new Error('Level not found');
            error.code = 404;
            throw error;
        } 

        return level;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async create(data: ILevel, me: ReqUser, query, transaction: Transaction): Promise<number> {
        const level = data.value ? { id: data.value } : await this.getOrCreateLevelByName(+data.name, transaction);

        try {
            const model = await this.models.segment_level.create({
                id: null,
                level_id: level.id,
                segment_id: data.segmentId,
                disabled: 0,
            }, {
                transaction
            });

            await model.reload({
                transaction
            });

            return model.id;
        } catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                throw new BeedError('This level already exists', 500);
            } else {
                throw err;
            }
        }
    }
    public async find(query: IPageQuery & { segmentId?: number }, me: ReqUser): Promise<{ rows: ILevel[]; count: number }> {
        if (query.query) {
            const err: any = new Error('earch dont work');
            err.code = 400;
            throw err;
        }

        const segments = query.segmentId ? [] : await this.models.segment.findAll({
            where: {
                school_id: me.school.id,
                disabled: 0,
            },
        });

        const segmentsHash = keyBy(segments, 'id');

        const data = await this.models.segment_level.findAndCountAll({
            where: {
                ...query.id ? {
                    id: query.id
                } : {},
                segment_id: query.segmentId || segments.map(({ id }) => id),
                disabled: 0,
            },
            limit: query.limit,
            offset: query.limit * query.page,
        });

        const levelsHash = keyBy(await this.models.level.findAll(), 'id');

        return {
            count: data.count,
            rows: data.rows.map(row => {
                const level = levelsHash[row.level_id];
                const segment = segmentsHash[row.segment_id];

                return {
                    id: row.id,
                    name: level.name,
                    segment: query.segmentId ? undefined : {
                        id: segment.id,
                        name: segment.name,
                    },
                };
            }),
        };
    }
    public async update(id: number, data: ILevel, me: ReqUser, query, transaction: Transaction): Promise<void> {
        const level = data.value ? { id: data.value } : await this.getOrCreateLevelByName(+data.name, transaction);

        try {
            await this.models.segment_level.update({
                level_id: level.id,
            }, {
                where: {
                    id,
                    disabled: 0
                },
                transaction
            });
        } catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                throw new BeedError('This level already exists', 500);
            } else {
                throw err;
            }
        }
    }
    public async multiDelete(ids: number[], transaction: Transaction, school?, fromSegment:boolean = false): Promise<void> {
        const classes = await this.models.class.findAll({
            where: {
                level_id: ids,
            },
            transaction
        });

        if(classes && classes.length > 0) {
            const classIds = classes.map((c): number => c.id).join(',');
            var dbLearners: any[] = await sequelize.query(
                `SELECT count(*) as count FROM user_role ur
                LEFT JOIN pupil_class pc ON pc.pupil_id = ur.id
                WHERE pc.class_id In (${classIds}) AND ur.archived = 0 AND ur.disabled = 0 AND ur.role_id = 73 AND pc.disabled = 0`,
                { type: sequelize.QueryTypes.SELECT, transaction });
    
            if(dbLearners && dbLearners.length > 0 && dbLearners[0].count > 0 && !fromSegment) {
                throw new BeedError('Level cannot be deleted. Please remove Learners from this level first.', 500)
            }

            if(dbLearners && dbLearners.length > 0 && dbLearners[0].count > 0 && fromSegment) {
                throw new BeedError('Segment cannot be deleted. Please remove Learners from this segment first.', 500)
            }
        }

        if (school) {
            await Promise.all(ids.map(async (id: number): Promise<void> => {
                await this.sendDeleteMessages(id, school, transaction)
            }))
        }

        await Promise.all([
            this.models.segment_level.update({
                disabled: dayjs().unix()
            }, {
                where: {
                    id: ids,
                },
                transaction,
            }),
            classController.multiDelete(classes.map((c): number => c.id), transaction, school),
        ]);
    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await this.multiDelete([id], transaction);
    }
    public extra(): void {
        this.router.get('/values', async (req: Request, res: Response): Promise<void> => {
            let idNotIn = [];

            if (+req.query.segmentId) {
                const segmentLevels = await this.models.segment_level.findAll({
                    where: {
                        disabled: 0,
                        segment_id: req.query.segmentId
                    }
                });

                idNotIn = segmentLevels.map((row): number => row.level_id);
            }

            const rows = await this.models.level.findAll({
                where: {
                    id: {
                        [Op.not]: idNotIn
                    },
                    disabled: 0,
                },
                attributes: ['id', 'name'],
            });

            res.json(sortBy(rows, (row): number => +row.name));
        });
    }
}
