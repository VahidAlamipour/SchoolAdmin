/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {roleInstance, roleAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<roleInstance, roleAttribute>('role', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING(45),
            allowNull: false
        },
        sub_code: {
            type: DataTypes.STRING(45),
            allowNull: false
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        curriculum_builder_rank: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'role',
        timestamps: false,
        underscored: true
    });
};
