import { Op, literal, Transaction } from 'sequelize';
import { sequelize } from '../db';

import { IAdministrator, IParent, IStudent } from '../../sdk/interfaces';
import { GenericController, IPageQuery, ReqUser } from '../crud';

import { RoleRepository } from '../repositories/role';
import { Messages } from '../repositories/messages';
import { BeedError } from '../services/beed';

const roleRepo = new RoleRepository();

const genderMap = {
    mother: 'female',
    father: 'male',
    guardian: null
};

export default class CRUD extends GenericController<IParent> {
    private familyRole = {
        male: 'father',
        female: 'mother',
    }

    private direct = {
        mother: 1,
        father: 1,
        guardian: 0,
        '': null,
    }

    public resource = '/parents';
    public entity = 'parent';

    public async create(data: IParent, me: ReqUser, query, transaction: Transaction): Promise<number> {
        await this.validate(data);

        const id = await roleRepo.createUser({
            ...data,
            gender: genderMap[data.familyRole],
        }, undefined, transaction, true);
        const oldRolesForMessage = await roleRepo.getUserRoles(id, transaction);

        //#region check parent in this school
        const parentRoleId = await this.getRoles();
        let oldRole = await this.models.user_role.findOne({
            where: {
                user_id: id,
                role_id: parentRoleId
            }
        });
        if (oldRole) {
            var studentsInThisSchool = await sequelize.query(`SELECT urs.user_id FROM parent_pupil pp
            LEFT JOIN user_role urs ON urs.id = pp.pupil_id
            WHERE pp.parent_id = ${oldRole.id} AND urs.school_id = ${me.school.id} AND pp.archived =0 AND urs.disabled = 0 AND urs.archived = 0`,
                { type: sequelize.QueryTypes.SELECT, transaction });
            if (studentsInThisSchool && studentsInThisSchool.length) {
                throw new BeedError('There is a parent with such email in this school please use update', 500)
            }
        }
        //#endregion
        await Promise.all([
            this.models.parent.update({
                nationality: data.nationality || '',
                passport_id: data.passportBirthCertificate,
                phone_number: data.phoneNumber,
                designation: data.designation,
                company: data.company,
                company_address: data.companyAddress,
                material_status: data.parentsStatus,
                direct: this.direct[data.familyRole],
            }, {
                where: {
                    id
                },
                transaction
            }),
            roleRepo.createParent(id, data.studentsIds, transaction, true, true)
        ]);

        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, oldRolesForMessage, newRoles, transaction,{parent:true,type:'CREATE'},undefined,me.school);

