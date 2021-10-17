/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {access_entityInstance, access_entityAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<access_entityInstance, access_entityAttribute>('access_entity', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true
        }
    }, {
        tableName: 'access_entity',
        timestamps: false,
        underscored: true
    });
};
