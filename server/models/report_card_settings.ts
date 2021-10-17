/* jshint indent: 1 */
// tslint:disable
import * as sequelize from 'sequelize';
import {DataTypes} from 'sequelize';
import {report_card_settingsInstance, report_card_settingsAttribute} from './db';

module.exports = function(sequelize: sequelize.Sequelize, DataTypes: DataTypes) {
    return sequelize.define<report_card_settingsInstance, report_card_settingsAttribute>('report_card_settings', {
        id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        school_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: false,
            references: {
                model: 'school',
                key: 'id'
            }
        },
        report_period_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true
        },
        report_year_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            allowNull: true
        },
        comments_overall: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        comments_segment_aggregator: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        comments_segment_learner_skills: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        comments_segment_learner_traits: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        comments_course_rubric: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        comments_course_learner_skills: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        comments_course_learner_traits: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        grades_segment_aggregator: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        grades_segment_learner_skills: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        grades_segment_learner_traits: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        grades_course_aggregator: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        grades_course_learner_skills: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        grades_course_learner_traits: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            defaultValue: '1'
        },
        signatures_count: {
            type: DataTypes.INTEGER(4).UNSIGNED,
            allowNull: false,
            defaultValue: '0'
        }
    }, {
        tableName: 'report_card_settings',
        timestamps: false,
        underscored: true
    });
};
