// tslint:disable
import * as Sequelize from 'sequelize';


// table: academic_year
export interface academic_yearAttribute {
    id: number;
    start: number;
    end: number;
}
export interface academic_yearInstance extends Sequelize.Instance<academic_yearAttribute>, academic_yearAttribute { }
export interface academic_yearModel extends Sequelize.Model<academic_yearInstance, academic_yearAttribute> { }

// table: access
export interface accessAttribute {
    id: number;
    code: string;
}
export interface accessInstance extends Sequelize.Instance<accessAttribute>, accessAttribute { }
export interface accessModel extends Sequelize.Model<accessInstance, accessAttribute> { }

// table: access_entity
export interface access_entityAttribute {
    id: number;
    code: string;
}
export interface access_entityInstance extends Sequelize.Instance<access_entityAttribute>, access_entityAttribute { }
export interface access_entityModel extends Sequelize.Model<access_entityInstance, access_entityAttribute> { }

// table: ad_campaign
export interface ad_campaignAttribute {
    id: number;
    ad_id: number;
    ad_type_id: number;
    ad_target_group_id?: number;
    ad_target_device_id?: number;
    ad_target_grade_id?: number;
    ad_target_package_id?: number;
    start_date?: Date;
    end_date?: Date;
    created: Date;
    disabled: number;
}
export interface ad_campaignInstance extends Sequelize.Instance<ad_campaignAttribute>, ad_campaignAttribute { }
export interface ad_campaignModel extends Sequelize.Model<ad_campaignInstance, ad_campaignAttribute> { }

// table: access_entity_role
export interface access_entity_roleAttribute {
    role_id: number;
    access_entity_id: number;
    access_id: number;
    degree_of_restrict?: number;
}
export interface access_entity_roleInstance extends Sequelize.Instance<access_entity_roleAttribute>, access_entity_roleAttribute { }
export interface access_entity_roleModel extends Sequelize.Model<access_entity_roleInstance, access_entity_roleAttribute> { }

// table: ad
export interface adAttribute {
    id: number;
    name?: string;
    created: Date;
    disabled: number;
}
export interface adInstance extends Sequelize.Instance<adAttribute>, adAttribute { }
export interface adModel extends Sequelize.Model<adInstance, adAttribute> { }

// table: ad_disable_history
export interface ad_disable_historyAttribute {
    id: number;
    ad_campaign_id: number;
    user_id: number;
    created: Date;
}
export interface ad_disable_historyInstance extends Sequelize.Instance<ad_disable_historyAttribute>, ad_disable_historyAttribute { }
export interface ad_disable_historyModel extends Sequelize.Model<ad_disable_historyInstance, ad_disable_historyAttribute> { }

// table: ad_picture
export interface ad_pictureAttribute {
    id: number;
    ad_settings_id: number;
    url: string;
    rank: number;
    disabled: number;
}
export interface ad_pictureInstance extends Sequelize.Instance<ad_pictureAttribute>, ad_pictureAttribute { }
export interface ad_pictureModel extends Sequelize.Model<ad_pictureInstance, ad_pictureAttribute> { }

// table: ad_settings
export interface ad_settingsAttribute {
    id: number;
    ad_campaign_id: number;
    name?: string;
    header?: string;
    button?: string;
    text?: string;
    url?: string;
    rotation?: number;
    picture_rotation?: number;
}
export interface ad_settingsInstance extends Sequelize.Instance<ad_settingsAttribute>, ad_settingsAttribute { }
export interface ad_settingsModel extends Sequelize.Model<ad_settingsInstance, ad_settingsAttribute> { }

// table: ad_target_device
export interface ad_target_deviceAttribute {
    id: number;
    name: string;
    code: string;
    disabled: number;
}
export interface ad_target_deviceInstance extends Sequelize.Instance<ad_target_deviceAttribute>, ad_target_deviceAttribute { }
export interface ad_target_deviceModel extends Sequelize.Model<ad_target_deviceInstance, ad_target_deviceAttribute> { }

// table: ad_target_grade
export interface ad_target_gradeAttribute {
    id: number;
    name: string;
    code: string;
    disabled: number;
}
export interface ad_target_gradeInstance extends Sequelize.Instance<ad_target_gradeAttribute>, ad_target_gradeAttribute { }
export interface ad_target_gradeModel extends Sequelize.Model<ad_target_gradeInstance, ad_target_gradeAttribute> { }

// table: ad_target_group
export interface ad_target_groupAttribute {
    id: number;
    name: string;
    code: string;
    disabled: number;
}
export interface ad_target_groupInstance extends Sequelize.Instance<ad_target_groupAttribute>, ad_target_groupAttribute { }
export interface ad_target_groupModel extends Sequelize.Model<ad_target_groupInstance, ad_target_groupAttribute> { }

