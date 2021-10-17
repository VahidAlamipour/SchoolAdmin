/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {push_deviceInstance, push_deviceAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<push_deviceInstance, push_deviceAttribute>('push_device', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        os_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'push_os',
                key: 'id'
            }
        },
        locale: {
            type: DataTypes.ENUM('en','ru','tg'),
            allowNull: false,
            defaultValue: 'en'
        },
        token: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        date_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        tableName: 'push_device',
        timestamps: false,
        underscored: true
    });
};
