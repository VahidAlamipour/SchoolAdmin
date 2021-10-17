import { Op, literal, Transaction } from 'sequelize';
import { sequelize } from '../db';
import { GenericController, ReqUser, IPageQuery } from '../crud';
import { IStudent, IParent } from '../../sdk/interfaces';
import { Messages, IMessage } from '../repositories/messages';
import { BeedError } from '../services/beed';

import { RoleRepository } from '../repositories/role';
import { ParentPupilRepository, PupilClassRepository } from '../repositories/relation';

const roleRepo = new RoleRepository();
const parentPupilRepo = new ParentPupilRepository();
const pupilClassRepo = new PupilClassRepository();

export default class CRUD extends GenericController<IStudent> {
    public entity: string = 'student';
    public resource = '/students';

    public async create(data: IStudent, me: ReqUser, query, transaction: Transaction): Promise<number> {
        await this.validate(data);

        const user_id = await roleRepo.createUser(data, undefined, transaction, true);
        const learnerAndEducatorInClassValid = await roleRepo.checkLearnerAndEducatorInClass(user_id,
            [{class_id : data.educationalClassId}], []);
        if (!learnerAndEducatorInClassValid) {
            const errorr: any = new Error("User cannot be both educator and learner in the same class");
            errorr.code = 500;
            throw errorr;
        }
        const oldRolesForMessage = await roleRepo.getUserRoles(user_id, transaction);
        const availableRoles = await this.getRoles();
        let oldRoles = await this.models.user_role.findAll({
            where: {
                user_id: user_id,
                school_id: me.school.id,
                role_id: availableRoles
            }
        });
        if (oldRoles && oldRoles.length) {
            const activeRoles = oldRoles.filter(role => role.disabled == 0 && role.archived == 0);
            const disabledRoles = oldRoles.filter(role => role.disabled == 1 && role.archived == 0);
            const archivedRoles = oldRoles.filter(role => role.disabled == 1 && role.archived == 1);
            if (activeRoles && activeRoles.length) {
                throw new BeedError('Learner not created due to email already exist.', 500)
            }
            if (disabledRoles && disabledRoles.length) {
                throw new BeedError('There is a inactive learner with such email in this school', 500)
            }
            // if (archivedRoles && archivedRoles.length) {
            //     var updatedId = await sequelize.query(`UPDATE user_role
            //     SET school_id = NULL,description=${me.school.id}
            //     WHERE id IN (${archivedRoles.map(arole => arole.id)})`,
            //         { type: sequelize.QueryTypes.UPDATE, transaction });
            // }
        }
        const id = await roleRepo.addUserRole(user_id, 'LEARNER', { school_id: me.school.id }, transaction);

        await Promise.all([
            this.models.pupil.insertOrUpdate({
                id: user_id,
                local_address: data.localAddress,
                local_msisdn: data.phoneNumber,
                passport_id: data.passportBirthCertificate,
                nationality: data.nationality,
                religion: data.religion,
                race: data.race,
                other: data.other,
            }, {
                transaction,
                returning: false,
            }),
            parentPupilRepo.linkPupilToParents(id, data.parentsIds, transaction),
            pupilClassRepo.linkPupilToClasses(id, [data.educationalClassId], transaction)
        ]);


        const newRoles = await roleRepo.getUserRoles(user_id, transaction);


        //#region addAcademicYear to message
        var targetClass = await this.models.class.findById(data.educationalClassId);
        let destination = {
            fromYearId: null,
            toYearId: targetClass.year_id,
            classId: data.educationalClassId,
            msgType: "CREATED",
            oldClassId: null
        }
        //#endregion

        await Messages.parseDiff(user_id, oldRolesForMessage, newRoles, transaction, { parent: false }, destination);

        return user_id;
    }
    private async getRoles(): Promise<number[]> {
        const roles = await this.models.role.findAll({
            where: {
                disabled: 0,
                sub_code: 'LEARNER',
            },
        });

        return roles.map(({ id }): number => id);
    }
    private async validate(data: IStudent): Promise<void> {
        if (!data.educationalClassId) {
            const error: any = new Error('Class not defined');
            error.code = 400;
            throw error;
        }
    }
    public async find(query: IPageQuery & { classId?: number, disabled?: number }, me: ReqUser): Promise<{ rows: IStudent[]; count: number }> {
        const roles = await this.getRoles();

        const searchField = ['name', 'surname', 'middle_name', 'msisdn', 'email'];
        const searchFields = searchField.map((key): string => 'user.' + key);
        var disabledQuery = null;
        if (query.disabled != undefined && query.disabled != null) {
            disabledQuery = { disabled: query.disabled }
        }
        const userRoleMixin = {
            school_id: me.school.id
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
                required: false,
                model: this.models.pupil,
            }, {
                model: this.models.user_role,
                where: {
                    ...userRoleMixin,
                    archived: 0,
                    ...disabledQuery,
                    role_id: roles,
                },
                include: [{
                    required: true,
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
                    },
                }, {
                    required: false,
                    model: this.models.user_role,
                    as: 'parents',
                    through: {
                        where: { disabled: 0 }
                    },
                    where: {
                        archived: 0,
                        disabled: 0,
                    },
                    include: [{
                        model: this.models.user
                    }]
                }]
            }]
        });

        return {
            count: userModels.count,
            rows: userModels.rows.map((user: any): IParent => ({
                ...this.mapper(user, me.school.active_report_year)
            })),
        };
    }
    private mapper(user, active_report_year) {
        const userRole = user.user_roles[0];
        const pupil = user.pupil || {};
        let eduClass;
        if (active_report_year) {
            let userClass = userRole.pupilClasses.filter(x => x.year_id == active_report_year);
            if (userClass && userClass.length > 0) {
                eduClass = userClass[0];
            } else {
                eduClass = userRole.pupilClasses[0];
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
            active: !user.user_roles[0].disabled,
            gender: user.gender,
            localAddress: pupil.local_address,
            phoneNumber: pupil.local_msisdn,
            passportBirthCertificate: pupil.passport_id,
            nationality: pupil.nationality,
            religion: pupil.religion,
            race: pupil.race,
            other: pupil.other,
            parents: userRole.parents.filter((role): boolean => role.user).map((role): IParent => ({
                id: role.user.id,
                name: role.user.name,
                lastName: role.user.surname,
                middleName: role.user.middle_name,
                msisdn: role.user.msisdn,
                birthday: role.user.birthday,
                email: role.user.email,
                address: role.user.address,
                gender: role.user.gender,
            })),
            educationalClass: eduClass ? {
                id: eduClass.id,
                name: eduClass.name,
                showName: eduClass.show_name,
                yearId: eduClass.year_id,
                levelId: eduClass.level_id,
                level: eduClass.segment_level ? {
                    id: eduClass.level_id,
                    name: eduClass.segment_level.level.name
                } : undefined
            } : undefined
        };
    }
    public async update(id: number, data: IStudent, me: ReqUser, query, transaction: Transaction): Promise<void> {
        const userRoleModel = await this.models.user_role.findOne({
            where: {
                user_id: id,
                school_id: me.school.id,
            },
            include: [{
                model: this.models.role,
                where: { code: 'LEARNER' },
            }],
            transaction
        });
        let oldClassId = null;
        //#region 
        var targetClass = await this.models.class.findById(data.educationalClassId);
        var otherClassInThisYear = await this.models.pupil_class.findAll({
            where: {
                pupil_id: userRoleModel.id,
                disabled: 0
            },
            include: [{
                attributes: ["id"],
                model: this.models.class,
                where: {
                    year_id: targetClass.year_id,
                    disabled: 0,
                }
            }],
        });
        if (otherClassInThisYear && otherClassInThisYear.length > 0 &&
            otherClassInThisYear[0].class_id != data.educationalClassId) {
            oldClassId = otherClassInThisYear[0].class_id;
        }
        //#endregion






        let message;

        await Promise.all([
            this.models.pupil.update({
                local_address: data.localAddress,
                local_msisdn: data.phoneNumber,
                passport_id: data.passportBirthCertificate,
                nationality: data.nationality,
                religion: data.religion,
                race: data.race,
                other: data.other || '' //HACK for sequelize Query was empty
            }, {
                where: { id },
                transaction
            }),
            (async () => {
                message = await roleRepo.updateUser(id, data, transaction)
            })(),
            parentPupilRepo.linkPupilToParents(userRoleModel.id, data.parentsIds, transaction, undefined, true),
            //data.educationalClassId && pupilClassRepo.linkPupilToClasses(userRoleModel.id, [data.educationalClassId], transaction,true),
        ]);

        if (message) {
            message.message = await roleRepo.addStudentInfo(id, me.school.branchId, me.school.id, message.message, transaction);
            message.message.academicYearId = targetClass.year_id;
            if (oldClassId) {
                message.message.oldEducationalClassId = oldClassId
            }
            await Messages.prepareMessage(message, me.school.branchId, me.school.id, 'UPDATED', 'student');
        }
        //#region parent message 
        // var oldParent = await sequelize.query(`SELECT ur.user_id FROM parent_pupil pp
        //     LEFT JOIN user_role ur ON pp.parent_id = ur.id
        //     WHERE pp.pupil_id = ${userRoleModel.id} AND pp.disabled = 0 AND pp.archived = 0 
        //     AND ur.disabled = 0 AND ur.archived = 0`,
        //     { type: sequelize.QueryTypes.SELECT });



        // // var oldParent = await this.models.parent_pupil.findAll({
        // //     where: {
        // //         pupil_id: userRoleModel.id,
        // //         disabled: 0
        // //     },
        // //     attributes: ['parent_id']
        // // });
        // let parentChangedFlag = data.parentsIds.length != oldParent.length;

        // if (!parentChangedFlag) {
        //     let pIds: number[] = data.parentsIds.sort(a => a).sort(a => a);
        //     let opIds: number[] = oldParent.map(x => x.user_id).sort(a => a);
        //     pIds.forEach((item, index) => {
        //         if (item != opIds[index]) {
        //             parentChangedFlag = true;
        //         }
        //     });
        // }
        // if (parentChangedFlag) {
        //     console.log("send message ")
        // }
        //#endregion
    }
    public async delete(id: number, me: ReqUser, query, transaction: Transaction): Promise<void> {
        const oldRoles = await roleRepo.getUserRoles(id, transaction);

        await roleRepo.deleteLearner(id, me.school.id, transaction);

        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, oldRoles, newRoles, transaction);
    }
}
