/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {message_chain_recipients_infoInstance, message_chain_recipients_infoAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<message_chain_recipients_infoInstance, message_chain_recipients_infoAttribute>('message_chain_recipients_info', {
        id: {
            type: DataTypes.INTEGER(11).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        entity_type: {
            type: DataTypes.ENUM('class','parallel','school','user'),
            allowNull: false,
            defaultValue: 'user'
        },
        entity_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false
        },
        messages_chain_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'messages_chain',
                key: 'id'
            }
        },
        role_code: {
            type: DataTypes.STRING(45),
            allowNull: true
        }
    }, {
        tableName: 'message_chain_recipients_info',
        timestamps: false,
        underscored: true
    });
};
