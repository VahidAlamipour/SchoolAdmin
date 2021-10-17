/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {ad_type_methodInstance, ad_type_methodAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<ad_type_methodInstance, ad_type_methodAttribute>('ad_type_method', {
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
        }
    }, {
        tableName: 'ad_type_method',
        timestamps: false,
        underscored: true
    });
};
