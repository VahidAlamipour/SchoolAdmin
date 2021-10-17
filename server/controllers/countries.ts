import { Op } from 'sequelize';

import { GenericController, IPageQuery } from '../crud';
import { ICountry } from '../../sdk/interfaces';

export default class CRUD extends GenericController<ICountry> {
    public resource = '/countries';
    public entity = 'country';

    public async find(query: IPageQuery): Promise<{ rows: ICountry[]; count: number }> {
        const searchField = 'name';

        const iModels = await this.models.country.findAndCountAll({
            where: {
                ...query.query ? {
                    [searchField]: {
                        [Op.like]: `%${query.query}%`,
                    },
                } : {},
            },
            limit: query.limit,
            offset: query.limit * query.page,
            order: [
                [searchField, query.order],
            ],
        });

        return {
            count: iModels.count,
            rows: iModels.rows.map((row): ICountry => ({
                id: row.id,
                name: row.name,
            })),
        }
    }
}