// table: ad_target_package
export interface ad_target_packageAttribute {
    id: number;
    name: string;
    code: string;
    disabled: number;
}
export interface ad_target_packageInstance extends Sequelize.Instance<ad_target_packageAttribute>, ad_target_packageAttribute { }
export interface ad_target_packageModel extends Sequelize.Model<ad_target_packageInstance, ad_target_packageAttribute> { }

// table: ad_type
export interface ad_typeAttribute {
    id: number;
    name: string;
    code: string;
    method_id: number;
    disabled: number;
}
export interface ad_typeInstance extends Sequelize.Instance<ad_typeAttribute>, ad_typeAttribute { }
export interface ad_typeModel extends Sequelize.Model<ad_typeInstance, ad_typeAttribute> { }

// table: ad_type_method
export interface ad_type_methodAttribute {
    id: number;
    name: string;
    code: string;
}
export interface ad_type_methodInstance extends Sequelize.Instance<ad_type_methodAttribute>, ad_type_methodAttribute { }
export interface ad_type_methodModel extends Sequelize.Model<ad_type_methodInstance, ad_type_methodAttribute> { }

// table: bunch
export interface bunchAttribute {
    id: number;
    subject_res_id: number;
    class_id: number;
    disabled?: number;
}
export interface bunchInstance extends Sequelize.Instance<bunchAttribute>, bunchAttribute { }
export interface bunchModel extends Sequelize.Model<bunchInstance, bunchAttribute> { }

// table: admin_role_access
export interface admin_role_accessAttribute {
    id: number;
    module_id: number;
    role_id: number;
}
export interface admin_role_accessInstance extends Sequelize.Instance<admin_role_accessAttribute>, admin_role_accessAttribute { }
export interface admin_role_accessModel extends Sequelize.Model<admin_role_accessInstance, admin_role_accessAttribute> { }

// table: branch
export interface branchAttribute {
    id: number;
    name: string;
    full_name: string;
    city_id: number;
    update_date: Date;
    create_date: Date;
    disabled: number;
    domain: string;
}
export interface branchInstance extends Sequelize.Instance<branchAttribute>, branchAttribute { }
export interface branchModel extends Sequelize.Model<branchInstance, branchAttribute> { }

// table: admin_module
export interface admin_moduleAttribute {
    id: number;
    code: string;
    name: string;
}
export interface admin_moduleInstance extends Sequelize.Instance<admin_moduleAttribute>, admin_moduleAttribute { }
export interface admin_moduleModel extends Sequelize.Model<admin_moduleInstance, admin_moduleAttribute> { }

// table: change_status_access
export interface change_status_accessAttribute {
    role_id: number;
    status_id: number;
    destination_status_id: number;
}
export interface change_status_accessInstance extends Sequelize.Instance<change_status_accessAttribute>, change_status_accessAttribute { }
export interface change_status_accessModel extends Sequelize.Model<change_status_accessInstance, change_status_accessAttribute> { }

// table: city
export interface cityAttribute {
    id: number;
    name: string;
    country_id: number;
}
export interface cityInstance extends Sequelize.Instance<cityAttribute>, cityAttribute { }
export interface cityModel extends Sequelize.Model<cityInstance, cityAttribute> { }

// table: country
export interface countryAttribute {
    id: number;
    name: string;
    first_day_id: number;
}
export interface countryInstance extends Sequelize.Instance<countryAttribute>, countryAttribute { }
export interface countryModel extends Sequelize.Model<countryInstance, countryAttribute> { }

// table: class
export interface classAttribute {
    id: number;
    name: string;
    level_id: number;
    grade_name?: string;
    shift_id: number;
    year_id: number;
    school_id: number;
    transmitted: number;
    graduated: number;
    disabled?: number;
    show_name: number;
}
export interface classInstance extends Sequelize.Instance<classAttribute>, classAttribute { }
export interface classModel extends Sequelize.Model<classInstance, classAttribute> { }

// table: days
export interface daysAttribute {
    id: number;
    code: string;
}
export interface daysInstance extends Sequelize.Instance<daysAttribute>, daysAttribute { }
export interface daysModel extends Sequelize.Model<daysInstance, daysAttribute> { }

// table: group
export interface groupAttribute {
    id: number;
    name: string;
    bunch_id: number;
    disabled: number;
    rank?: number;
}
export interface groupInstance extends Sequelize.Instance<groupAttribute>, groupAttribute { }
export interface groupModel extends Sequelize.Model<groupInstance, groupAttribute> { }

