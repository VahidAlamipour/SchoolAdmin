/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {message_attachmentInstance, message_attachmentAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<message_attachmentInstance, message_attachmentAttribute>('message_attachment', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        message_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'message',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        store: {
            type: DataTypes.ENUM('local','aws'),
            allowNull: false,
            defaultValue: 'local'
        },
        hash: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        type: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        size: {
            type: DataTypes.INTEGER(7),
            allowNull: false
        },
        path: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'message_attachment',
        timestamps: false,
        underscored: true
    });
};
