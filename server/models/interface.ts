/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {interfaceInstance, interfaceAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<interfaceInstance, interfaceAttribute>('interface', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: DataTypes.STRING(45),
            allowNull: false,
            unique: true
        },
        pass_through_auth_url: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        show_on_start: {
            type: DataTypes.TINYINT(1),
            allowNull: false,
        }
    }, {
        tableName: 'interface',
        timestamps: false,
        underscored: true
    });
};
