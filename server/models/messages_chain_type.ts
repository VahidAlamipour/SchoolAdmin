/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {messages_chain_typeInstance, messages_chain_typeAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<messages_chain_typeInstance, messages_chain_typeAttribute>('messages_chain_type', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(45),
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(45),
            allowNull: false
        },
        can_answer: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        is_visible: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'messages_chain_type',
        timestamps: false,
        underscored: true
    });
};
