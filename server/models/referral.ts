/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {referralInstance, referralAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<referralInstance, referralAttribute>('referral', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        message_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'messages_log',
                key: 'id'
            }
        },
        to_user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user_role',
                key: 'id'
            }
        },
        from_user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user_role',
                key: 'id'
            }
        },
        date_time_send: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        date_time_active: {
            type: DataTypes.DATE,
            allowNull: true
        },
        activated: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        attempt: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        }
    }, {
        tableName: 'referral',
        timestamps: false,
        underscored: true
    });
};
