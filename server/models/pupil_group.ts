/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {pupil_groupInstance, pupil_groupAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<pupil_groupInstance, pupil_groupAttribute>('pupil_group', {
        id: {
            type: DataTypes.INTEGER(10),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        pupil_class_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'pupil_class',
                key: 'id'
            }
        },
        group_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'group',
                key: 'id'
            }
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        rank: {
            type: DataTypes.INTEGER(3).UNSIGNED,
            allowNull: true,
            defaultValue: '0'
        }
    }, {
        tableName: 'pupil_group',
        timestamps: false,
        underscored: true
    });
};
