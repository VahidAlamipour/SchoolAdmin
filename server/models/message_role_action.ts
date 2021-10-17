/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {message_role_actionInstance, message_role_actionAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<message_role_actionInstance, message_role_actionAttribute>('message_role_action', {
        initiator_role_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true
        },
        recipient_role_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true
        },
        message_action_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'message_action',
                key: 'id'
            }
        }
    }, {
        tableName: 'message_role_action',
        timestamps: false,
        underscored: true
    });
};
