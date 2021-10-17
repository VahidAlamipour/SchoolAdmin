/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {schoolInstance, schoolAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<schoolInstance, schoolAttribute>('school', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        short_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        full_name: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        city_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'city',
                key: 'id'
            }
        },
        branch_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'branch',
                key: 'id'
            }
        },
        update_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        create_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        image_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        image_base64: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        active_report_year: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
        },
    }, {
        tableName: 'school',
        timestamps: false,
        underscored: true
    });
};