// table: curriculum_class_link
export interface curriculum_class_linkAttribute {
    id: number;
    school_curriculum_id: number;
    class_id: number;
    curriculum_level_id: number;
    curriculum_subject_id: number;
    disabled: number;
}
export interface curriculum_class_linkInstance extends Sequelize.Instance<curriculum_class_linkAttribute>, curriculum_class_linkAttribute { }
export interface curriculum_class_linkModel extends Sequelize.Model<curriculum_class_linkInstance, curriculum_class_linkAttribute> { }

// table: interface
export interface interfaceAttribute {
    id: number;
    code: string;
    pass_through_auth_url: string;
    show_on_start: number;
}
export interface interfaceInstance extends Sequelize.Instance<interfaceAttribute>, interfaceAttribute { }
export interface interfaceModel extends Sequelize.Model<interfaceInstance, interfaceAttribute> { }

// table: interface_role
export interface interface_roleAttribute {
    interface_id: number;
    role_id: number;
}
export interface interface_roleInstance extends Sequelize.Instance<interface_roleAttribute>, interface_roleAttribute { }
export interface interface_roleModel extends Sequelize.Model<interface_roleInstance, interface_roleAttribute> { }

// table: level
export interface levelAttribute {
    id: number;
    name: string;
    code: number;
    disabled: number;
}
export interface levelInstance extends Sequelize.Instance<levelAttribute>, levelAttribute { }
export interface levelModel extends Sequelize.Model<levelInstance, levelAttribute> { }

// table: mark
export interface markAttribute {
    id: number;
    mark_type_id: number;
    schedule_id?: number;
    subject_id?: number;
    criteria_id?: number;
    document_id?: number;
    learner_id: number;
    report_year_id?: number;
    report_period_id?: number;
    rating?: number;
    max_rating?: number;
    stars?: number;
    teacher_id: number;
    comment?: string;
    created: Date;
    updated?: Date;
    is_deleted: number;
}
export interface markInstance extends Sequelize.Instance<markAttribute>, markAttribute { }
export interface markModel extends Sequelize.Model<markInstance, markAttribute> { }

// table: mark_type
export interface mark_typeAttribute {
    id: number;
    code: string;
}
export interface mark_typeInstance extends Sequelize.Instance<mark_typeAttribute>, mark_typeAttribute { }
export interface mark_typeModel extends Sequelize.Model<mark_typeInstance, mark_typeAttribute> { }

// table: message_action
export interface message_actionAttribute {
    id: number;
    name: string;
    code: string;
}
export interface message_actionInstance extends Sequelize.Instance<message_actionAttribute>, message_actionAttribute { }
export interface message_actionModel extends Sequelize.Model<message_actionInstance, message_actionAttribute> { }

// table: message
export interface messageAttribute {
    id: number;
    message_type_id: number;
    from_user_role_id: number;
    text: string;
    datetime: Date;
}
export interface messageInstance extends Sequelize.Instance<messageAttribute>, messageAttribute { }
export interface messageModel extends Sequelize.Model<messageInstance, messageAttribute> { }

// table: message_attachment
export interface message_attachmentAttribute {
    id: number;
    message_id: number;
    name: string;
    url: string;
    store: any;
    hash: string;
    type: string;
    size: number;
    path?: string;
}
export interface message_attachmentInstance extends Sequelize.Instance<message_attachmentAttribute>, message_attachmentAttribute { }
export interface message_attachmentModel extends Sequelize.Model<message_attachmentInstance, message_attachmentAttribute> { }

// table: message_chain_recipients_info
export interface message_chain_recipients_infoAttribute {
    id: number;
    entity_type: any;
    entity_id: number;
    messages_chain_id: number;
    role_code?: string;
}
export interface message_chain_recipients_infoInstance extends Sequelize.Instance<message_chain_recipients_infoAttribute>, message_chain_recipients_infoAttribute { }
export interface message_chain_recipients_infoModel extends Sequelize.Model<message_chain_recipients_infoInstance, message_chain_recipients_infoAttribute> { }

// table: message_recipient_action
export interface message_recipient_actionAttribute {
    id: number;
    messages_chain_recipient_id: number;
    message_id: number;
    is_deleted: number;
    is_read: number;
    is_archived: number;
    last_update: Date;
}
export interface message_recipient_actionInstance extends Sequelize.Instance<message_recipient_actionAttribute>, message_recipient_actionAttribute { }
export interface message_recipient_actionModel extends Sequelize.Model<message_recipient_actionInstance, message_recipient_actionAttribute> { }

// table: message_recipient_ref
export interface message_recipient_refAttribute {
    messages_chain_recipient_id: number;
    user_role_id: number;
}
export interface message_recipient_refInstance extends Sequelize.Instance<message_recipient_refAttribute>, message_recipient_refAttribute { }
export interface message_recipient_refModel extends Sequelize.Model<message_recipient_refInstance, message_recipient_refAttribute> { }

