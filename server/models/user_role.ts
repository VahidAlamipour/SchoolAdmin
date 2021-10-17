/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {user_roleInstance, user_roleAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<user_roleInstance, user_roleAttribute>('user_role', {
        id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        role_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'role',
                key: 'id'
            }
        },
        branch_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'branch',
                key: 'id'
            }
        },
        school_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'school',
                key: 'id'
            }
        },
        assignment_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        disabled: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        },
        archived: {
            type: DataTypes.INTEGER(1),
            allowNull: false,
            defaultValue: '0'
        },
        update_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    }, {
        tableName: 'user_role',
        timestamps: false,
        underscored: true
    });
};
