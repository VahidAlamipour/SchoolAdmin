/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {ad_target_gradeInstance, ad_target_gradeAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<ad_target_gradeInstance, ad_target_gradeAttribute>('ad_target_grade', {
        id: {
            type: DataTypes.INTEGER(11).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        disabled: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'ad_target_grade',
        timestamps: false,
        underscored: true
    });
};