// table: message_role_action
export interface message_role_actionAttribute {
    initiator_role_id: number;
    recipient_role_id: number;
    message_action_id: number;
}
export interface message_role_actionInstance extends Sequelize.Instance<message_role_actionAttribute>, message_role_actionAttribute { }
export interface message_role_actionModel extends Sequelize.Model<message_role_actionInstance, message_role_actionAttribute> { }

// table: messages_chain
export interface messages_chainAttribute {
    id: number;
    creator_user_role_id: number;
    messages_chain_type_id: number;
    subject: string;
    can_answer: number;
    datetime: Date;
}
export interface messages_chainInstance extends Sequelize.Instance<messages_chainAttribute>, messages_chainAttribute { }
export interface messages_chainModel extends Sequelize.Model<messages_chainInstance, messages_chainAttribute> { }

// table: message_type
export interface message_typeAttribute {
    id: number;
    code: string;
    name: string;
}
export interface message_typeInstance extends Sequelize.Instance<message_typeAttribute>, message_typeAttribute { }
export interface message_typeModel extends Sequelize.Model<message_typeInstance, message_typeAttribute> { }

// table: messages_chain_type
export interface messages_chain_typeAttribute {
    id: number;
    name: string;
    code: string;
    can_answer: number;
    is_visible: number;
}
export interface messages_chain_typeInstance extends Sequelize.Instance<messages_chain_typeAttribute>, messages_chain_typeAttribute { }
export interface messages_chain_typeModel extends Sequelize.Model<messages_chain_typeInstance, messages_chain_typeAttribute> { }

// table: messages_log
export interface messages_logAttribute {
    id: number;
    text: string;
    msisdn?: string;
    status: string;
    target: string;
    uuid?: string;
    date_time: Date;
    worker: any;
    check_count: number;
}
export interface messages_logInstance extends Sequelize.Instance<messages_logAttribute>, messages_logAttribute { }
export interface messages_logModel extends Sequelize.Model<messages_logInstance, messages_logAttribute> { }

// table: messages_chain_recipient
export interface messages_chain_recipientAttribute {
    id: number;
    messages_chain_id: number;
    user_role_id: number;
    is_removed: number;
    can_answer: number;
}
export interface messages_chain_recipientInstance extends Sequelize.Instance<messages_chain_recipientAttribute>, messages_chain_recipientAttribute { }
export interface messages_chain_recipientModel extends Sequelize.Model<messages_chain_recipientInstance, messages_chain_recipientAttribute> { }

// table: messages_role_chain_type
export interface messages_role_chain_typeAttribute {
    role_id: number;
    messages_chain_type_id: number;
}
export interface messages_role_chain_typeInstance extends Sequelize.Instance<messages_role_chain_typeAttribute>, messages_role_chain_typeAttribute { }
export interface messages_role_chain_typeModel extends Sequelize.Model<messages_role_chain_typeInstance, messages_role_chain_typeAttribute> { }

// table: notification
export interface notificationAttribute {
    id: number;
    user_id: number;
    from_user_id: number;
    header: string;
    text: string;
    url?: string;
    is_read: number;
    datetime: Date;
    type?: any;
    is_deleted: number;
}
export interface notificationInstance extends Sequelize.Instance<notificationAttribute>, notificationAttribute { }
export interface notificationModel extends Sequelize.Model<notificationInstance, notificationAttribute> { }

// table: miss
export interface missAttribute {
    id: number;
    pupil_id: number;
    schedule_id: number;
    note?: string;
    created: Date;
}
export interface missInstance extends Sequelize.Instance<missAttribute>, missAttribute { }
export interface missModel extends Sequelize.Model<missInstance, missAttribute> { }

// table: pupil
export interface pupilAttribute {
    id: number;
    local_address?: string;
    local_msisdn?: string;
    nationality?: string;
    religion?: string;
    race?: string;
    other?: string;
    passport_id?: string;
}
export interface pupilInstance extends Sequelize.Instance<pupilAttribute>, pupilAttribute { }
export interface pupilModel extends Sequelize.Model<pupilInstance, pupilAttribute> { }

// table: parent
export interface parentAttribute {
    id: number;
    nationality?: string;
    passport_id?: string;
    phone_number?: string;
    designation?: string;
    company?: string;
    company_address?: string;
    material_status?: string;
    direct?: number;
}
export interface parentInstance extends Sequelize.Instance<parentAttribute>, parentAttribute { }
export interface parentModel extends Sequelize.Model<parentInstance, parentAttribute> { }

