/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {teacher_head_classInstance, teacher_head_classAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<teacher_head_classInstance, teacher_head_classAttribute>('teacher_head_class', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        teacher_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user_role',
                key: 'id'
            },
            unique: true
        },
        class_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'class',
                key: 'id'
            }
        },
        disabled: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        is_assigned: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'teacher_head_class',
        timestamps: false,
        underscored: true
    });
};
