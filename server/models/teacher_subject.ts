/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {teacher_subjectInstance, teacher_subjectAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<teacher_subjectInstance, teacher_subjectAttribute>('teacher_subject', {
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
            }
        },
        subject_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'subject',
                key: 'id'
            }
        },
        level_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'segment_level',
                key: 'id'
            }
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false
        }
    }, {
        tableName: 'teacher_subject',
        timestamps: false,
        underscored: true
    });
};
