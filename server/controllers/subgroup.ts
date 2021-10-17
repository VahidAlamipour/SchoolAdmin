import { GenericController, ReqUser } from '../crud';
import { ISubGroup } from '../../sdk/interfaces';

const whereNotDisabled = { disabled: 0 };

export default class CRUD extends GenericController<ISubGroup> {
    public resource = '/subgroups';
    public entity = 'subgroup';

    public async findOne(id: number): Promise<ISubGroup> {
        const group: any = await this.models.group.findOne({
            distinct: true,
            where: {
                id
            },
            include: [{
                required: false,
                model: this.models.pupil_group,
                where: whereNotDisabled,
                include: [{
                    model: this.models.pupil_class,
                    where: whereNotDisabled,
                    include: [{
                        model: this.models.user_role,
                        where: {
                            ...whereNotDisabled,
                            archived: 0
                        },
                        include: [{
                            model: this.models.user,
                            where: whereNotDisabled,
                        }]
                    }]
                }]
            }]
        });

        if (!group) {
            const error: any = new Error(`SubGroup[${id}] not found`);
            error.code = 404;
            throw error;
        }
        let students = group.pupil_groups.map(pupil_group => pupil_group.pupil_class.user_role.user).map(user => {
            return {
                id: user.id,
                name: user.name,
                lastName: user.surname,
                middleName: user.middle_name
            };
        })
        
        let userIds: number[]=[] ;
        let result = [];
        students.forEach(element => {
            if (userIds.indexOf(element.id) < 0) {
                userIds.push(element.id)
                result.push(element);
            }
        });

        return {
            id: group.id,
            name: group.name,
            students: result
        };

    }
}
