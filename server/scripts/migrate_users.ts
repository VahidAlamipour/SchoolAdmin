import {sequelize} from '../db';
import {Transaction} from 'sequelize';
import csv from 'csvtojson';

import { RoleRepository } from '../repositories/role';
import {ITeacher} from '../../sdk/interfaces';
import {Messages} from '../repositories/messages';

const roleRepo = new RoleRepository();

const schoolId = Number(process.env.SCHOOL);
if (!schoolId) {
    throw new Error('School not specified');
}

interface IUserFromFile {
    last_name: string;
    first_name: string;
    email: string;
    middle_name: string;
    date_of_birth: Date;
    phone_number: string;
    education: string;
    university: string;
    speciality: string;
    category: string;
    year_of_graduation: Date;
    last_career_training: Date;
}

class Migrate {
    public async Run(file): Promise<void> {
        try {
            const users = await this.ParseFile(file);

            for await (const user of users) {
                const transaction: Transaction = await sequelize.transaction();

                try {
                    user.id = await this.CreateTeacher(user, transaction);

                    await this.SendMessage(user.id, transaction);

                    await transaction.commit();
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

    private async ParseFile(filename: string): Promise<ITeacher[]> {
        return await csv().fromFile(filename).then((users: IUserFromFile[]): ITeacher[] => {
            return users.map((user): ITeacher => {
                return {
                    name: user.first_name,
                    lastName: user.last_name,
                    middleName: user.middle_name,
                    email: user.email,
                    msisdn: user.phone_number,
                    birthday: user.date_of_birth,
                    address: '',
                    education: user.education,
                    university: user.university,
                    speciality: user.speciality,
                    category: user.category,
                    graduationYear: user.year_of_graduation,
                    trainingYear: user.last_career_training,
                    schoolId: schoolId,
                    isCurriculumDirector: true,
                }
            });
        });
    }

    private async CreateTeacher(user: ITeacher, transaction: Transaction): Promise<number> {
        const id = await roleRepo.createUser(user, undefined, transaction);

        await roleRepo.createTeachers(id, [user], transaction);

        return id;
    }

    private async SendMessage(id: number, transaction: Transaction): Promise<void> {
        const newRoles = await roleRepo.getUserRoles(id, transaction);

        await Messages.parseDiff(id, undefined, newRoles, transaction);
    }
}

new Migrate().Run("");
