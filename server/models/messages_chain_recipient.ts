/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {messages_chain_recipientInstance, messages_chain_recipientAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<messages_chain_recipientInstance, messages_chain_recipientAttribute>('messages_chain_recipient', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        messages_chain_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'messages_chain',
                key: 'id'
            }
        },
        user_role_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user_role',
                key: 'id'
            }
        },
        is_removed: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        can_answer: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        }
    }, {
        tableName: 'messages_chain_recipient',
        timestamps: false,
        underscored: true
    });
};