// table: pupil_class
export interface pupil_classAttribute {
    id: number;
    pupil_id: number;
    class_id: number;
    date_time: Date;
    disabled: number;
}
export interface pupil_classInstance extends Sequelize.Instance<pupil_classAttribute>, pupil_classAttribute {
    class: {
        segment_level: {
            level: {
                id: number;
                name: string;
            };
        };
        id: number;
        name: string;
    };
}
export interface pupil_classModel extends Sequelize.Model<pupil_classInstance, pupil_classAttribute> { }

// table: parent_pupil
export interface parent_pupilAttribute {
    id: number;
    parent_id: number;
    pupil_id: number;
    subscription_tariff_id?: number;
    subscription_transaction_id?: number;
    subscription_start_date?: Date;
    subscription_end_date?: Date;
    subscription_stoped?: number;
    subscription_notified?: number;
    archived: number;
    rank: number;
    disabled: number;
    created: Date;
}
export interface parent_pupilInstance extends Sequelize.Instance<parent_pupilAttribute>, parent_pupilAttribute { }
export interface parent_pupilModel extends Sequelize.Model<parent_pupilInstance, parent_pupilAttribute> { }

// table: push_os
export interface push_osAttribute {
    id: number;
    name: string;
}
export interface push_osInstance extends Sequelize.Instance<push_osAttribute>, push_osAttribute { }
export interface push_osModel extends Sequelize.Model<push_osInstance, push_osAttribute> { }

// table: pupil_group
export interface pupil_groupAttribute {
    id: number;
    pupil_class_id: number;
    group_id: number;
    disabled: number;
    rank?: number;
}
export interface pupil_groupInstance extends Sequelize.Instance<pupil_groupAttribute>, pupil_groupAttribute { }
export interface pupil_groupModel extends Sequelize.Model<pupil_groupInstance, pupil_groupAttribute> { }

// table: push_device
export interface push_deviceAttribute {
    id: number;
    user_id: number;
    os_id: number;
    locale: any;
    token: string;
    date_time: Date;
}
export interface push_deviceInstance extends Sequelize.Instance<push_deviceAttribute>, push_deviceAttribute { }
export interface push_deviceModel extends Sequelize.Model<push_deviceInstance, push_deviceAttribute> { }

// table: rate_list
export interface rate_listAttribute {
    id: number;
    name: string;
}
export interface rate_listInstance extends Sequelize.Instance<rate_listAttribute>, rate_listAttribute { }
export interface rate_listModel extends Sequelize.Model<rate_listInstance, rate_listAttribute> { }

// table: report_card_settings
export interface report_card_settingsAttribute {
    id: number;
    school_id: number;
    report_period_id?: number;
    report_year_id?: number;
    comments_overall: number;
    comments_segment_aggregator: number;
    comments_segment_learner_skills: number;
    comments_segment_learner_traits: number;
    comments_course_rubric: number;
    comments_course_learner_skills: number;
    comments_course_learner_traits: number;
    grades_segment_aggregator: number;
    grades_segment_learner_skills: number;
    grades_segment_learner_traits: number;
    grades_course_aggregator: number;
    grades_course_learner_skills: number;
    grades_course_learner_traits: number;
    signatures_count: number;
}
export interface report_card_settingsInstance extends Sequelize.Instance<report_card_settingsAttribute>, report_card_settingsAttribute { }
export interface report_card_settingsModel extends Sequelize.Model<report_card_settingsInstance, report_card_settingsAttribute> { }

// table: report_card_status
export interface report_card_statusAttribute {
    id: number;
    code: string;
    name: string;
    is_default: number;
    is_disabled: number;
}
export interface report_card_statusInstance extends Sequelize.Instance<report_card_statusAttribute>, report_card_statusAttribute { }
export interface report_card_statusModel extends Sequelize.Model<report_card_statusInstance, report_card_statusAttribute> { }

// table: report_card_comment
export interface report_card_commentAttribute {
    report_card_id: number;
    comment?: string;
    name?: string;
    position?: string;
    report_year_id?: number;
    report_period_id?: number;
}
export interface report_card_commentInstance extends Sequelize.Instance<report_card_commentAttribute>, report_card_commentAttribute { }
export interface report_card_commentModel extends Sequelize.Model<report_card_commentInstance, report_card_commentAttribute> { }

// table: report_year
export interface report_yearAttribute {
    id: number;
    start?: number;
    end?: number;
    academic_year_id: number;
    branch_id?: number;
    school_id?: number;
    disabled?: number;
}
export interface report_yearInstance extends Sequelize.Instance<report_yearAttribute>, report_yearAttribute { }
export interface report_yearModel extends Sequelize.Model<report_yearInstance, report_yearAttribute> { }

