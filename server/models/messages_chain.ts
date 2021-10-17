/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {messages_chainInstance, messages_chainAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<messages_chainInstance, messages_chainAttribute>('messages_chain', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        creator_user_role_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user_role',
                key: 'id'
            }
        },
        messages_chain_type_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'messages_chain_type',
                key: 'id'
            }
        },
        subject: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        can_answer: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        datetime: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        tableName: 'messages_chain',
        timestamps: false,
        underscored: true
    });
};
