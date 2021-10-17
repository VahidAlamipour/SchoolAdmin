/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {teacherInstance, teacherAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<teacherInstance, teacherAttribute>('teacher', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        education: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        university: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        speciality: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        category: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        graduation_year: {
            type: DataTypes.DATE,
            allowNull: true
        },
        training_year: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'teacher',
        timestamps: false,
        underscored: true
    });
};
