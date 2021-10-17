/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {levelInstance, levelAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<levelInstance, levelAttribute>('level', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(55),
            allowNull: false,
            defaultValue: '',
            unique: true
        },
        code: {
            type: DataTypes.INTEGER(4).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'level',
        timestamps: false,
        underscored: true
    });
};
