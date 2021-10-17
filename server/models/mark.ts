/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {markInstance, markAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<markInstance, markAttribute>('mark', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        mark_type_id: {
            type: DataTypes.INTEGER(3).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        schedule_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'schedule',
                key: 'id'
            }
        },
        subject_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true,
            references: {
                model: 'subject',
                key: 'id'
            }
        },
        criteria_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'column',
                key: 'id'
            }
        },
        document_id: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        learner_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            }
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
        },
        rating: {
            type: DataTypes.INTEGER(3).UNSIGNED,
            allowNull: true
        },
        max_rating: {
            type: DataTypes.INTEGER(3).UNSIGNED,
            allowNull: true
        },
        stars: {
            type: DataTypes.INTEGER(3).UNSIGNED,
            allowNull: true
        },
        teacher_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_deleted: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'mark',
        timestamps: false,
        underscored: true
    });
};
