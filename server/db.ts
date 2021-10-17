import Sequelize from 'sequelize';
import config from './config';
import { getModels } from './models/db.tables';

export const sequelize = new Sequelize(config.get('db'));
const models = getModels(sequelize);

models.user.hasMany(models.user_role);
models.user.belongsToMany(models.role, { through: models.user_role, foreignKey: 'user_id' });
models.role.belongsToMany(models.user, { through: models.user_role, foreignKey: 'role_id' });
models.user_role.belongsTo(models.role, { foreignKey: 'role_id', targetKey: 'id' });
models.user_role.belongsTo(models.user, { foreignKey: 'user_id', targetKey: 'id' });
models.user_role.belongsTo(models.school, { foreignKey: 'school_id', targetKey: 'id' });
models.user_role.belongsTo(models.branch, { foreignKey: 'branch_id', targetKey: 'id' });

// LEARNER
{
    models.user.hasOne(models.pupil, {foreignKey: 'id'});
    models.pupil.belongsTo(models.user, {foreignKey: 'id'});

    models.user_role.hasMany(models.pupil_class, { foreignKey: 'pupil_id' });
    models.pupil_class.belongsTo(models.user_role, { foreignKey: 'pupil_id' });

    models.user_role.belongsToMany(models.class, { through: models.pupil_class, foreignKey: 'pupil_id', as: 'pupilClasses'});
}

// GROUP
{
    models.class.hasMany(models.bunch);
    models.bunch.belongsTo(models.class);

    models.subject.hasMany(models.bunch, { foreignKey: 'subject_res_id' });
    models.bunch.belongsTo(models.subject, { foreignKey: 'subject_res_id' });

    models.bunch.hasMany(models.group);
    models.group.belongsTo(models.bunch);
    
    models.group.hasMany(models.pupil_group);
    models.pupil_group.belongsTo(models.group);

    models.pupil_class.hasMany(models.pupil_group, { foreignKey: 'group_id' });
    models.pupil_group.belongsTo(models.pupil_class);
}

// SEGMENT-LEVEL-CLASS
{
    models.segment.hasMany(models.segment_level);
    models.level.hasMany(models.segment_level);
    models.segment_level.belongsTo(models.level);
    models.segment_level.belongsTo(models.segment);
    
    models.segment_level.hasMany(models.class, { foreignKey: 'level_id' });
    models.class.belongsTo(models.segment_level, { foreignKey: 'level_id' });

    // models.class.belongsToMany(models.level, { through: models.segment_level, foreignKey: 'level_id'});

    models.class.hasMany(models.pupil_class);
    models.pupil_class.belongsTo(models.class);
    models.class.belongsTo(models.report_year, {foreignKey: 'year_id'});
}

// COUNTRY-CITY
{
    models.country.hasMany(models.city);
    models.city.belongsTo(models.country);

    models.city.hasMany(models.school);
    models.school.belongsTo(models.city);
}

// PARENT
{
    models.user.hasOne(models.parent, {foreignKey: 'id'});
    models.parent.belongsTo(models.user, { foreignKey: 'id' });

    models.user_role.belongsToMany(models.user_role, { through: models.parent_pupil, foreignKey: 'parent_id', otherKey: 'pupil_id', as: 'pupils' });
    models.user_role.belongsToMany(models.user_role, { through: models.parent_pupil, foreignKey: 'pupil_id', otherKey: 'parent_id', as: 'parents' });
}

// VENUE
{
    models.venue.hasMany(models.venue_subject);
    models.venue_subject.belongsTo(models.venue);

    models.venue.hasMany(models.venue_subject);
    models.venue_subject.belongsTo(models.venue);
    
    models.venue.hasMany(models.user, { foreignKey: 'id', sourceKey: 'teacher_id' });
    models.user.belongsTo(models.venue, { foreignKey: 'id' }); 

    models.school.hasMany(models.venue);
    models.venue.belongsTo(models.school);

    models.venue.belongsToMany(models.subject, { through: models.venue_subject });
    models.subject.belongsToMany(models.venue, { through: models.venue_subject });
}

// ACADEMIC YEAR
{
    [models.branch, models.school, models.academic_year].forEach(model => {
        model.hasMany(models.report_year);
        models.report_year.belongsTo(model);
    });

    [models.report_period, models.time_set, models.study_days].forEach(model => {
        models.report_year.hasMany(model, { foreignKey: 'year_id' });
        model.belongsTo(models.report_year, { foreignKey: 'year_id' });
    })

    models.days.hasMany(models.study_days);
    models.study_days.belongsTo(models.days);

    models.time_set.hasMany(models.study_time);
    models.study_time.belongsTo(models.time_set);
    models.study_time.hasMany(models.schedule);
}

// SUBJECT
{
    models.school.belongsToMany(models.subject, { through: models.school_subject });
    models.subject.belongsToMany(models.school, { through: models.school_subject });   
    models.subject.hasMany(models.school_subject);   
    models.school_subject.belongsTo(models.subject);   
}

// SCHOOL-BRANCH/ACCOUNT
{
    models.school.hasMany(models.class);
    models.class.belongsTo(models.school);
    
    models.branch.hasMany(models.school);
    models.school.belongsTo(models.branch);

    models.city.hasMany(models.branch);
    models.branch.belongsTo(models.city);
}

// EDUCATOR
{
    models.user.hasOne(models.teacher, { foreignKey: 'id' });
    models.teacher.belongsTo(models.user, { foreignKey: 'id', targetKey: 'id' });
    
    models.user_role.belongsToMany(models.class, { through: models.teacher_head_class, foreignKey: 'teacher_id' });
    models.class.belongsToMany(models.user_role, { through: models.teacher_head_class, as: 'teachers' });

    models.user_role.hasMany(models.teacher_subject, { foreignKey: 'teacher_id' });
    models.teacher_subject.belongsTo(models.user_role, { foreignKey: 'teacher_id' });

    models.user_role.hasMany(models.teacher_head_class, { foreignKey: 'teacher_id' });
    models.teacher_head_class.belongsTo(models.user_role, { foreignKey: 'teacher_id' });

    models.class.hasMany(models.teacher_head_class);
    models.teacher_head_class.belongsTo(models.class);
}

// TIMETABLE
{
    [models.class, models.study_time, models.subject, models.venue, models.group].forEach(model => {
        model.hasMany(models.schedule);
        models.schedule.belongsTo(model);
    });

    models.user.hasMany(models.schedule, { foreignKey: 'teacher_id' });
    models.schedule.belongsTo(models.user, { foreignKey: 'teacher_id' });
}

// INTERFACES
{
    models.interface.hasMany(models.interface_role);
    models.interface_role.belongsTo(models.interface);
}

export default models;
