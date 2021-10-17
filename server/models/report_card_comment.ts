/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {report_card_commentInstance, report_card_commentAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<report_card_commentInstance, report_card_commentAttribute>('report_card_comment', {
        report_card_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'report_card',
                key: 'id'
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        position: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        report_year_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'report_year',
                key: 'id'
            }
        },
        report_period_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'report_period',
                key: 'id'
            }
        }
    }, {
        tableName: 'report_card_comment',
        timestamps: false,
        underscored: true
    });
};
