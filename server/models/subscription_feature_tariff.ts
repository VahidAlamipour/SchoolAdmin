/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {subscription_feature_tariffInstance, subscription_feature_tariffAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<subscription_feature_tariffInstance, subscription_feature_tariffAttribute>('subscription_feature_tariff', {
        feature_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'subscription_feature',
                key: 'id'
            }
        },
        tariff_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'subscription_tariff',
                key: 'id'
            }
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'subscription_feature_tariff',
        timestamps: false,
        underscored: true
    });
};
