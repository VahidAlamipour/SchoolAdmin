/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {pupilInstance, pupilAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<pupilInstance, pupilAttribute>('pupil', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        local_address: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        local_msisdn: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        nationality: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        religion: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        race: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        other: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        passport_id: {
            type: DataTypes.STRING(45),
            allowNull: true
        }
    }, {
        tableName: 'pupil',
        timestamps: false,
        underscored: true
    });
};
