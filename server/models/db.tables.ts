// tslint:disable
import * as path from 'path';
import * as sequelize from 'sequelize';
import * as def from './db';

export interface ITables {
    academic_year: def.academic_yearModel;
    access: def.accessModel;
    access_entity: def.access_entityModel;
    ad_campaign: def.ad_campaignModel;
    access_entity_role: def.access_entity_roleModel;
    ad: def.adModel;
    ad_disable_history: def.ad_disable_historyModel;
    ad_picture: def.ad_pictureModel;
    ad_settings: def.ad_settingsModel;
    ad_target_device: def.ad_target_deviceModel;
    ad_target_grade: def.ad_target_gradeModel;
    ad_target_group: def.ad_target_groupModel;
    ad_target_package: def.ad_target_packageModel;
    ad_type: def.ad_typeModel;
    ad_type_method: def.ad_type_methodModel;
    bunch: def.bunchModel;
    admin_role_access: def.admin_role_accessModel;
    branch: def.branchModel;
    admin_module: def.admin_moduleModel;
    change_status_access: def.change_status_accessModel;
    city: def.cityModel;
    country: def.countryModel;
    class: def.classModel;
    days: def.daysModel;
    group: def.groupModel;
    curriculum_class_link: def.curriculum_class_linkModel;
    interface: def.interfaceModel;
    interface_role: def.interface_roleModel;
    level: def.levelModel;
    mark: def.markModel;
    mark_type: def.mark_typeModel;
    message_action: def.message_actionModel;
    message: def.messageModel;
    message_attachment: def.message_attachmentModel;
    message_chain_recipients_info: def.message_chain_recipients_infoModel;
    message_recipient_action: def.message_recipient_actionModel;
    message_recipient_ref: def.message_recipient_refModel;
    message_role_action: def.message_role_actionModel;
    messages_chain: def.messages_chainModel;
    message_type: def.message_typeModel;
    messages_chain_type: def.messages_chain_typeModel;
    messages_log: def.messages_logModel;
    messages_chain_recipient: def.messages_chain_recipientModel;
    messages_role_chain_type: def.messages_role_chain_typeModel;
    notification: def.notificationModel;
    miss: def.missModel;
    pupil: def.pupilModel;
    parent: def.parentModel;
    pupil_class: def.pupil_classModel;
    parent_pupil: def.parent_pupilModel;
    push_os: def.push_osModel;
    pupil_group: def.pupil_groupModel;
    push_device: def.push_deviceModel;
    rate_list: def.rate_listModel;
    report_card_settings: def.report_card_settingsModel;
    report_card_status: def.report_card_statusModel;
    report_card_comment: def.report_card_commentModel;
    report_year: def.report_yearModel;
    report_period: def.report_periodModel;
    schedule: def.scheduleModel;
    role: def.roleModel;
    referral: def.referralModel;
    report_card: def.report_cardModel;
    schedule_series: def.schedule_seriesModel;
    school: def.schoolModel;
    school_curriculum: def.school_curriculumModel;
    segment: def.segmentModel;
    school_subject: def.school_subjectModel;
    segment_name: def.segment_nameModel;
    segment_level: def.segment_levelModel;
    shift: def.shiftModel;
    shift_interval: def.shift_intervalModel;
    study_days: def.study_daysModel;
    study_time: def.study_timeModel;
    subject: def.subjectModel;
    subscription_feature_tariff: def.subscription_feature_tariffModel;
    subscription_school_tariff: def.subscription_school_tariffModel;
    subscription_feature: def.subscription_featureModel;
    subscription_tariff: def.subscription_tariffModel;
    subscription_postponed: def.subscription_postponedModel;
    subscription_transaction: def.subscription_transactionModel;
    subscription_transaction_type: def.subscription_transaction_typeModel;
    teacher: def.teacherModel;
    subscription_transaction_agent: def.subscription_transaction_agentModel;
    teacher_head_class: def.teacher_head_classModel;
    teacher_subject: def.teacher_subjectModel;
    time_set: def.time_setModel;
    user_role: def.user_roleModel;
    user: def.userModel;
    venue: def.venueModel;
    venue_subject: def.venue_subjectModel;
    version: def.versionModel;
}

