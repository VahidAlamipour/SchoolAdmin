import models, {sequelize} from '../db';
import {Transaction} from 'sequelize';
import csv from 'csvtojson';

import { RoleRepository } from '../repositories/role';
import {IStudent} from '../../sdk/interfaces';
import {Messages} from '../repositories/messages';
import {PupilClassRepository} from '../repositories/relation';

const pupilClassRepo = new PupilClassRepository();

const roleRepo = new RoleRepository();

const filename = process.env.FILE;
if (!filename) {
    throw new Error('File not specified');
}

interface IUserFromFile {
    last_name: string;
    first_name: string;
    email: string;
    gender: string;
    date_of_birth: Date;
    local_address: string;
    phone_number: string;
    mobile_number: string;
    permanent_address: string;
    nationality: string;
    religion: string;
    race: string;
    passport_or_birth_certificate: string;
    other: string;
    class_id: number;
}

class Migrate {
    public async Run(file): Promise<void> {
        try {
            const users = await this.ParseFile(file);

            for await (const user of users) {
                const transaction: Transaction = await sequelize.transaction();

                try {
                    user.id = await this.CreateLearner(user, transaction);

                    await this.SendMessage(user.id, transaction);

                    await transaction.commit();
                    console.log(`User ${user.email} successful added`)
                } catch (err) {
                    console.log(`Error creating user ${user.email}: ${err}`);
                    await transaction.rollback();
                }
            }

            process.exit(0);
        } catch (err) {
            console.log(err);
            process.exit(1);
        }
    }

    private async ParseFile(filename: string): Promise<IStudent[]> {
        return await csv().fromFile(filename).then((users: IUserFromFile[]): IStudent[] => {
            return users.map((user): IStudent => {
                return {
                    name: user.first_name,
                    lastName: user.last_name,
                    middleName: '',
                    email: user.email,
                    msisdn: user.phone_number,
                    birthday: user.date_of_birth,
                    address: user.permanent_address,
                    localAddress: user.local_address,
                    nationality: user.nationality,
                    religion: user.religion,
                    race: user.race,
                    passportBirthCertificate: user.passport_or_birth_certificate,
                    other: user.other,
                    educationalClassId: user.class_id
                }
            });
        });
    }

    private async CreateLearner(user: IStudent, transaction: Transaction): Promise<number> {
        const user_id = await roleRepo.createUser(user, undefined, transaction);

        const schoolId = await models.class.findOne({
            attributes: ['school_id'],
            where: {
                id: user.educationalClassId
            },
            transaction
        }).then(data => data.school_id);

        const id = await roleRepo.addUserRole(user_id, 'LEARNER', { school_id: schoolId }, transaction);

        await Promise.all([
            models.pupil.create({
                id: user_id,
                local_address: user.address,
                local_msisdn: user.msisdn,
                passport_id: user.passportBirthCertificate,
                nationality: user.nationality,
                religion: user.religion,
                race: user.race,
                other: user.other,
            }, {
                transaction
            }),
            pupilClassRepo.linkPupilToClasses(id, [user.educationalClassId], transaction)
        ]);

        return user_id;
    }

    private async SendMessage(id: number, transaction: Transaction): Promise<void> {
        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, undefined, newRoles, transaction);
    }
}

new Migrate().Run(filename);
