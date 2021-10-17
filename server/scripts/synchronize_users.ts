import models from '../db';

import { RoleRepository } from '../repositories/role';
import {Messages} from '../repositories/messages';
const roleRepo = new RoleRepository();

const config = require('../config').load();

async function getBranch(schoolId: number): Promise<number> {
    const branchId = await models.school.findOne({
        attributes: ['branch_id'],
        where: {
            id: schoolId
        }
    }).then((data): number => {
        if(!data) {
            throw new Error('School not found');
        }

        if (!data.branch_id) {
            throw new Error('Branch not found');
        }

        return data.branch_id;
    });

    return branchId;
}

async function getUsers(branchId: number, schoolId: number): Promise<number[]> {
    const userIds = await models.user_role.findAll({
        attributes: ['user_id'],
        where: {
            $or: [{
                branch_id: branchId
            }, {
                school_id: schoolId
            }]
        }
    }).map((data): number => data.user_id);

    return userIds;
}

async function sendUserRoles(userId: number): Promise<void> {
    const newRoles = await roleRepo.getUserRoles(userId, undefined);

    await Messages.parseDiff(userId, undefined, newRoles, undefined);
}

async function main(): Promise<void> {
    const schoolIds: number[] = config.synchronizeUsers.schoolIds;

    for (const schoolId of schoolIds) {
        try {
            const branchId = await getBranch(schoolId);

            const userIds = await getUsers(branchId, schoolId);

            for (const userId of userIds) {
                await sendUserRoles(userId);
            }

            console.log(`School ${schoolId} is synchronized`)
        } catch (err) {
            console.log(`Error during school ${schoolId} handling: ${err}`)
        }
    }

    process.exit(0);
}

main();
