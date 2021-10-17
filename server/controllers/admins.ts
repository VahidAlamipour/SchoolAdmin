import { Op, literal, Transaction } from 'sequelize';
import { sequelize } from '../db';
import { keyBy, flatten } from 'lodash';
import { Request, Response, NextFunction } from 'express';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import { IAdministrator, IUser, ISchool } from '../../sdk/interfaces';

import { RoleRepository } from '../repositories/role';
import { Messages } from '../repositories/messages';

const roleRepo = new RoleRepository();
export class BeedError extends Error {
    public readonly code: number;

    public constructor(message: string, code: number) {
        super(message);
        this.code = code;
    }
}

export default class CRUD extends GenericController<IAdministrator> {
    public resource = '/admins';
    public entity = 'admin';

    public async create(data: IAdministrator, me: ReqUser, query, transaction: Transaction): Promise<number> {
        const iface = await this.models.interface.findOne({
            where: { code: 'ADMIN' },
            transaction
        });
        const id = await roleRepo.createUser(data, iface.pass_through_auth_url, transaction, true);
        const oldRolesForMessage = await roleRepo.getUserRoles(id, transaction);

        const availableRoles = await this.getAvailableRoles();
        let oldRoles = await this.models.user_role.findAll({
            where: {
                user_id: id,
                role_id: availableRoles.map(role => role.id)
            }
        });
        const activeRoles = oldRoles.filter(role => role.disabled == 0 && role.archived == 0);
        const disabledRoles = oldRoles.filter(role => role.disabled == 1 && role.archived == 0);
        const archivedRoles = oldRoles.filter(role => role.disabled == 1 && role.archived == 1);
        if (activeRoles && activeRoles.length) {
            throw new BeedError('Adminastrator with such email already exists', 500)
        }
        if (disabledRoles && disabledRoles.length) {
            throw new BeedError('There is a inactive Adminastrator with such email', 500)
        }
        if (archivedRoles && archivedRoles.length) {
            for (const item of archivedRoles) {
                await sequelize.query(`UPDATE user_role
                SET school_id = NULL,description=${item.school_id}
                WHERE id = ${item.id}`,
                    { type: sequelize.QueryTypes.UPDATE, transaction });
            }
        }

        await roleRepo.createAdmins(id, data.schoolsId, [], transaction);

        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, oldRolesForMessage, newRoles, transaction);

