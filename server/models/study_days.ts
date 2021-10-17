/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {study_daysInstance, study_daysAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<study_daysInstance, study_daysAttribute>('study_days', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        day_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'days',
                key: 'id'
            }
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
            type: DataTypes.INTEGER(1),
            allowNull: true,
            defaultValue: '0'
        }
    }, {
        tableName: 'study_days',
        timestamps: false,
        underscored: true
    });
};
