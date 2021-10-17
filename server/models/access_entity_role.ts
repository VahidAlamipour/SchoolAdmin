/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {access_entity_roleInstance, access_entity_roleAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<access_entity_roleInstance, access_entity_roleAttribute>('access_entity_role', {
        role_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'role',
                key: 'id'
            }
        },
        access_entity_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'access_entity',
                key: 'id'
            }
        },
        access_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'access',
                key: 'id'
            }
        },
        degree_of_restrict: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true
        }
    }, {
        tableName: 'access_entity_role',
        timestamps: false,
        underscored: true
    });
};
