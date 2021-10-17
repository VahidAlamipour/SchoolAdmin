import { Router, Request, Response, NextFunction, Application } from 'express';
import { Transaction } from 'sequelize';
import { MessageQueue } from './services/queue';
import { rmqLog } from './log';

const config = require('./config').load();
const queue = new MessageQueue(config.rabbitmq.connectstring);

import models, { sequelize } from './db';
import { BeedError } from './services/beed';
import { EImportTypes, IImportOptions as IClientImportOptions } from './../sdk/interfaces'
interface IRequest extends Request {
    files?: any;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface IPageQuery {
    id?: number;
    query?: string;
    fullTextSearch?: boolean;
    page?: number;
    limit?: number;
    order?: 'desc' | 'asc' | '';
    exclude?: number[];
    schoolId?: number;
    branchId?: number;
    isSLC?:boolean;
}

export interface ReqUser {
    id: number;
    oauthId: number | null;
    name: string;
    middleName: string;
    lastName: string;
    access: {
        isSuperAdmin: boolean;
        schoolsId: number[];
        branchesId: number[];
    };
    interfaces: {
        [codename: string]: string;
    };
    school: {
        id: number;
        name: string;
        city: {
            id: number;
            name: string;
        };
        branchId: number;
        branch?: {
            id: number;
            name: string;
            domain: string;
        };
        active_report_year?: number;
    };
    config: {
        [codename: string]: string;
    };
}

export interface IImportOptions extends IClientImportOptions {
    role: EImportTypes;
    user: ReqUser;
}

export abstract class GenericController<T> {
    public router: Router = Router();

    public entity: string;

    protected models = models;

