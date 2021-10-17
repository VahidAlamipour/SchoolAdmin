import { Op } from 'sequelize';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import { ICity } from '../../sdk/interfaces';

export default class CRUD extends GenericController<ICity> {
    public resource = '/cities';
    public entity = 'city';

    public async find(query: IPageQuery & { countryId?: number }, me: ReqUser): Promise<{ rows: ICity[]; count: number }> {
        const searchField = 'name';

        const iModels = await this.models.city.findAndCountAll({
            distinct: true,
            where: {
                ...query.countryId ? {
                    country_id: query.countryId
                } : {},
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
            include: [
                {
                    required: !query.countryId,
                    model: this.models.school,
                    where: {
                        disabled: 0,
                        ...me.access.isSuperAdmin ? {} : {
                            [Op.or]: [
                                {
                                    id: me.access.schoolsId,
                                }, {
                                    branch_id: me.access.branchesId,
                                },
                            ],
                        },
                    }
                },
            ],
        });

        return {
            count: iModels.count,
            rows: iModels.rows.map((row: any): ICity => ({
                id: row.id,
                name: row.name,
                countryId: row.country_id,
                schoolsCount: row.schools.length,
            })),
        }
    }
}