import { Transaction } from 'sequelize';

import { GenericController, ReqUser } from '../crud';
import { userParser, learnerImporterFromList } from '../repositories/parser';

export default class CRUD extends GenericController<any> {
    public entity: string = 'teacher';
    public resource = '/import/learner';

    public async create(body, me: ReqUser, query, transaction: Transaction, files: any): Promise<number> {
        if (body.learners && body.learners.length > 0) {
            // when admin try to import from list
            await learnerImporterFromList(body.learners, { role: 'learner', user: me, ...body });
        } else {
            // when admin try to import from file
            await userParser(files.fileData, { role: 'learner', user: me, ...body });
        }
        //
        return 1;
    }
}
