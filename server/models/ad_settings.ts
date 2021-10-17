/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {ad_settingsInstance, ad_settingsAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<ad_settingsInstance, ad_settingsAttribute>('ad_settings', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        ad_campaign_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'ad_campaign',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        header: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        button: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rotation: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            defaultValue: '0'
        },
        picture_rotation: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            defaultValue: '0'
        }
    }, {
        tableName: 'ad_settings',
        timestamps: false,
        underscored: true
    });
};
