/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {interface_roleInstance, interface_roleAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<interface_roleInstance, interface_roleAttribute>('interface_role', {
        interface_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'interface',
                key: 'id'
            }
        },
        role_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'role',
                key: 'id'
            }
        }
    }, {
        tableName: 'interface_role',
        timestamps: false,
        underscored: true
    });
};
