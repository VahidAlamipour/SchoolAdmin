/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {ad_target_groupInstance, ad_target_groupAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<ad_target_groupInstance, ad_target_groupAttribute>('ad_target_group', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
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
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'ad_target_group',
        timestamps: false,
        underscored: true
    });
};
