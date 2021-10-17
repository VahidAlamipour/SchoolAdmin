/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {admin_role_accessInstance, admin_role_accessAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<admin_role_accessInstance, admin_role_accessAttribute>('admin_role_access', {
        id: {
            type: DataTypes.INTEGER(10),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        module_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'admin_module',
                key: 'id'
            }
        },
        role_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'role',
                key: 'id'
            }
        }
    }, {
        tableName: 'admin_role_access',
        timestamps: false,
        underscored: true
    });
};
