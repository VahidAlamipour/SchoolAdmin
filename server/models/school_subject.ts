/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {school_subjectInstance, school_subjectAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<school_subjectInstance, school_subjectAttribute>('school_subject', {
        id: {
            type: DataTypes.INTEGER(10),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        school_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'school',
                key: 'id'
            }
        },
        branch_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'branch',
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
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: true,
            defaultValue: '0'
        },name:{
            type: DataTypes.STRING(255),
            allowNull:true,
        }
    }, {
        tableName: 'school_subject',
        timestamps: false,
        underscored: true
    });
};
