/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {venueInstance, venueAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<venueInstance, venueAttribute>('venue', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        capacity: {
            type: DataTypes.INTEGER(4),
            allowNull: true
        },
        teacher_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        school_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'school',
                key: 'id'
            }
        },
        disabled: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            defaultValue: '0'
        }
    }, {
        tableName: 'venue',
        timestamps: false,
        underscored: true
    });
};