// table: report_period
export interface report_periodAttribute {
    id: number;
    start: Date;
    end: Date;
    year_id: number;
    disabled?: number;
    code?: number;
}
export interface report_periodInstance extends Sequelize.Instance<report_periodAttribute>, report_periodAttribute { }
export interface report_periodModel extends Sequelize.Model<report_periodInstance, report_periodAttribute> { }

// table: schedule
export interface scheduleAttribute {
    id: number;
    group_id?: number;
    class_id: number;
    subject_id: number;
    teacher_id: number;
    period_id: number;
    venue_id: number;
    schedule_series_id?: number;
    study_time_id: number;
    date: Date;
    update_date: Date;
    create_date: Date;
    disabled: number;
}
export interface scheduleInstance extends Sequelize.Instance<scheduleAttribute>, scheduleAttribute { }
export interface scheduleModel extends Sequelize.Model<scheduleInstance, scheduleAttribute> { }

// table: role
export interface roleAttribute {
    id: number;
    code: string;
    name: string;
    sub_code: string;
    disabled: number;
    curriculum_builder_rank: number;
}
export interface roleInstance extends Sequelize.Instance<roleAttribute>, roleAttribute { }
export interface roleModel extends Sequelize.Model<roleInstance, roleAttribute> { }

// table: referral
export interface referralAttribute {
    id: number;
    message_id?: number;
    to_user_id: number;
    from_user_id: number;
    date_time_send: Date;
    date_time_active?: Date;
    activated: number;
    attempt: number;
}
export interface referralInstance extends Sequelize.Instance<referralAttribute>, referralAttribute { }
export interface referralModel extends Sequelize.Model<referralInstance, referralAttribute> { }

// table: report_card
export interface report_cardAttribute {
    id: number;
    pupil_id: number;
    teacher_id: number;
    status_id: number;
    year_id?: number;
    term_id?: number;
    creation_date: Date;
}
export interface report_cardInstance extends Sequelize.Instance<report_cardAttribute>, report_cardAttribute { }
export interface report_cardModel extends Sequelize.Model<report_cardInstance, report_cardAttribute> { }

// table: schedule_series
export interface schedule_seriesAttribute {
    id: number;
    shift_interval_id?: number;
}
export interface schedule_seriesInstance extends Sequelize.Instance<schedule_seriesAttribute>, schedule_seriesAttribute { }
export interface schedule_seriesModel extends Sequelize.Model<schedule_seriesInstance, schedule_seriesAttribute> { }

// table: school
export interface schoolAttribute {
    id: number;
    short_name?: string;
    name?: string;
    full_name: string;
    city_id: number;
    branch_id?: number;
    update_date: Date;
    create_date: Date;
    disabled: number;
    image_name?: string;
    image_base64?: string;
    active_report_year?: number;
}
export interface schoolInstance extends Sequelize.Instance<schoolAttribute>, schoolAttribute { }
export interface schoolModel extends Sequelize.Model<schoolInstance, schoolAttribute> { }

// table: school_curriculum
export interface school_curriculumAttribute {
    id: number;
    school_id: number;
    curriculum_id: number;
    applying_user_id: number;
    applying_date: Date;
    disabled: number;
}
export interface school_curriculumInstance extends Sequelize.Instance<school_curriculumAttribute>, school_curriculumAttribute { }
export interface school_curriculumModel extends Sequelize.Model<school_curriculumInstance, school_curriculumAttribute> { }

// table: segment
export interface segmentAttribute {
    id: number;
    name: string;
    description?: string;
    education_system_id?: number;
    assessment_type_id?: number;
    branch_id?: number;
    school_id?: number;
    disabled?: number;
}
export interface segmentInstance extends Sequelize.Instance<segmentAttribute>, segmentAttribute { }
export interface segmentModel extends Sequelize.Model<segmentInstance, segmentAttribute> { }

// table: school_subject
export interface school_subjectAttribute {
    id: number;
    school_id?: number;
    branch_id?: number;
    subject_id: number;
    disabled?: number;
    name?:string;
}
export interface school_subjectInstance extends Sequelize.Instance<school_subjectAttribute>, school_subjectAttribute { }
export interface school_subjectModel extends Sequelize.Model<school_subjectInstance, school_subjectAttribute> { }

// table: segment_name
export interface segment_nameAttribute {
    id: number;
    name: string;
    is_disabled: number;
}
export interface segment_nameInstance extends Sequelize.Instance<segment_nameAttribute>, segment_nameAttribute { }
export interface segment_nameModel extends Sequelize.Model<segment_nameInstance, segment_nameAttribute> { }

