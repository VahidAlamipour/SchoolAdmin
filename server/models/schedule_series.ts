/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {schedule_seriesInstance, schedule_seriesAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<schedule_seriesInstance, schedule_seriesAttribute>('schedule_series', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        shift_interval_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true
        }
    }, {
        tableName: 'schedule_series',
        timestamps: false,
        underscored: true
    });
};
