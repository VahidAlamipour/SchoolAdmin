/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {subscription_transactionInstance, subscription_transactionAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<subscription_transactionInstance, subscription_transactionAttribute>('subscription_transaction', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        type_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'subscription_transaction_type',
                key: 'id'
            }
        },
        agent_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'subscription_transaction_agent',
                key: 'id'
            }
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'user',
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
        parent_pupil_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'parent_pupil',
                key: 'id'
            }
        },
        transaction_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        date_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        confirm_transaction: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'subscription_transaction',
        timestamps: false,
        underscored: true
    });
};