// table: segment_level
export interface segment_levelAttribute {
    id: number;
    segment_id: number;
    level_id: number;
    disabled?: number;
}
export interface segment_levelInstance extends Sequelize.Instance<segment_levelAttribute>, segment_levelAttribute { }
export interface segment_levelModel extends Sequelize.Model<segment_levelInstance, segment_levelAttribute> { }

// table: shift
export interface shiftAttribute {
    id: number;
    name: string;
    start: any;
    end: any;
    disabled: number;
}
export interface shiftInstance extends Sequelize.Instance<shiftAttribute>, shiftAttribute { }
export interface shiftModel extends Sequelize.Model<shiftInstance, shiftAttribute> { }

// table: shift_interval
export interface shift_intervalAttribute {
    id: number;
    name: string;
    interval: number;
}
export interface shift_intervalInstance extends Sequelize.Instance<shift_intervalAttribute>, shift_intervalAttribute { }
export interface shift_intervalModel extends Sequelize.Model<shift_intervalInstance, shift_intervalAttribute> { }

// table: study_days
export interface study_daysAttribute {
    id: number;
    day_id: number;
    year_id: number;
    disabled?: number;
}
export interface study_daysInstance extends Sequelize.Instance<study_daysAttribute>, study_daysAttribute { }
export interface study_daysModel extends Sequelize.Model<study_daysInstance, study_daysAttribute> { }

// table: study_time
export interface study_timeAttribute {
    id: number;
    time_set_id: number;
    start: any;
    end: any;
    update_date?: Date;
    create_date?: Date;
}
export interface study_timeInstance extends Sequelize.Instance<study_timeAttribute>, study_timeAttribute { }
export interface study_timeModel extends Sequelize.Model<study_timeInstance, study_timeAttribute> { }

// table: subject
export interface subjectAttribute {
    id: number;
    name: string;
    is_disabled: number;
}
export interface subjectInstance extends Sequelize.Instance<subjectAttribute>, subjectAttribute { }
export interface subjectModel extends Sequelize.Model<subjectInstance, subjectAttribute> { }

// table: subscription_feature_tariff
export interface subscription_feature_tariffAttribute {
    feature_id: number;
    tariff_id: number;
    disabled: number;
}
export interface subscription_feature_tariffInstance extends Sequelize.Instance<subscription_feature_tariffAttribute>, subscription_feature_tariffAttribute { }
export interface subscription_feature_tariffModel extends Sequelize.Model<subscription_feature_tariffInstance, subscription_feature_tariffAttribute> { }

// table: subscription_school_tariff
export interface subscription_school_tariffAttribute {
    school_id: number;
    subscription_tariff_id: number;
    default: number;
    disabled: number;
}
export interface subscription_school_tariffInstance extends Sequelize.Instance<subscription_school_tariffAttribute>, subscription_school_tariffAttribute { }
export interface subscription_school_tariffModel extends Sequelize.Model<subscription_school_tariffInstance, subscription_school_tariffAttribute> { }

// table: subscription_feature
export interface subscription_featureAttribute {
    id: number;
    name: string;
    code: string;
    visible: number;
}
export interface subscription_featureInstance extends Sequelize.Instance<subscription_featureAttribute>, subscription_featureAttribute { }
export interface subscription_featureModel extends Sequelize.Model<subscription_featureInstance, subscription_featureAttribute> { }

// table: subscription_tariff
export interface subscription_tariffAttribute {
    id: number;
    name: string;
    description: string;
    code: string;
    model: string;
    duration: any;
    amount: number;
    rank: number;
    disabled: number;
    visible: number;
}
export interface subscription_tariffInstance extends Sequelize.Instance<subscription_tariffAttribute>, subscription_tariffAttribute { }
export interface subscription_tariffModel extends Sequelize.Model<subscription_tariffInstance, subscription_tariffAttribute> { }

// table: subscription_postponed
export interface subscription_postponedAttribute {
    id: number;
    tariff_id: number;
    parent_pupil_id: number;
    start_date: Date;
    end_date: Date;
    transaction_id?: string;
    stoped: number;
}
export interface subscription_postponedInstance extends Sequelize.Instance<subscription_postponedAttribute>, subscription_postponedAttribute { }
export interface subscription_postponedModel extends Sequelize.Model<subscription_postponedInstance, subscription_postponedAttribute> { }

// table: subscription_transaction
export interface subscription_transactionAttribute {
    id: number;
    type_id: number;
    agent_id?: number;
    user_id?: number;
    tariff_id: number;
    parent_pupil_id: number;
    transaction_id: string;
    date_time: Date;
    confirm_transaction: number;
}
export interface subscription_transactionInstance extends Sequelize.Instance<subscription_transactionAttribute>, subscription_transactionAttribute { }
export interface subscription_transactionModel extends Sequelize.Model<subscription_transactionInstance, subscription_transactionAttribute> { }

