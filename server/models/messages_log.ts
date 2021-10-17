/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {messages_logInstance, messages_logAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<messages_logInstance, messages_logAttribute>('messages_log', {
        id: {
            type: DataTypes.INTEGER(11).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        text: {
            type: DataTypes.STRING(250),
            allowNull: false
        },
        msisdn: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        target: {
            type: DataTypes.STRING(25),
            allowNull: false
        },
        uuid: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        date_time: {
            type: DataTypes.DATE,
            allowNull: false
        },
        worker: {
            type: DataTypes.ENUM('smslinev2','smsline','plivo'),
            allowNull: false
        },
        check_count: {
            type: DataTypes.INTEGER(4).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'messages_log',
        timestamps: false,
        underscored: true
    });
};
