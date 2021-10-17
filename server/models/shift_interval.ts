/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {shift_intervalInstance, shift_intervalAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<shift_intervalInstance, shift_intervalAttribute>('shift_interval', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true
        },
        interval: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            allowNull: false,
            defaultValue: '1',
            unique: true
        }
    }, {
        tableName: 'shift_interval',
        timestamps: false,
        underscored: true
    });
};
