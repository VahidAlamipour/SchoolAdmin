/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {curriculum_class_linkInstance, curriculum_class_linkAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<curriculum_class_linkInstance, curriculum_class_linkAttribute>('curriculum_class_link', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        school_curriculum_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'school_curriculum',
                key: 'id'
            }
        },
        class_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'class',
                key: 'id'
            }
        },
        curriculum_level_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        curriculum_subject_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        disabled: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'curriculum_class_link',
        timestamps: false,
        underscored: true
    });
};