        return id;
    }
    private mapper(user): IParent {
        if (!user) {
            const error: any = new Error('Parent not found');
            error.code = 400;
            throw error;
        }

        const userRole = user.user_roles[0];

        const parent: any = user.parent || {};

        let familyRole: 'mother' | 'father' | any = ''
        if (parent.direct !== null) {
            if (parent.direct) {
                familyRole = this.familyRole[user.gender];
            } else {
                familyRole = 'guardian';
            }
        }

        return {
            id: user.id,
            name: user.name,
            lastName: user.surname,
            middleName: user.middle_name,
            msisdn: user.msisdn,
            birthday: user.birthday,
            email: user.email,
            address: user.address,
            //active: user.activated ? !user.disabled : null,
            //active: !userRole.disabled,
            active: !userRole.pupils[0].parent_pupil.disabled,
            nationality: parent.nationality,
            familyRole,
            gender: user.gender,
            parentsStatus: parent.material_status,
            passportBirthCertificate: parent.passport_id,
            phoneNumber: parent.phone_number,
            designation: parent.designation,
            company: parent.company,
            companyAddress: parent.company_address,
            roles: [],
            students: userRole.pupils.map(({ user, pupilClasses }): IStudent => {
                const eduClass = pupilClasses[0];

                return {
                    id: user.id,
                    name: user.name,
                    lastName: user.surname,
                    middleName: user.middle_name,
                    msisdn: user.msisdn,
                    birthday: user.birthday,
                    email: user.email,
                    address: user.address,
                    active: user.activated ? !user.disabled : null,
                    gender: user.gender,
                    educationalClass: {
                        id: eduClass.id,
                        name: eduClass.name,
                        showName: eduClass.show_name,
                        levelId: eduClass.level_id,
                        schoolId: eduClass.school_id
                    }
                };
            }),
        };
    }
    private async getRoles(): Promise<number[]> {
        const roles = await this.models.role.findAll({
            where: {
                disabled: 0,
                sub_code: 'PARENT',
            },
        });

        return roles.map(({ id }): number => id);
    }
    public async find(query: IPageQuery & { classId?: number, disabled?: number }, me: ReqUser): Promise<{ rows: IParent[]; count: number }> {
        const roles = await this.getRoles();

        const searchField = ['name', 'surname', 'middle_name', 'msisdn', 'email'];
        const searchFields = searchField.map((key): string => 'user.' + key);
        var disabledQuery = null;
        if (query.disabled != undefined && query.disabled != null) {
            disabledQuery = { disabled: query.disabled }
        }
        const schoolId = query.schoolId || me.school.id;
        const userRoleMixin = {
            ...schoolId ? {
                school_id: schoolId
            } : null
        };

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
                model: this.models.parent,
            }, {
                model: this.models.user_role,
                where: {
                    archived: 0,
                    role_id: roles,
                },
                include: [{
                    required: true,
                    model: this.models.user_role,
                    as: 'pupils',
                    through: {
                        where: { archived: 0, ...disabledQuery }
                    },
                    where: {
                        ...userRoleMixin,
                        archived: 0,
                        disabled: 0,
                    },
                    include: [{
                        model: this.models.user
                    }, {
                        model: this.models.class,
                        as: 'pupilClasses',
                        where: {
                            ...(query.classId && query.classId > 0) ? {
                                id: query.classId
                            } : {},
                            disabled: 0
                        },
                        through: {
                            where: { disabled: 0 }
                        }
                    }
                    ]
                }]
            }]
        });

        return {
            count: userModels.count,
            rows: userModels.rows.map((user: any): IParent => ({
                ...this.mapper(user)
            })),
        };
    }
    private async validate(data: IParent): Promise<void> {
        if (!data.studentsIds || !data.studentsIds.length) {
            const error: any = new Error('Parent hasn\'t children');
            error.code = 400;
            throw error;
        }
    }
    public async update(id: number, data: IParent, me: ReqUser, query, transaction: Transaction): Promise<void> {
        await this.validate(data);

        const activationStatus = await sequelize.query(`SELECT pp.parent_id, pp.disabled from user_role ur
                                        LEFT JOIN parent_pupil pp ON pp.parent_id = ur.id
                                        LEFT JOIN user_role url ON pp.pupil_id = url.id 
                                        WHERE ur.user_id = ${id} AND url.school_id = ${me.school.id} AND pp.archived = 0 LIMIT 1`,
            { type: sequelize.QueryTypes.SELECT, transaction });

        const oldRoles = await roleRepo.getUserRoles(id, transaction);

        const parentOptions = {
            nationality: data.nationality,
            passport_id: data.passportBirthCertificate,
            phone_number: data.phoneNumber,
            designation: data.designation,
            company: data.company,
            company_address: data.companyAddress,
            material_status: data.parentsStatus,
            direct: data.familyRole !== 'guardian' ? 1 : 0
        };

        await Promise.all([
            await roleRepo.updateUser(id, {
                ...data,
                gender: genderMap[data.familyRole],
            }, transaction),
            this.models.parent.update(parentOptions, {
                where: { id },
                transaction
            }),
            roleRepo.createParent(id, data.studentsIds, transaction, undefined, true, me.school.id)
        ]);

        //#region Keep all relation the same activation status
        if (activationStatus[0].disabled) {
            const newConnections = await sequelize.query(`SELECT pp.id from user_role ur
            LEFT JOIN parent_pupil pp ON pp.parent_id = ur.id
            LEFT JOIN user_role url ON pp.pupil_id = url.id 
            WHERE ur.user_id = ${id} AND url.school_id = ${me.school.id} AND pp.archived = 0`,
                { type: sequelize.QueryTypes.SELECT, transaction });
                
            await sequelize.query(`UPDATE parent_pupil SET disabled = 1 WHERE id IN (${newConnections.map(x=>x.id)});`,
                { type: sequelize.QueryTypes.UPDATE, transaction });
        }

        //#endregion

        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, oldRoles, newRoles, transaction, { parent: true }, undefined, me.school);
    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        //const oldRoles = await roleRepo.getUserRoles(id, transaction);


        var parent_pupil_ids = await sequelize.query(`SELECT pp.id FROM parent_pupil pp
            LEFT JOIN user_role ur on ur.id = pp.parent_id
            LEFT JOIN user_role url ON url.id = pp.pupil_id
            WHERE ur.user_id = ${id} AND url.school_id = ${me.school.id}`,
            { type: sequelize.QueryTypes.SELECT, transaction });
        await sequelize.query(`UPDATE parent_pupil
            SET disabled = 1, archived = 1
            WHERE id IN (${parent_pupil_ids.map(row => row.id)});`,
            { type: sequelize.QueryTypes.UPDATE, transaction });

        //await roleRepo.createParent(id, [], transaction,undefined,true);

        //const newRoles = await roleRepo.getUserRoles(id, transaction);

        const baseMessage = await roleRepo.getUserMessage(id, transaction);
        const parent = await this.models.parent.findById(id, {
            transaction
        }).then(data => {
            return {
                nationality: data ? data.nationality : '',
                passportBirthCertificate: data ? data.passport_id : '',
                phoneNumber: data ? data.phone_number : '',
                designation: data ? data.designation : '',
                company: data ? data.company : '',
                companyAddress: data ? data.company_address : '',
                parentsStatus: data ? data.material_status : '',
                familyRole: ((gender: string): string => {
                    if (gender === 'female') {
                        return 'mother'
                    } else if (gender === 'male') {
                        return 'father'
                    } else {
                        return 'guardian'
                    }
                })(baseMessage.message.gender)
            }
        });
        baseMessage.message = { ...baseMessage.message, ...parent };
        baseMessage.message["studentsIds"] = [];
        await Messages.prepareMessage(baseMessage, me.school.branchId, me.school.id, 'DELETED', 'parent');

        //await Messages.parseDiff(id, oldRoles, newRoles, transaction);
    }
}
