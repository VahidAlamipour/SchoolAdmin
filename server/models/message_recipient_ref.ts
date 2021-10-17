/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {message_recipient_refInstance, message_recipient_refAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<message_recipient_refInstance, message_recipient_refAttribute>('message_recipient_ref', {
        messages_chain_recipient_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'messages_chain_recipient',
                key: 'id'
            }
        },
        user_role_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'user_role',
                key: 'id'
            }
        }
    }, {
        tableName: 'message_recipient_ref',
        timestamps: false,
        underscored: true
    });
};
