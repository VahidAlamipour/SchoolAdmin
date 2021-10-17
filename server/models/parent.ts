/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {parentInstance, parentAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<parentInstance, parentAttribute>('parent', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        nationality: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        passport_id: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        phone_number: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        designation: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        company: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        company_address: {
            type: DataTypes.STRING(150),
            allowNull: true
        },
        material_status: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        direct: {
            type: DataTypes.INTEGER(1),
            allowNull: true,
            defaultValue: '0'
        }
    }, {
        tableName: 'parent',
        timestamps: false,
        underscored: true
    });
};
