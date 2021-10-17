import models, {sequelize} from '../db';
import { MessageQueue } from '../services/queue';

const config = require('../config').load();
const queue = new MessageQueue(config.rabbitmq.connectstring);

import { RoleRepository } from '../repositories/role';
import {Messages} from '../repositories/messages';
import {Transaction} from 'sequelize';
const roleRepo = new RoleRepository();

const cityId = config.createStartUser.city.id;

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IBranchInfo {
    id: number;
    name: string;
    domain: string;
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface ISchoolInfo {
    id: number;
    name: string;
    fullName: string;
    cityId: number;
    branch: IBranchInfo;
}

async function createBranch(transaction: Transaction): Promise<IBranchInfo> {
    const configBranch = config.createStartUser.branch;
    if (configBranch.id) {
        try {
            const branch = await models.branch.findById(configBranch.id, {
                transaction
            }).then((data): IBranchInfo => {
                return {
                    id: data.id,
                    name: data.name,
                    domain: data.domain
                }
            });

            console.log(`Branch already exist: ${branch.id}`);

            return branch;
        } catch (err) {
            throw new Error(`Error search existed branch: ${err}`)
        }
    } else {
        try {
            const branchOption = {
                ...configBranch,
                city_id: cityId,
                disabled: false,
                full_name: '',
                domain: '',
            };

            const branch = await models.branch.create(branchOption, {
                transaction
            }).then((data): IBranchInfo => {
                if (data) {
                    return {
                        id: data.id,
                        name: data.name,
                        domain: data.domain
                    }
                }
            });

            await queue.emit('beedos.sync', branch, {
                event: 'CREATED',
                entity: 'branch',
                id: branch.id,
            });

            console.log(`Created branch: ${branch.id}`);

            return branch;
        } catch (err) {
            throw new Error(`Error create new branch: ${err}`)
        }
    }
}

async function createSchool(branch: IBranchInfo, transaction: Transaction): Promise<ISchoolInfo> {
    const configSchool = config.createStartUser.school;
    if (configSchool.id) {
        try {
            const school = await models.school.findById(configSchool.id, {
                transaction
            }).then((data): ISchoolInfo => {
                if (data) {
                    return {
                        id: data.id,
                        name: data.name,
                        fullName: data.full_name,
                        cityId: data.city_id,
                        branch: branch
                    };
                }
            });

            console.log(`School already exist: ${school.id}`);

            return school;
        } catch (err) {
            throw new Error(`Error search existed school: ${err}`)
        }

    } else {
        try {
            const schoolOption = {
                ...configSchool,
                city_id: cityId,
                branch_id: branch.id,
                disabled: false,
                full_name: '',
            };

            const school = await models.school.create(schoolOption, {
                transaction
            }).then((data): ISchoolInfo => {
                if (data) {
                    return {
                        id: data.id,
                        name: data.name,
                        fullName: data.full_name,
                        cityId: data.city_id,
                        branch: branch
                    };
                }
            });

            await queue.emit('beedos.sync', school, {
                event: 'CREATED',
                entity: 'school',
                id: school.id,
                schoolId: school.id,
                accountId: branch.id,
            });

            console.log(`Created school: ${school.id}`);

            return school;
        } catch (err) {
            throw new Error(`Error create new school: ${err}`)
        }
    }
}

async function createUser(school: ISchoolInfo, transaction: Transaction): Promise<void> {
    try {
        const userOption = {
            ...config.createStartUser.user,
        };

        const iface = await models.interface.findOne({
            where: {code: 'ADMIN'}
        });

        const id = await roleRepo.createUser(userOption, iface.pass_through_auth_url, transaction);

        await roleRepo.createAccountAdministrator(id, school.branch.id, transaction);

        console.log(`Created user: ${id}`);

        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, undefined, newRoles, transaction);
    } catch (err) {
        throw new Error(`Error create new admin: ${err}`)
    }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function main() {
    const transaction: Transaction = await sequelize.transaction();

    try {
        const branch = await createBranch(transaction);

        const school = await createSchool(branch, transaction);

        await createUser(school, transaction);
    } catch (err) {
        console.log(err);
        await transaction.rollback();

        process.exit(1);
    }

    await transaction.commit();
    process.exit(0);
}


main();
