/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {subscription_school_tariffInstance, subscription_school_tariffAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<subscription_school_tariffInstance, subscription_school_tariffAttribute>('subscription_school_tariff', {
        school_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'school',
                key: 'id'
            }
        },
        subscription_tariff_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'subscription_tariff',
                key: 'id'
            }
        },
        default: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        },
        disabled: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'subscription_school_tariff',
        timestamps: false,
        underscored: true
    });
};
