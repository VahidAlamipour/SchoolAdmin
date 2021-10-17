/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {report_periodInstance, report_periodAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<report_periodInstance, report_periodAttribute>('report_period', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        start: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        end: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        year_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'report_year',
                key: 'id'
            }
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: true,
            defaultValue: '0'
        },
        code: {
            type: DataTypes.INTEGER(11),
            allowNull: true,
            defaultValue: '0'
        }
    }, {
        tableName: 'report_period',
        timestamps: false,
        underscored: true
    });
};
