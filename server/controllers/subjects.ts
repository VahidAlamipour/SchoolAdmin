import {Op, Transaction} from 'sequelize';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import {ISubject} from '../../sdk/interfaces';
import {subjectInstance} from '../models/db';
import {sequelize} from '../db';
import config from '../config';

const curriculumDB = config.get('curriculum_db');

export default class CRUD extends GenericController<ISubject> {
    public entity: string = 'subject';
    public resource = '/subjects';

    public async find(query: IPageQuery, me: ReqUser): Promise<{ rows: ISubject[]; count: number }> {
        const subjectRefs = await this.models.school_subject.findAll({
            where: {
                ...query.id ? {
                    subject_id: query.id
                } : null,
                ...me.school.branchId ? {
                    [Op.or]: [{
                        branch_id: me.school.branchId
                    }, {
                        school_id: me.school.id
                    }]
                } : {
                    school_id: me.school.id
                },
                disabled: 0
            },
        });

        const searchField = 'name';

        console.log(searchField, query);
        const data = await this.models.subject.findAndCountAll({
            attributes: ['id', 'name'],
            where: {
                id: subjectRefs.map(({ subject_id }): number => subject_id),
                ...query.query ? {
                    [searchField]: {
                        [Op.like]: `%${query.query}%`,
                    },
                } : {},
                is_disabled: 0
            },
            order: [
                [searchField, query.order]
            ],
            offset: query.page * query.limit,
            limit: query.limit,
        });

        return {
            rows: data.rows,
            count: data.count,
        };
    }
    private async getOrCreateSubject(name: string, transaction: Transaction | null = null): Promise<subjectInstance> {
        let subject = await this.models.subject.findOne({
            where: {
                name, is_disabled: 0
            },
            transaction
        });

        if (!subject) {
            subject = await this.models.subject.create({
                id: null,
                name, is_disabled: 0
            }, {
                transaction
            });
        }

        return subject;
    }
    public async create(data: ISubject, me: ReqUser, query, transaction: Transaction): Promise<number> {
        const subject = await this.getOrCreateSubject(data.name, transaction);

        await this.models.school_subject.create({
            id: null,
            subject_id: subject.id,
            ...me.school.branchId ? {
                branch_id: me.school.branchId
            } : {
                school_id: me.school.id
            },
            disabled: 0,
        }, {
            transaction
        });

        return subject.id;
    }
    public async update(id: number, data: ISubject, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await this.models.subject.update({
            name: data.name
        }, {
            where: { id, is_disabled: 0 },
            transaction
        });

        await sequelize.query(`
            UPDATE ${curriculumDB}.template T
            LEFT JOIN ${curriculumDB}.template_type TT ON T.type_id = TT.id
            SET T.name = ?
            WHERE subject_id = ? AND TT.code = "COURSE" AND T.is_disabled = 0
        `, {
            replacements: [data.name, id]
        });
    }
}
