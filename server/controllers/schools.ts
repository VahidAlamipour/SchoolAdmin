import { Op, literal, Transaction } from 'sequelize';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import { ISchool, IImage } from '../../sdk/interfaces';

import { UserRoleRepository } from '../repositories/relation';
import { RoleRepository } from '../repositories/role';
import { Messages, IMessage } from '../repositories/messages';

const userRoleRepository = new UserRoleRepository();
const roleRepo = new RoleRepository();


export default class CRUD extends GenericController<ISchool> {
    public entity: string = 'school';
    public resource = '/schools';

    private checkUserAccess(me: ReqUser): void {
        if (!me.access.isSuperAdmin && !me.access.branchesId.length) {
            throw new Error('Access only for account admins');
        }
    }
    public async create(data: ISchool, me: ReqUser, query, transaction: Transaction): Promise<number> {
        this.checkUserAccess(me);

        const image = this.validateImage(data.image);

        const model = await this.models.school.create({
            id: null,
            name: data.name,
            full_name: data.fullName,
            city_id: data.cityId,
            branch_id: me.school.branchId,
            create_date: new Date(),
            update_date: new Date(),
            disabled: 0,
            ...image,
        }, {
            transaction
        });

        data.branch = {
            id: me.school.branch.id,
            name: me.school.branch.name,
            domain: me.school.branch.domain,
        };

        await this.linkAdmins(model.id, data.adminId, transaction);




        //#region rabbitMQ messages 
        const schoolBaseMessage: IMessage = {
            header: {
                id: +model.id,
                oauthId: undefined
            },
            message: {
                id: +model.id,
                name: model.name,
                fullName: model.full_name,
                cityId: model.city_id,
                adminId: data.adminId,
                branch: data.branch,
                oauthId: undefined,
                lastName: undefined,
                middleName: undefined,
                msisdn: undefined,
                birthday: undefined,
                email: undefined,
                active: undefined,
                status: undefined
            }
        }
        await Messages.prepareMessage(schoolBaseMessage,
            me.school.branch ? me.school.branch.id : undefined , +model.id, 'CREATED', 'school');
        if (data.adminId && data.adminId.length > 0) {
            const accountId = data.branch.id;
            const adminsIds = data.adminId;
            for (const adminId of adminsIds) {
                const baseMessage = await roleRepo.getUserMessage(adminId, transaction);
                await Messages.prepareMessage(baseMessage, +accountId, +model.id, 'CREATED', 'admin');
            }
        }

        //#endregion

        return model.id;
    }
    public async find(query: IPageQuery & { cityId?: number }, me: ReqUser): Promise<{ rows: ISchool[]; count: number }> {
        const searchField = ['name', 'full_name'];
        const searchFields = searchField.map((key): string => 'school.' + key);

        const data = await this.models.school.findAndCountAll({
            where: {
                disabled: 0,
                ...me.access.isSuperAdmin ? {} : {
                    [Op.or]: [
                        {
                            id: me.access.schoolsId,
                        }, {
                            branch_id: me.access.branchesId,
                        },
                    ],
                },
                ...query.query ? {
                    [Op.and]: [
                        query.fullTextSearch
                            ? literal(`MATCH(${searchFields.join(', ')}) AGAINST('${query.query}*' IN BOOLEAN MODE)`)
                            : literal(`CONCAT_WS(${searchFields.join(', " ",')}) LIKE '%${query.query}%'`)
                    ]
                } : {},
                ...query.cityId && query.cityId > 0 ? {
                    city_id: query.cityId
                } : {},
                ...query.exclude ? {
                    id: {
                        [Op.notIn]: query.exclude,
                    },
                } : {},
                ...query.id ? {
                    id: query.id
                } : {},
            },
            limit: query.limit,
            offset: query.limit * query.page,
            order: searchField.map((field): [string, string] => [field, query.order]),
            group : ['school.id'],
            include: [{
                model: this.models.city,
                include: [{
                    model: this.models.country
                }]
            }, {
                model: this.models.branch,
            },{
                model:this.models.report_year
            }]
        });
        return {
            count: data.count,
            rows: data.rows.map((row: any) => ({
                ...this.mapper(row)
            })),
        };
    }
    private mapper(row): any {
        return row ? {
            id: row.id,
            name: row.name,
            fullName: row.full_name,
            cityId: row.city_id,
            city: row.city,
            image: (row.image_name && row.image_base64) ? {
                name: row.image_name,
                base64: row.image_base64,
            } : undefined,
            activeAcademicYear: row.active_report_year,
            branchId: row.branch_id,
            academicYearList : row.report_years
        } : undefined;
    }
    public async update(id: number, data: ISchool, me: ReqUser, query, transaction: Transaction): Promise<void> {
        try {
            this.checkUserAccess(me);
        } catch {
            if (!(new Set(me.access.schoolsId)).has(+id)) {
                throw new Error(`No access to school ${id}`);
            }
        }
        const image = this.validateImage(data.image);
        let oldAdmins = await this.models.user.findAll({
            include: [{
                model: this.models.user_role,
                where: { school_id: id, disabled: 0, archived: 0 },
                include: [{
                    model: this.models.role,
                    where: {
                        code: 'ADMINISTRATOR',
                        disabled: 0,
                    }
                }]
            }],
            transaction
        });
        let schoolDataBeforeUpdate = await this.models.school.findById(id,{
            transaction
        });
        await Promise.all([
            this.models.school.update({
                name: data.name,
                full_name: data.fullName,
                // branch_id: me.school.branchId, HACK to set branch_id
                city_id: data.cityId,
                active_report_year:data.activeAcademicYear,
                ...image,
            }, {
                where: { id },
                transaction
            }),
            (me.access.isSuperAdmin || me.access.branchesId.length) && this.linkAdmins(id, data.adminId, transaction)
        ]);
        data.branch = {
            id: me.school.branch.id,
            name: me.school.branch.name,
            domain: me.school.branch.domain,
        }
        //#region rabbitMQ messages 
        const schoolBaseMessage: IMessage = {
            header: {
                id: id,
                oauthId: undefined
            },
            message: {
                id: id,
                name: data.name,
                fullName: data.fullName,
                cityId: data.cityId,
                adminId: data.adminId,
                branch: data.branch,
                oauthId: undefined,
                lastName: undefined,
                middleName: undefined,
                msisdn: undefined,
                birthday: undefined,
                email: undefined,
                active: undefined,
                status: undefined
            }
        }
        await Messages.prepareMessage(schoolBaseMessage,
            me.school.branch ? me.school.branch.id : undefined, id, 'UPDATED', 'school');

        const adminsIds = data.adminId || [];
        let oldAdminIds = oldAdmins.map(oldAdmin => oldAdmin.id);
        let deletedAdminsIds = [];
        let addedAdminsIds = [];
        oldAdmins && oldAdmins.length > 0 &&  oldAdmins.forEach(user => {
            if (!(adminsIds.indexOf(user.id) > -1)) {
                deletedAdminsIds.push(user.id);
            }
        });
        adminsIds && adminsIds.length>0 && adminsIds.forEach(newAdminId => {
            if (!(oldAdminIds.indexOf(newAdminId) > -1)) {
                addedAdminsIds.push(newAdminId);
            }
        })
        const accountId = data.branch.id;
        for (const adminId of deletedAdminsIds) {
            const baseMessage = await roleRepo.getUserMessage(adminId, transaction);
            await Messages.prepareMessage(baseMessage, +accountId, id, 'DELETED', 'admin');
        }
        for (const adminId of addedAdminsIds) {
            const baseMessage = await roleRepo.getUserMessage(adminId, transaction);
            await Messages.prepareMessage(baseMessage, +accountId, id, 'CREATED', 'admin');
        }
        if (data.activeAcademicYear) {
            if(schoolDataBeforeUpdate && schoolDataBeforeUpdate.active_report_year && schoolDataBeforeUpdate.active_report_year != data.activeAcademicYear){
                setTimeout(() => {
                    Messages.prepareMessage({header :{id: data.activeAcademicYear}, message:{id: data.activeAcademicYear}}, +accountId, id, 'UPDATED', 'activeYear');
                }, 3000);
            }
        }
        //#endregion
    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        this.checkUserAccess(me);

        await Promise.all([
            this.models.school.update({
                disabled: 1
            }, {
                where: { id },
                transaction
            }),
            this.linkAdmins(id, [], transaction)
        ]);
    }
    private async linkAdmins(id, adminsIds = [], transaction: Transaction | null = null): Promise<void> {
        const role = await this.models.role.findOne({
            where: {
                code: 'ADMINISTRATOR',
                disabled: 0,
            },
            transaction
        });

        await userRoleRepository.linkSchoolToUsers(id, adminsIds, role.id, transaction);
    }

    private validateImage(image: IImage): {
        image_name: string;
        image_base64: string;
    } {
        if (image) {
            if (image.name && image.base64) {
                if (image.name.search(/.*(\.png|\.jpg|\.jpeg)$/) === -1) {
                    throw new Error('Invalid image format')
                }

                return {
                    image_name: image.name,
                    image_base64: image.base64,
                }
            }
        }

        return {
            image_name: null,
            image_base64: null,
        };
    }
}
