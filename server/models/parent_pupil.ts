/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {parent_pupilInstance, parent_pupilAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<parent_pupilInstance, parent_pupilAttribute>('parent_pupil', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        parent_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        pupil_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        subscription_tariff_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'subscription_tariff',
                key: 'id'
            }
        },
        subscription_transaction_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'subscription_transaction',
                key: 'id'
            }
        },
        subscription_start_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        subscription_end_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        subscription_stoped: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: true,
            defaultValue: '0'
        },
        subscription_notified: {
            type: DataTypes.INTEGER(1),
            allowNull: true,
            defaultValue: '0'
        },
        archived: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        rank: {
            type: DataTypes.INTEGER(3).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        tableName: 'parent_pupil',
        timestamps: false,
        underscored: true
    });
};