export const getModels = function(seq: sequelize.Sequelize): ITables {
    const tables: ITables = {
        academic_year: seq.import(path.join(__dirname, './academic_year')),
        access: seq.import(path.join(__dirname, './access')),
        access_entity: seq.import(path.join(__dirname, './access_entity')),
        ad_campaign: seq.import(path.join(__dirname, './ad_campaign')),
        access_entity_role: seq.import(path.join(__dirname, './access_entity_role')),
        ad: seq.import(path.join(__dirname, './ad')),
        ad_disable_history: seq.import(path.join(__dirname, './ad_disable_history')),
        ad_picture: seq.import(path.join(__dirname, './ad_picture')),
        ad_settings: seq.import(path.join(__dirname, './ad_settings')),
        ad_target_device: seq.import(path.join(__dirname, './ad_target_device')),
        ad_target_grade: seq.import(path.join(__dirname, './ad_target_grade')),
        ad_target_group: seq.import(path.join(__dirname, './ad_target_group')),
        ad_target_package: seq.import(path.join(__dirname, './ad_target_package')),
        ad_type: seq.import(path.join(__dirname, './ad_type')),
        ad_type_method: seq.import(path.join(__dirname, './ad_type_method')),
        bunch: seq.import(path.join(__dirname, './bunch')),
        admin_role_access: seq.import(path.join(__dirname, './admin_role_access')),
        branch: seq.import(path.join(__dirname, './branch')),
        admin_module: seq.import(path.join(__dirname, './admin_module')),
        change_status_access: seq.import(path.join(__dirname, './change_status_access')),
        city: seq.import(path.join(__dirname, './city')),
        country: seq.import(path.join(__dirname, './country')),
        class: seq.import(path.join(__dirname, './class')),
        days: seq.import(path.join(__dirname, './days')),
        group: seq.import(path.join(__dirname, './group')),
        curriculum_class_link: seq.import(path.join(__dirname, './curriculum_class_link')),
        interface: seq.import(path.join(__dirname, './interface')),
        interface_role: seq.import(path.join(__dirname, './interface_role')),
        level: seq.import(path.join(__dirname, './level')),
        mark: seq.import(path.join(__dirname, './mark')),
        mark_type: seq.import(path.join(__dirname, './mark_type')),
        message_action: seq.import(path.join(__dirname, './message_action')),
        message: seq.import(path.join(__dirname, './message')),
        message_attachment: seq.import(path.join(__dirname, './message_attachment')),
        message_chain_recipients_info: seq.import(path.join(__dirname, './message_chain_recipients_info')),
        message_recipient_action: seq.import(path.join(__dirname, './message_recipient_action')),
        message_recipient_ref: seq.import(path.join(__dirname, './message_recipient_ref')),
        message_role_action: seq.import(path.join(__dirname, './message_role_action')),
        messages_chain: seq.import(path.join(__dirname, './messages_chain')),
        message_type: seq.import(path.join(__dirname, './message_type')),
        messages_chain_type: seq.import(path.join(__dirname, './messages_chain_type')),
        messages_log: seq.import(path.join(__dirname, './messages_log')),
        messages_chain_recipient: seq.import(path.join(__dirname, './messages_chain_recipient')),
        messages_role_chain_type: seq.import(path.join(__dirname, './messages_role_chain_type')),
        notification: seq.import(path.join(__dirname, './notification')),
        miss: seq.import(path.join(__dirname, './miss')),
        pupil: seq.import(path.join(__dirname, './pupil')),
        parent: seq.import(path.join(__dirname, './parent')),
        pupil_class: seq.import(path.join(__dirname, './pupil_class')),
        parent_pupil: seq.import(path.join(__dirname, './parent_pupil')),
        push_os: seq.import(path.join(__dirname, './push_os')),
        pupil_group: seq.import(path.join(__dirname, './pupil_group')),
        push_device: seq.import(path.join(__dirname, './push_device')),
        rate_list: seq.import(path.join(__dirname, './rate_list')),
        report_card_settings: seq.import(path.join(__dirname, './report_card_settings')),
        report_card_status: seq.import(path.join(__dirname, './report_card_status')),
        report_card_comment: seq.import(path.join(__dirname, './report_card_comment')),
        report_year: seq.import(path.join(__dirname, './report_year')),
        report_period: seq.import(path.join(__dirname, './report_period')),
        schedule: seq.import(path.join(__dirname, './schedule')),
        role: seq.import(path.join(__dirname, './role')),
        referral: seq.import(path.join(__dirname, './referral')),
        report_card: seq.import(path.join(__dirname, './report_card')),
        schedule_series: seq.import(path.join(__dirname, './schedule_series')),
        school: seq.import(path.join(__dirname, './school')),
        school_curriculum: seq.import(path.join(__dirname, './school_curriculum')),
        segment: seq.import(path.join(__dirname, './segment')),
        school_subject: seq.import(path.join(__dirname, './school_subject')),
        segment_name: seq.import(path.join(__dirname, './segment_name')),
        segment_level: seq.import(path.join(__dirname, './segment_level')),
        shift: seq.import(path.join(__dirname, './shift')),
        shift_interval: seq.import(path.join(__dirname, './shift_interval')),
        study_days: seq.import(path.join(__dirname, './study_days')),
        study_time: seq.import(path.join(__dirname, './study_time')),
        subject: seq.import(path.join(__dirname, './subject')),
        subscription_feature_tariff: seq.import(path.join(__dirname, './subscription_feature_tariff')),
        subscription_school_tariff: seq.import(path.join(__dirname, './subscription_school_tariff')),
        subscription_feature: seq.import(path.join(__dirname, './subscription_feature')),
        subscription_tariff: seq.import(path.join(__dirname, './subscription_tariff')),
        subscription_postponed: seq.import(path.join(__dirname, './subscription_postponed')),
        subscription_transaction: seq.import(path.join(__dirname, './subscription_transaction')),
        subscription_transaction_type: seq.import(path.join(__dirname, './subscription_transaction_type')),
        teacher: seq.import(path.join(__dirname, './teacher')),
        subscription_transaction_agent: seq.import(path.join(__dirname, './subscription_transaction_agent')),
        teacher_head_class: seq.import(path.join(__dirname, './teacher_head_class')),
        teacher_subject: seq.import(path.join(__dirname, './teacher_subject')),
        time_set: seq.import(path.join(__dirname, './time_set')),
        user_role: seq.import(path.join(__dirname, './user_role')),
        user: seq.import(path.join(__dirname, './user')),
        venue: seq.import(path.join(__dirname, './venue')),
        venue_subject: seq.import(path.join(__dirname, './venue_subject')),
        version: seq.import(path.join(__dirname, './version')),
    };
    return tables;
};
