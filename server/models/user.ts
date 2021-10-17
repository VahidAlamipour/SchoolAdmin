/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {userInstance, userAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<userInstance, userAttribute>('user', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        external_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            unique: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        surname: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        middle_name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        username: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        activated: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        reset_pass: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        two_factor_auth: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        activation_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        creation_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        msisdn: {
            type: DataTypes.STRING(30),
            allowNull: true,
            unique: true
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: '',
            unique: true
        },
        birthday: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        photo: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        gender: {
            type: DataTypes.ENUM('male','female'),
            allowNull: true
        },
        education: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        university: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        speciality: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        category: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        graduation_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        refresher_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        rate_list_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'rate_list',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.ENUM('lms','beed'),
            allowNull: true,
            defaultValue: 'lms'
        }
    }, {
        tableName: 'user',
        timestamps: false,
        underscored: true
    });
};
