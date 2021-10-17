/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {subscription_postponedInstance, subscription_postponedAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<subscription_postponedInstance, subscription_postponedAttribute>('subscription_postponed', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        tariff_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'subscription_tariff',
                key: 'id'
            }
        },
        parent_pupil_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'parent_pupil',
                key: 'id'
            }
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        transaction_id: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        stoped: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'subscription_postponed',
        timestamps: false,
        underscored: true
    });
};