// table: subscription_transaction_type
export interface subscription_transaction_typeAttribute {
    id: number;
    name: string;
    code: string;
}
export interface subscription_transaction_typeInstance extends Sequelize.Instance<subscription_transaction_typeAttribute>, subscription_transaction_typeAttribute { }
export interface subscription_transaction_typeModel extends Sequelize.Model<subscription_transaction_typeInstance, subscription_transaction_typeAttribute> { }

// table: teacher
export interface teacherAttribute {
    id: number;
    education?: string;
    university?: string;
    speciality?: string;
    category?: string;
    graduation_year?: Date;
    training_year?: Date;
}
export interface teacherInstance extends Sequelize.Instance<teacherAttribute>, teacherAttribute { }
export interface teacherModel extends Sequelize.Model<teacherInstance, teacherAttribute> { }

// table: subscription_transaction_agent
export interface subscription_transaction_agentAttribute {
    id: number;
    name: string;
    code: string;
}
export interface subscription_transaction_agentInstance extends Sequelize.Instance<subscription_transaction_agentAttribute>, subscription_transaction_agentAttribute { }
export interface subscription_transaction_agentModel extends Sequelize.Model<subscription_transaction_agentInstance, subscription_transaction_agentAttribute> { }

// table: teacher_head_class
export interface teacher_head_classAttribute {
    id: number;
    teacher_id: number;
    class_id: number;
    disabled: number;
    is_assigned: number;
}
export interface teacher_head_classInstance extends Sequelize.Instance<teacher_head_classAttribute>, teacher_head_classAttribute { }
export interface teacher_head_classModel extends Sequelize.Model<teacher_head_classInstance, teacher_head_classAttribute> { }

// table: teacher_subject
export interface teacher_subjectAttribute {
    id: number;
    teacher_id: number;
    subject_id: number;
    level_id?: number;
    disabled: number;
}
export interface teacher_subjectInstance extends Sequelize.Instance<teacher_subjectAttribute>, teacher_subjectAttribute { }
export interface teacher_subjectModel extends Sequelize.Model<teacher_subjectInstance, teacher_subjectAttribute> { }

// table: time_set
export interface time_setAttribute {
    id: number;
    year_id: number;
    disabled?: number;
}
export interface time_setInstance extends Sequelize.Instance<time_setAttribute>, time_setAttribute { }
export interface time_setModel extends Sequelize.Model<time_setInstance, time_setAttribute> { }

// table: user_role
export interface user_roleAttribute {
    id: number;
    user_id: number;
    role_id: number;
    branch_id?: number;
    school_id?: number;
    assignment_date: Date;
    disabled: number;
    archived: number;
    update_date: Date;
}
export interface user_roleInstance extends Sequelize.Instance<user_roleAttribute>, user_roleAttribute {
    school: any;
}
export interface user_roleModel extends Sequelize.Model<user_roleInstance, user_roleAttribute> { }

// table: user
export interface userAttribute {
    id: number;
    external_id?: number;
    name: string;
    surname: string;
    middle_name?: string;
    username?: string;
    password?: string;
    activated: number;
    disabled: number;
    reset_pass: number;
    two_factor_auth: number;
    activation_date?: Date;
    creation_date: Date;
    msisdn?: string;
    email: string;
    birthday?: Date;
    photo?: string;
    address?: string;
    gender?: any;
    education?: string;
    university?: string;
    speciality?: string;
    category?: string;
    graduation_date?: Date;
    refresher_date?: Date;
    rate_list_id?: number;
    type?: any;
}
export interface userInstance extends Sequelize.Instance<userAttribute>, userAttribute { }
export interface userModel extends Sequelize.Model<userInstance, userAttribute> { }

// table: venue
export interface venueAttribute {
    id: number;
    name: string;
    description?: string;
    capacity?: number;
    teacher_id?: number;
    school_id: number;
    disabled?: number;
}
export interface venueInstance extends Sequelize.Instance<venueAttribute>, venueAttribute { }
export interface venueModel extends Sequelize.Model<venueInstance, venueAttribute> { }

// table: venue_subject
export interface venue_subjectAttribute {
    id: number;
    venue_id: number;
    subject_id: number;
    disabled: number;
}
export interface venue_subjectInstance extends Sequelize.Instance<venue_subjectAttribute>, venue_subjectAttribute { }
export interface venue_subjectModel extends Sequelize.Model<venue_subjectInstance, venue_subjectAttribute> { }

// table: version
export interface versionAttribute {
    version: number;
}
export interface versionInstance extends Sequelize.Instance<versionAttribute>, versionAttribute { }
export interface versionModel extends Sequelize.Model<versionInstance, versionAttribute> { }
