/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {messages_role_chain_typeInstance, messages_role_chain_typeAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<messages_role_chain_typeInstance, messages_role_chain_typeAttribute>('messages_role_chain_type', {
        role_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true
        },
        messages_chain_type_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'messages_chain_type',
                key: 'id'
            }
        }
    }, {
        tableName: 'messages_role_chain_type',
        timestamps: false,
        underscored: true
    });
};
