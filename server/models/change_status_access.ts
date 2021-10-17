/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {change_status_accessInstance, change_status_accessAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<change_status_accessInstance, change_status_accessAttribute>('change_status_access', {
        role_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'role',
                key: 'id'
            }
        },
        status_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'report_card_status',
                key: 'id'
            }
        },
        destination_status_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'report_card_status',
                key: 'id'
            }
        }
    }, {
        tableName: 'change_status_access',
        timestamps: false,
        underscored: true
    });
};
