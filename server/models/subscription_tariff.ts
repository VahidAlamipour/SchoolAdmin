/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {subscription_tariffInstance, subscription_tariffAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<subscription_tariffInstance, subscription_tariffAttribute>('subscription_tariff', {
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
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        model: {
            type: DataTypes.STRING(45),
            allowNull: false,
            defaultValue: ''
        },
        duration: {
            type: DataTypes.ENUM('MONTH','QUARTER','YEAR','FOREVER'),
            allowNull: false,
            defaultValue: 'QUARTER'
        },
        amount: {
            type: DataTypes.DECIMAL,
            allowNull: false,
            defaultValue: '0.000'
        },
        rank: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        disabled: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        },
        visible: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        }
    }, {
        tableName: 'subscription_tariff',
        timestamps: false,
        underscored: true
    });
};
