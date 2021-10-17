/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {subscription_featureInstance, subscription_featureAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<subscription_featureInstance, subscription_featureAttribute>('subscription_feature', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ''
        },
        code: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: ''
        },
        visible: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '1'
        }
    }, {
        tableName: 'subscription_feature',
        timestamps: false,
        underscored: true
    });
};