        return id;
    }
    public async update(id: number, data: IAdministrator, me: ReqUser, query, transaction: Transaction): Promise<void> {
        const baseMessage = await roleRepo.updateUser(id, data, transaction);

        await Messages.prepareMessage(baseMessage, undefined, undefined, 'UPDATED', 'user')
    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        const oldRoles = await roleRepo.getUserRoles(id, transaction);

        await roleRepo.createAdmins(id, undefined, undefined, transaction, false, true);

        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, oldRoles, newRoles, transaction);
    }
    private async getSchools(id): Promise<{ id: number; name?: string }[]> {
        return this.models.school.findAll({
            where: { id, disabled: 0 },
            include: [
                this.models.city,
                {
                    required: false,
                    model: this.models.branch,
                    where: { disabled: 0 }
                }
            ]
        })
    }
    private async getBranches(id): Promise<{ id: number; name?: string }[]> {
        return this.models.branch.findAll({
            where: { id, disabled: 0 },
            include: [
                this.models.city
            ],
        });
    }
    private mapper(user): IUser {
        return {
            id: user.id,
            name: user.name,
            lastName: user.surname,
            middleName: user.middle_name,
            msisdn: user.msisdn,
            email: user.email,
            address: user.address,
            birthday: user.birthday,
            active: !user.user_roles[0].disabled,
            //active: user.activated ? !user.disabled : null
        };
    }
    private branchMapper(branch): Partial<any> {
        return {
            id: branch.id,
            name: branch.name,
            city: branch.city ? {
                id: branch.city.id,
                name: branch.city.name,
            } : undefined,
        };
    }
    private schoolMapper(school): ISchool {
        return {
            id: school.id,
            name: school.name,
            city: {
                id: school.city.id,
                name: school.city.name,
            },
        };
    }
    public async find(query: IPageQuery & { type?: string }, me: ReqUser): Promise<{ rows: IAdministrator[]; count: number }> {
        const searchField = ['name', 'surname', 'middle_name', 'msisdn', 'email'];
        const searchFields = searchField.map((key): string => 'user.' + key);

        const userRoleMixin: any = {};

        const myBranchSchools = await this.models.school.findAll({
            where: {
                branch_id: me.access.branchesId,
                disabled: 0
            },
            attributes: ['id']
        }).then((data): number[] => data.length ? data.map(({ id }): number => id) : [0]);

        const roles = await this.getAvailableRoles();

        const rolesMap: Map<number, string> = new Map(roles.map((row: any): [number, string] => [row.id, row.code]));

        const rolesRevMap: Map<string, number> = new Map(roles.map((row: any): [string, number] => [row.code, row.id]));

        const userModels: any = await this.models.user.findAndCountAll({
            distinct: true,
            limit: query.limit,
            offset: query.limit * query.page,
            order: searchField.map((field): [string, string] => [field, query.order]),
            where: {
                ...query.id ? {
                    id: query.id
                } : {},
                ...query.query ? {
                    [Op.and]: [
                        query.fullTextSearch
                            ? literal(`MATCH(${searchFields.join(', ')}) AGAINST('${query.query}*' IN BOOLEAN MODE)`)
                            : literal(`CONCAT_WS(${searchFields.join(', " ",')}) LIKE '%${query.query}%'`)
                    ]
                } : {}
            },
            include: [{
                model: this.models.user_role,
                where: {
                    ...userRoleMixin,
                    archived: 0,
                    //disabled: 0,
                    role_id: roles.map(({ id }) => id),
                    ...query.type ? {
                        role_id: rolesRevMap.get(query.type)
                    } : null,
                    ...query.schoolId ? {
                        school_id: query.schoolId
                    } : {},
                    ...query.branchId ? {
                        branch_id: query.branchId
                    } : {},
                    [Op.or]: [{
                        school_id: [...myBranchSchools, ...me.access.schoolsId],
                    }, {
                        branch_id: me.access.branchesId
                    }]
                }
            }]
        });

        const schools = await this.getSchools(flatten(
            userModels.rows.map(user => user.user_roles.map(role => role.school_id).filter(Boolean))
        ));

        const schoolsHash = keyBy(schools, 'id');

        return {
            count: userModels.count,
            rows: userModels.rows.map((user: any): IAdministrator => ({
                ...this.mapper(user),
                types: [...new Set(user.user_roles.map((userRole): number => userRole.role_id))].map((id: number): string => rolesMap.get(id)).sort(),
                schools: user.user_roles
                    .filter(role => rolesMap.get(role.role_id) === 'ADMINISTRATOR')
                    .map(role => schoolsHash[role.school_id])
                    .filter(Boolean)
                    .map(row => this.schoolMapper(row)),
            })),
        }
    }
    private async getAvailableRoles(): Promise<{ id: number; code: string }[]> {
        const roles = await this.models.role.findAll({
            where: {
                disabled: 0,
                [Op.or]: [{
                    code: {
                        [Op.like]: 'ACCOUNT%'
                    },
                }, {
                    sub_code: ['ADMINISTRATOR'] // HARDCODE
                }]
            },
            order: [['code', 'ASC']],
            attributes: ['id', 'code']
        });

        return roles;
    }
    public extra(): void {
        this.router.use(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
            const user: ReqUser = req.user;

            if (!user.access.isSuperAdmin && !user.access.branchesId.length) {
                throw new Error('Access only for account admins');
            } else {
                next();
            }
        });

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
