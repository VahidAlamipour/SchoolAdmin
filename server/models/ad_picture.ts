/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {ad_pictureInstance, ad_pictureAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<ad_pictureInstance, ad_pictureAttribute>('ad_picture', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        ad_settings_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'ad_settings',
                key: 'id'
            }
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        rank: {
            type: DataTypes.INTEGER(3).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        disabled: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'ad_picture',
        timestamps: false,
        underscored: true
    });
};
