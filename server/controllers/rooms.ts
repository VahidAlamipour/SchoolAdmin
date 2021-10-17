import Sequelize, { Op, Transaction } from 'sequelize';
import dayjs from 'dayjs';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import { IRoom, ISubject } from '../../sdk/interfaces';

import { VenueSubjectRepository } from '../repositories/relation';

const venueSubjRepo = new VenueSubjectRepository();

export default class RoomsCRUD extends GenericController<IRoom> {
    public entity: string = 'room';
    public resource = '/rooms';

    private mapper(row): IRoom {
        const teacher = row.users[0];
        return {
            id: row.id,
            name: row.name,
            description: row.description || '',
            capacity: row.capacity,
            subjects: row.subjects.map((row): ISubject => ({
                id: row.id,
                name: row.name
            })),
            teacher: teacher ? {
                id: teacher.id,
                name: teacher.name,
                lastName: teacher.surname,
                middleName: teacher.middle_name,
                msisdn: teacher.msisdn,
                birthday: new Date(teacher.birthday),
                email: teacher.email,
                address: teacher.address,
                gender: teacher.gender,
            } : undefined
        };
    }
    public async create(data: IRoom, me: ReqUser, query, transaction: Transaction): Promise<number> {
        const model = await this.models.venue.create({
            id: null,
            name: data.name,
            description: data.description,
            capacity: data.capacity,
            school_id: me.school.id,
            teacher_id: data.teacherId || null, // HACK to avoid zero
        }, {
            transaction
        });

        await venueSubjRepo.linkRoomToSubject(model.id, data.subjectsIds, transaction);

        return model.id;
    }
    public async find(query: IPageQuery & { subject?: number }, me: ReqUser): Promise<{ rows: IRoom[]; count: number }> {
        const searchField = 'name';

        const options = {
            distinct: true,
            where: {
                disabled: 0,
                school_id: me.school.id,
                ...query.id ? {
                    id: query.id
                } : {},
                ...query.query ? {
                    [searchField]: {
                        [Sequelize.Op.like]: `%${query.query}%`
                    }
                } : {}
            },
            include: [{
                model: this.models.subject,
                where: query.subject && query.subject != 0 ? {
                    id: query.subject,
                    is_disabled: 0,
                } : undefined,
                through: {
                    where: {
                        disabled: 0
                    }
                }
            }, {
                model: this.models.user
            }],
        };

        const result = await this.models.venue.findAll({
            ...options,
            order: [
                [searchField, query.order]
            ],
            offset: query.page * query.limit,
            limit: query.limit,
        });

        const count = await this.models.venue.count(options);

        return {
            rows: result.map(this.mapper),
            count,
        };
    }
    public async update(id: number, data: IRoom, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await Promise.all([
            this.models.venue.update({
                name: data.name,
                capacity: data.capacity,
                description: data.description,
                teacher_id: data.teacherId || null, // HACK to avoid zero
            }, {
                where: {
                    id,
                    disabled: 0
                },
                transaction
            }),
            venueSubjRepo.linkRoomToSubject(id, data.subjectsIds, transaction),
        ]);
    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        const today = new Date();
        const schedules = await this.models.schedule.findOne({
            where: {
                venue_id: id,
                disabled:0,
                date: {
                    [Op.gte]: today,
                }
            }
        });
        if (schedules) {
            const error: any = new Error('Facility is linked to the timetable and cannot be deleted.');
            error.code = 500;
            throw error;
            return;
        }
        await Promise.all([
            this.models.venue.update({
                disabled: dayjs().unix()
            }, {
                where: {
                    id,
                    disabled: 0
                },
                transaction
            }),
            venueSubjRepo.linkRoomToSubject(id, [], transaction),
        ]);
    }
}

