/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {subscription_transaction_typeInstance, subscription_transaction_typeAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<subscription_transaction_typeInstance, subscription_transaction_typeAttribute>('subscription_transaction_type', {
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
        code: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    }, {
        tableName: 'subscription_transaction_type',
        timestamps: false,
        underscored: true
    });
};
