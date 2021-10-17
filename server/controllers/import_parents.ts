import { Transaction } from 'sequelize';

import { GenericController, ReqUser } from '../crud';
import { userParser } from '../repositories/parser';

export default class CRUD extends GenericController<any> {
    public entity: string = 'teacher';
    public resource = '/import/parent';

    public async create(body, me: ReqUser, query, transaction: Transaction, files: any): Promise<number> {
        await userParser(files.fileData, { role: 'parent', user: me });
        return 1;
    }
}