    public resource: string;

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    constructor() {
        this.extra();

        this.router.get('/', async (req: IRequest, res: Response): Promise<void> => {
            req.query.limit = parseInt(req.query.limit) || 10;
            req.query.page = parseInt(req.query.page) || 0;

            if (req.query.limit < 0) {
                req.query.limit = 100500;
            }

            if (!req.query.limit) {
                req.query.page = 0;
            }

            if (!req.query.order) {
                req.query.order = 'ASC'
            }

            if (req.query.query) {
                const q = req.query.query.replace(new RegExp(config.queryBadChars, 'g'), ' ');
                req.query.query = q;
                req.query.fullTextSearch = !q.includes('@') && q.length > 3;
            }

            const result = await this.find(req.query, req.user);

            res.json({
                count: result.count,
                list: result.rows,
                page: req.query.page,
                pages: Math.floor(result.count / req.query.limit),
            });
        });

        this.router.post('/', async (req: IRequest, res: Response): Promise<void> => {
            const transaction: Transaction = await sequelize.transaction();

            try {
                if (!req.files) {
                    const id = await this.create(req.body, req.user, req.query, transaction);

                    await this.emit({
                        id,
                        event: 'CREATED',
                    }, {
                        ...req.body,
                        id
                    }, req.user.school, transaction);

                    res.json(id);
                } else {
                    this.create(req.body, req.user, req.query, transaction, req.files);
                    res.json("OK");
                }
            } catch (err) {
                await transaction.rollback();

                throw err;
            }

            await transaction.commit();
        });

        this.router.param('id', (req: IRequest, res: Response, next: NextFunction, id: string): void => {
            if (parseInt(id) > 0) {
                next();
            } else {
                throw new BeedError('Bad id', 400);
            }
        });

        this.router.get('/:id', async (req: IRequest, res: Response): Promise<void> => {
            const data = await this.findOne(req.params.id, req.user, req.query);
            res.json(data);
        });

        this.router.put('/:id', async (req: IRequest, res: Response): Promise<void> => {
            const transaction: Transaction = await sequelize.transaction();
            try {
                const id = await this.update(req.params.id, req.body, req.user, req.query, transaction,req.session);

                await this.emit({
                    id: req.params.id,
                    event: 'UPDATED',
                }, {
                    ...req.query,
                    ...req.body,
                    id: id || req.params.id
                }, req.user.school);

                res.json(id);
            } catch (err) {
                await transaction.rollback();

                throw err;
            }

            await transaction.commit();
        });

        this.router.delete('/:id', async (req: IRequest, res: Response): Promise<void> => {
            const transaction: Transaction = await sequelize.transaction();

            try {
                await this.delete(req.params.id, req.user, req.query, transaction);

                await this.emit({
                    ...req.params,
                    event: 'DELETED',
                }, {
                    ...req.params,
                    ...req.query
                }, req.user.school);

                res.json('OK');
            } catch (err) {
                await transaction.rollback();

                throw err;
            }

            await transaction.commit();
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async emit(headers: any = {}, payload: any = {}, school, transaction: Transaction | null = null): Promise<void> {
        if (!this.entity || this.entity == 'permission') {
            return;
        }

        if (this.entity === 'branch') {
            headers.accountId = payload.id;
        } else if (this.entity === 'school') {
            headers.schoolId = payload.id;
            if (school.branch) {
                headers.accountId = school.branch.id;
            }
            delete (payload.image);
        } else if (this.entity === 'year') {
            if (headers.event == 'CREATED') {
                payload.id = payload.id.yearId;
                headers.id = payload.id;
            }
            headers.schoolId = payload.schoolId;
            if (school.branch) {
                headers.accountId = school.branch.id;
            }
            if (['UPDATED', 'CREATED'].includes(headers.event)) {
                delete (payload.yearId);
                delete (payload.schoolId);
            }
        } else if (this.entity == 'timetable') {
            headers.schoolId = school.id;
            if (school.branch) {
                headers.accountId = school.branch.id;
            }

            if (headers.emiter !== 'local') {
                return;
            }
            delete (headers.emiter);

            if (headers.event === 'UPDATED') {
                delete (payload.all);
                delete (payload.academicYearId);
                delete (payload.classId);
                delete (payload.repeat);
            }
        } else {
            headers.schoolId = school.id;
            if (school.branch) {
                headers.accountId = school.branch.id;
            }
        }

        if ((new Set(['admin', 'parent', 'teacher', 'student', 'school'])).has(this.entity)) {
            if (headers.emiter !== 'local') {
                return;
            }
        } else if (this.entity === 'level' && payload.value) {
            payload.name = await models.level.findOne({
                where: { id: payload.value },
                transaction
            }).then((data): string => data.name);
            payload.value = undefined;
        }

        headers.entity = this.entity;

        rmqLog.info(`Message sent to queue: {\n\theaders: ${JSON.stringify(headers)},\n\tpayload: ${JSON.stringify(payload)}\n}`);
        return queue.emit('beedos.sync', payload, headers);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async find(query: IPageQuery, me: ReqUser): Promise<{ rows: T[]; count: number }> {
        throw new BeedError('Method not implemented.', 404);
    }

    public async findOne(id: number, me: ReqUser, query): Promise<T> {
        const data = await this.find({
            order: 'asc',
            ...query,
            limit: 1,
            page: 0,
            id,
        }, me);

        if (!data.count) {
            throw new BeedError(`${this.entity || 'entity'} not found`, 400);
        }

        return data.rows[0];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async create(data: T, me: ReqUser, query, transaction: Transaction, files?: any): Promise<number> {
        throw new BeedError('Method not implemented.', 404)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async update(id: number, data: T, me: ReqUser, query, transaction: Transaction,session): Promise<number | void> {
        throw new BeedError('Method not implemented.', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        throw new BeedError('Method not implemented.', 404);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async import(data: T, me: ReqUser, query, transaction: Transaction): Promise<void> {
        throw new BeedError('Method not implemented.', 404);
    }

    public extra(): void {

    }

    public mount(app: Application): void {
        if (!this.resource) {
            throw new Error('undefined crud resource');
        }

        app.use(this.resource, this.router);
    }

    public async sendDeleteMessages(id: number, school, transaction: Transaction): Promise<void> {
        await this.emit({
            id: id,
            entity: this.entity,
            event: 'DELETED',
        }, {
            id: id,
        }, school, transaction);
    }
}
