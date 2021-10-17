/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {academic_yearInstance, academic_yearAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<academic_yearInstance, academic_yearAttribute>('academic_year', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        start: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false
        },
        end: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false
        }
    }, {
        tableName: 'academic_year',
        timestamps: false,
        underscored: true
    });
};
