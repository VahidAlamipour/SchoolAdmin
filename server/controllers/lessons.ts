import dayjs from 'dayjs';
import { Op, Transaction } from 'sequelize';
import { flatten, groupBy, sortBy } from 'lodash';

import { sequelize } from '../db';
import { GenericController, IPageQuery, ReqUser } from '../crud';
import { CrossLessons, ICrossLesson, ILesson, ILessonGroup, IStudyDay } from '../../sdk/interfaces';

import Config from '../config';
import { BeedError } from "../services/beed";

import { RoleRepository } from '../repositories/role';
const roleRepo = new RoleRepository();

const config = Config.load();
const whereNotDisabled = { disabled: 0 };

export default class CRUD extends GenericController<ILesson> {
    public resource = '/lessons';
    public entity: string = 'timetable';

    private mapper(model) {
        function formatTime(time) {
            return time.match(/\d+:\d+/)[0];
        }
        return {
            id: model.schedule_series_id,
            date: model.date,
            classId: model.class_id,
            class: model.class ? {
                id: model.class.id,
                name: model.class.name,
                showName: Boolean(model.class.show_name),
                level: {
                    id: model.class.segment_level.id,
                    name: model.class.segment_level.level.name
                }
            } : undefined,
            subGroupId: model.group_id,
            group: model.group ? {
                id: model.group.id,
                name: model.group.name
            } : undefined,
            groupId: model.group ? model.group_id : undefined,
            timeId: model.study_time_id,
            time: model.study_time ? {
                id: model.study_time.id,
                start: formatTime(model.study_time.start),
                end: formatTime(model.study_time.end),
            } : undefined,
            teacherId: model.teacher_id,
            subjectId: model.subject_id,
            subject: model.subject ? {
                id: model.subject.id,
                name: model.subject.name
            } : undefined,
            teacher: model.user ? {
                id: model.user.id,
                name: model.user.name,
                lastName: model.user.surname,
                middleName: model.user.middle_name,
            } : undefined,
            roomId: model.subject_id,
            room: model.venue ? {
                id: model.venue.id,
                name: model.venue.name,
                description: model.venue.description,
                capacity: model.venue.capacity
            } : undefined,
        };
    }
    public async find(query: IPageQuery & {
        startDate?: string;
        endDate?: string;
        academicYearId?: number;
        classId?: number;
        shiftId?: number;
        timeId?: number;
    }, me: ReqUser): Promise<{ rows: any[]; count: number }> {
        { // HACK for setting default dates to current week
            const firstDayOfWeek = 0;
            const weekDiff = 6;

            query.startDate = query.startDate || dayjs().startOf('week').set('day', firstDayOfWeek).format('YYYY-MM-DD');
            query.endDate = query.endDate || dayjs(query.startDate).add(weekDiff, 'day').format('YYYY-MM-DD');

            if (dayjs(query.endDate).diff(dayjs(query.startDate), 'day') > weekDiff) {
                const error: any = new Error('Max period - week');
                error.code = 400;
                throw error;
            }
        }

        let reportYear;

        try {
            reportYear = await this.models.academic_year.findOne({
                // where: {
                //     end: {
                //         [Op.gte]: new Date().getFullYear()
                //     }
                // },
                order: [
                    ['start', 'ASC'],
                    ['end', 'ASC'],
                ],
                include: [{
                    model: this.models.report_year,
                    where: {
                        school_id: me.school.id,
                        ...whereNotDisabled,
                        ...query.academicYearId ? {
                            id: query.academicYearId,
                        } : {},
                    },
                    include: [{
                        model: this.models.study_days,
                    }, {
                        model: this.models.report_period,
                        where: {
                            ...whereNotDisabled,
                            ...query.academicYearId ? {} : {
                                start: {
                                    [Op.lte]: query.endDate
                                },
                                end: {
                                    [Op.gte]: query.startDate
                                }
                            }
                        }
                    }]
                }]
            }).then((academYear: any): any => {
                return academYear.report_years[0];
            });

        } catch {
            return {
                count: 0,
                rows: []
            };
        }
        let startdate =null;
        let enddate = null;
        if(query.classId == undefined){          
            startdate = reportYear.report_periods[0].start;
            enddate = reportYear.report_periods[reportYear.report_periods.length-1].end;
        }
        const lessons = await this.models.schedule.findAll({
            where: {
                ...whereNotDisabled,
                ...query.classId ? {
                    class_id: query.classId,
                } : {},
                period_id: reportYear.report_periods.map((row): number => row.id),
                date: {
                    [Op.gte]: startdate != null ? startdate : query.startDate,
                    [Op.lte]: enddate != null ? enddate : query.endDate
                },
                ...query.timeId ? {
                    study_time_id: query.timeId,
                } : {},
                ...query.id ? {
                    schedule_series_id: query.id,
                } : {}
            },
            include: [{
                model: this.models.study_time,
                where: query.shiftId ? {
                    time_set_id: query.shiftId
                } : {},
                include: [{
                    model: this.models.time_set,
                    where: whereNotDisabled
                }]
            }, {
                model: this.models.subject,
                where: {
                    is_disabled: 0
                }
            }, {
                required: false,
                model: this.models.group,
                where: whereNotDisabled
            }, {
                model: this.models.venue,
                where: whereNotDisabled
            }, {
                required: false,
                model: this.models.user,
                where: whereNotDisabled
            }]
        });

        const lessonsByDate = groupBy(lessons, 'date');

        const dates = [];

        { // fill dates array
            const days = reportYear.study_days.map((row): number => row.day_id);

            const daysSet = new Set(days);

            let walker = dayjs(query.startDate);

            while (walker.isBefore(dayjs(query.endDate)) || walker.isSame(dayjs(query.endDate))) {
                const workday = reportYear.report_periods.find((period): boolean => {
                    return this.isPeriodIncludesDate(period, walker);
                });

                if (daysSet.has(walker.day()) && workday) {
                    dates.push(walker.format('YYYY-MM-DD'));
                }

                walker = walker.add(1, 'day');
            }
        }

        const rows = dates.map((date): IStudyDay => {
            const lessonsByTime = groupBy(lessonsByDate[date], 'study_time_id')

            const lessons = Object.keys(lessonsByTime).map((id): ILesson => {
                const groupLessons = lessonsByTime[id]

                const anyLesson = groupLessons[0]

                if (!anyLesson.group_id) {
                    return this.mapper(anyLesson);
                }

                return { // lesson with gro
                    ...this.mapper(anyLesson),
                    groups: groupLessons.map(this.mapper),
                }
            })

            return {
                date,
                lessons: sortBy(lessons, 'time.start')
            }
        });
        let count = 0;
        count = startdate != null && enddate != null ?  lessons.length : dates.length;
        return {
            rows,
            count: count
        };
    }
    private isPeriodIncludesDate(period, date): boolean {
        const dayjsDate = dayjs(date);

        return dayjsDate.isAfter(dayjs(period.start).subtract(1, 'day'))
            && dayjsDate.isBefore(dayjs(period.end).add(1, 'day'));
    }
    public async findOne(id: number, me: ReqUser, query: any): Promise<ILesson> {
        return Promise.all([
            this.find({
                id,
                startDate: query.date,
                endDate: query.date,
                ...query
            }, me),
            this.models.schedule.findOne({
                where: {
                    schedule_series_id: id,
                    disabled: 0
                },
                order: [
                    ['date', 'desc']
                ]
            })
        ]).then(async ([res, last]) => {
            if (!res.count || !res.rows[0].lessons[0]) {
                const error: any = new Error('Not found');
                error.code = 404;
                throw error;
            }

            const lesson = res.rows[0].lessons[0];

            const classs: any = await this.models.class.findOne({
                where: {
                    id: lesson.classId,
                    disabled: 0
                },
                include: [{
                    model: this.models.segment_level,
                    where: { disabled: 0 },
                    include: [{
                        model: this.models.level,
                        where: { disabled: 0 }
                    }]
                }]
            });

            return {
                ...lesson,
                class: {
                    id: classs.id,
                    name: classs.name,
                    showName: classs.show_name,
                    level: {
                        id: classs.segment_level.id,
                        name: classs.segment_level.level.name
                    }
                },
                lastDate: lesson.date === last.date ? undefined : last.date,
            };
        });
    }
    private async getDates(yearId, datetime, repeat = 'Once', intervalId, transaction: Transaction | null = null): Promise<{ period_id: number; date: Date }[]> {
        const date = dayjs(datetime);

        const yearPeriods = await this.models.report_period.findAll({
            where: {
                year_id: yearId,
                ...whereNotDisabled
            },
            order: [
                ['start', 'ASC'],
                ['end', 'ASC'],
            ],
            transaction
        });

        const periods = yearPeriods.filter(period => {
            return repeat === 'Year' ? true : this.isPeriodIncludesDate(period, date);
        });

        if (!periods.length) {
            const error: any = new Error(`Period for date ${date} in year[${yearId}] not found`);
            error.code = 400;
            throw error;
        }

        if (repeat === 'Once') {
            return [{
                period_id: periods[0].id,
                date: date.toDate()
            }];
        } else if (intervalId) {
            const shiftInteval = await this.models.shift_interval.findOne({
                where: {
                    id: intervalId
                },
                transaction
            });

            if (!shiftInteval) {
                const error: any = new Error(`Interval[${intervalId}] not found`);
                error.code = 404;
                throw error;
            }

            let walker = date.clone();

            const dates = [];

            for (let period of periods) {
                const start = dayjs(period.start);
                const end = dayjs(period.end);

                while (!walker.isAfter(end)) {
                    if (!walker.isBefore(start)) {
                        dates.push({
                            period_id: period.id,
                            date: walker.toDate()
                        });
                    }
                    walker = walker.add(shiftInteval.interval, 'day');
                }
            }

            return dates;
        }

    }
    private async validate(data: ILesson): Promise<void> {
        this.checkGroups(data.groups);
    }
    private checkDate(date): void {
        const newDate = dayjs(date);
        const now = dayjs();
        let isToday = false;
        if (newDate.day() === now.day() && newDate.month() === now.month() && newDate.year() === now.year())
            isToday = true;



        if (date) {
            if (dayjs().isAfter(newDate) && !isToday) {
                throw new BeedError('Event cannot be changed', 500)
            }
        }
    }
    private async calculateLessons(data: ILesson, transaction: Transaction | null = null): Promise<{
        group_id: number;
        subject_id: number;
        teacher_id: number;
        venue_id: number;
        class_id: number;
        study_time_id: number;
        period_id: number;
        date: Date;
    }[]> {
        let academicYearId = data.academicYearId;

        if (!academicYearId) {
            const time: any = await this.models.study_time.findOne({
                where: { id: data.timeId },
                include: [this.models.time_set],
                transaction
            });

            academicYearId = time.time_set.year_id;
        }

        const dates = await this.getDates(academicYearId, data.date, data.repeat || 'Once', data.intervalId);

        const groups = [...(data.groups && data.groups.length)
            ? data.groups
            : [data]
        ].map((data: ILessonGroup) => ({
            group_id: data.subGroupId,
            subject_id: data.subjectId,
            teacher_id: data.teacherId,
            venue_id: data.roomId,
        }));

        return flatten(groups.map((group) => {
            return dates.map(dateMixin => ({
                class_id: data.classId,
                study_time_id: data.timeId,
                ...group,
                ...dateMixin
            }));
        }));
    }
    private checkGroups(groups: any[], limit = config.reqUserConfig.subgroupsMaxCount): void {
        if (groups && (!groups.length || groups.length > limit)) {

            const error: any = new Error(`Please ensure there are 1 or more subclasses in this timeslot`);
            error.code = 500;
            throw error;
        }
    }
    private async externalTeacher(data: ILesson, transaction: Transaction | null = null) {
        if (data.teacherId) {
            const teacher = await this.models.user.findOne({
                where: {
                    id: data.teacherId
                },
                transaction
            });
            data.teacherOAuthId = teacher.external_id;
        }

        if (data.groups) {
            const teachers = await this.models.user.findAll({
                where: {
                    id: data.groups.map(group => group.teacherId)
                },
                transaction
            });
            const teacherExternalIds = {};
            teachers.map(teacher => {
                teacherExternalIds[teacher.id] = teacher.external_id;
            });
            data.groups = data.groups.map(group => {
                group.teacherOAuthId = teacherExternalIds[group.teacherId];

                return group;
            });
        }
    }

    public async getCrossingLessons(dates: string[], classId: number, timeId: number): Promise<ICrossLesson[]> {
        const crossingLessons = await this.models.schedule.findAll({
            attributes: ['id', 'date', 'subject.name', 'study_time.start', 'study_time.end'],
            include: [this.models.subject, this.models.study_time],
            where: {
                class_id: classId,
                study_time_id: timeId,
                disabled: 0,
                date: {
                    [Op.in]: dates,
                }
            },
            raw: true,
        });

        return crossingLessons.map((lesson: any) => ({
            id: lesson.id,
            date: dayjs(lesson.date).format('YYYY-MM-DD'),
            subjectName: lesson.name,
            time: `${lesson.start.substring(0, 5)} - ${lesson.end.substring(0, 5)}`,
        }));
    }

    public async create(data: ILesson, me: ReqUser, query, transaction: Transaction): Promise<number> {
        if (data.teacherId > 0 || (data.groups && data.groups.length)) {
            const listOfTeachers = [];
            if (data.groups && data.groups.length) {
                data.groups.forEach(x => listOfTeachers.push(x.teacherId))
            } else {
                listOfTeachers.push(data.teacherId);
            }
            for await (const teacherId of listOfTeachers) {
                const learnerAndEducatorInClassValid = await roleRepo.checkLearnerAndEducatorInClass(teacherId,
                    [], [{ homeClassId: parseInt(data.classId.toString()) }]);
                if (!learnerAndEducatorInClassValid) {
                    const errorr: any = new Error("User cannot be both educator and learner in the same class");
                    errorr.code = 500;
                    throw errorr;
                }
            }
        }
        //#region making sure for academic year ID
        if (!data.academicYearId) {
            const time: any = await this.models.study_time.findOne({
                where: { id: data.timeId },
                include: [this.models.time_set],
                transaction
            });

            data.academicYearId = time.time_set.year_id;
        }
        //#endregion
        
        if (data.crossingLessonsMode === undefined) {
            data.crossingLessonsMode = CrossLessons.break;
        }

        await this.validate(data);
        this.checkDate(data.date);

        const scheduleSeriesId = await this.newSerie(transaction);

        let lessons = await this.calculateLessons(data, transaction);

        const dates = lessons.map((lesson): string => dayjs(lesson.date).format('YYYY-MM-DD'));
        const crossingLessons = await this.getCrossingLessons(dates, data.classId, data.timeId);

        if (crossingLessons.length) {
            if (data.crossingLessonsMode === CrossLessons.break) {
                throw new BeedError(JSON.stringify(crossingLessons), 200);
            } else if (data.crossingLessonsMode === CrossLessons.remove) {
                await this.models.schedule.update({
                    disabled: 1,
                }, {
                    where: {
                        id: {
                            [Op.in]: crossingLessons.map((lesson): number => lesson.id),
                        },
                    },
                });

                for (let lesson of crossingLessons) {
                    await this.emit({
                        id: lesson.id,
                        event: 'DELETED',
                        emiter: 'local'
                    }, { id: lesson.id, date: lesson.date }, me.school);
                }
            } else if (data.crossingLessonsMode === CrossLessons.ignore) {
                const datesSet = new Set(crossingLessons.map((lesson): string => lesson.date));

                lessons = lessons.filter((lesson): boolean => !datesSet.has(dayjs(lesson.date).format('YYYY-MM-DD')));
            }
        }

        const inserted = await this.models.schedule.bulkCreate(lessons.map(lesson => ({
            id: null,
            create_date: new Date(),
            update_date: new Date(),
            schedule_series_id: scheduleSeriesId,
            disabled: 0,
            ...lesson
        })), {
            transaction
        });

        await this.externalTeacher(data, transaction);
        delete (data.intervalId);
        delete (data.repeat);
        // TODO emit inserted to RMQ
        await Promise.all(inserted.map(async (lesson): Promise<void> => {
            const result = { ...data, id: lesson.id, date: lesson.date };

            if (data.groups) {
                result.groups = data.groups.filter((group): boolean => group.subGroupId === lesson.group_id);
            }

            await this.emit({
                id: lesson.id,
                event: 'CREATED',
                emiter: 'local'
            }, result, me.school, transaction);
        }));

        return scheduleSeriesId;
    }
    private async newSerie(transaction: Transaction | null = null): Promise<number> {
        const scheduleSeries = await this.models.schedule_series.create({
            id: null,
            shift_interval_id: 1
        }, {
            transaction
        });

        return scheduleSeries.id;
    }
    private where(id: number, date: Date, all: boolean) {
        return {
            schedule_series_id: id,
            disabled: 0,
            [Op.and]: [
                ...all ? [{
                    date: {
                        [Op.gte]: date
                    }
                }] : [{
                    date
                }],
                {
                    date: {
                        [Op.gte]: new Date()
                    }
                },
            ]
        };
    }
    public async update(id: number, data: ILesson, me: ReqUser, query, transaction: Transaction): Promise<number> {
        const firtItem = await this.models.schedule.findOne({ where: { schedule_series_id: id } });
        // if (data.teacherId > 0) {
        //     const learnerAndEducatorInClassValid = await roleRepo.checkLearnerAndEducatorInClass(data.teacherId,
        //         [], [{ homeClassId: firtItem.class_id }]);
        //     if (!learnerAndEducatorInClassValid) {
        //         const errorr: any = new Error("User cannot be both educator and learner in the same class");
        //         errorr.code = 500;
        //         throw errorr;
        //     }
        // }
        if (data.teacherId > 0 || (data.groups && data.groups.length)) {
            const listOfTeachers = [];
            if (data.groups && data.groups.length) {
                data.groups.forEach(x => listOfTeachers.push(x.teacherId))
            } else {
                listOfTeachers.push(data.teacherId);
            }
            for await (const teacherId of listOfTeachers) {
                const learnerAndEducatorInClassValid = await roleRepo.checkLearnerAndEducatorInClass(teacherId,
                    [], [{ homeClassId: firtItem.class_id }]);
                if (!learnerAndEducatorInClassValid) {
                    const errorr: any = new Error("User cannot be both educator and learner in the same class");
                    errorr.code = 500;
                    throw errorr;
                }
            }
        }







        await this.validate(data);
        this.checkDate(query.date);

        const mixin = query.date ? {
            schedule_series_id: await this.newSerie(transaction)
        } : {};

        if (!data.date) {
            data.date = dayjs(query.date).format('YYYY-MM-DD');
        }

        const where = {
            schedule_series_id: id,
            disabled: 0,
            [Op.and]: [
                ...data.date ? [
                    {
                        date: data.date
                    },
                    {
                        date: {
                            [Op.gte]: data.date || dayjs().format('YYYY-MM-DD')
                        }
                    },
                ] : [],
                {
                    date: {
                        [Op.gte]: new Date()
                    }
                },
            ]
        };

        await this.externalTeacher(data, transaction);
        if (data.groups) {
            const dbGroups: any[] = await this.models.schedule.findAll({
                where,
                raw: true,
                transaction
            });

            const dbGroupsSet = new Set(dbGroups.map(({ group_id }) => group_id));
            const newSet = new Set(data.groups.map(({ subGroupId }) => subGroupId));

            const targetCloningGroupId = dbGroups[0].group_id;
            const targetCloningSerie = dbGroups.filter(({ group_id }) => group_id === targetCloningGroupId);

            const newL = group => targetCloningSerie.map(lessonToClone => {
                return {
                    ...lessonToClone,
                    ...mixin,
                    create_date: new Date(),
                    subject_id: group.subjectId,
                    teacher_id: group.teacherId,
                    venue_id: group.roomId,
                    group_id: group.subGroupId,
                    id: null
                };
            });

            const createLessons = data.groups
                .filter(({ subGroupId }): boolean => !dbGroupsSet.has(subGroupId))
                .map(async (group): Promise<void> => {
                    const lessons = await this.models.schedule.bulkCreate(newL(group), {
                        transaction
                    });

                    for (const lesson of lessons) {

                        const result = { ...data, id: lesson.id, date: lesson.date };

                        if (!result.repeat) {
                            result.repeat = 'Once'
                        }

                        if (data.groups) {
                            result.groups = data.groups.filter((group): boolean => group.subGroupId === lesson.group_id);
                        }

                        await this.emit({
                            id: lesson.id,
                            event: 'CREATED',
                            emiter: 'local'
                        }, result, me.school);
                    }
                });

            const updateLessons = data.groups
                .filter(({ subGroupId }): boolean => dbGroupsSet.has(subGroupId))
                .map(async (group): Promise<void> => {
                    const lesson = await this.models.schedule.findOne({
                        where: {
                            group_id: group.subGroupId,
                            ...where
                        },
                        transaction
                    });

                    await lesson.update({
                        ...mixin,
                        subject_id: group.subjectId,
                        teacher_id: group.teacherId,
                        venue_id: group.roomId
                    }, {
                        transaction
                    });

                    const result = { ...data, id: lesson.id, date: lesson.date };

                    if (!result.repeat) {
                        result.repeat = 'Once'
                    }

                    if (data.groups) {
                        result.groups = data.groups.filter((group): boolean => group.subGroupId === lesson.group_id);
                    }

                    await this.emit({
                        id: lesson.id,
                        event: 'UPDATED',
                        emiter: 'local'
                    }, result, me.school);
                });

            const deleteLessons = [...dbGroupsSet]
                .filter((id): boolean => !newSet.has(id))
                .map(async (group_id): Promise<void> => {
                    const lesson = await this.models.schedule.findOne({
                        where: {
                            group_id: group_id,
                            ...where
                        }
                    });
                    var checkLessonlinked: any[] = await sequelize.query(`
                    SELECT LPL.schedule_id FROM school_curriculum_builder_v3.lesson_plan_link LPL 
                    WHERE LPL.schedule_id = ${lesson.id}`, { type: sequelize.QueryTypes.SELECT });
                    if (checkLessonlinked && checkLessonlinked.length > 0) {
                        const error: any = new Error('Selected Timetable slot is linked to a Lesson. Please remove the link before deleting.');
                        error.code = 500;
                        throw error;
                    }
                    await lesson.update({
                        disabled: 1
                    }, {
                        transaction
                    });

                    const result = { ...data, id: lesson.id, date: lesson.date };

                    if (!result.repeat) {
                        result.repeat = 'Once'
                    }

                    result.groups = [{
                        subGroupId: lesson.group_id,
                        teacherId: lesson.teacher_id,
                        subjectId: lesson.subject_id,
                        roomId: lesson.venue_id,
                    }];

                    await this.emit({
                        id: lesson.id,
                        event: 'DELETED',
                        emiter: 'local'
                    }, result, me.school);
                });

            await Promise.all([
                ...createLessons,
                ...updateLessons,
                ...deleteLessons
            ])
        } else {
            const schedules = await this.models.schedule.findAll({
                where,
                transaction
            });

            await Promise.all(schedules.map(async (schedule): Promise<void> => {
                await schedule.update({
                    ...mixin,
                    teacher_id: data.teacherId,
                    venue_id: data.roomId
                }, {
                    transaction
                });

                await this.emit({
                    id: schedule.id,
                    event: 'UPDATED',
                    emiter: 'local'
                }, {
                    id: schedule.id,
                    ...data
                }, me.school);
            }));
        }

        // HACK
        return mixin.schedule_series_id || id;
    }
    public async delete(id: number, me: ReqUser, query: any = {}, transaction: Transaction): Promise<void> {
        try {
            this.checkDate(query.date);
            const lessons = await this.models.schedule.findAll({
                where: this.where(id, query.date, query.all === 'true'),
                transaction
            });

            var checkLessonlinked: any[] = await sequelize.query(`
        SELECT S.id  FROM school_core_v3.schedule S 
        JOIN school_curriculum_builder_v3.lesson_plan_link LPL ON S.id=LPL.schedule_id 
        WHERE S.id  IN (${lessons.map(row => row.id)});`,
                { type: sequelize.QueryTypes.SELECT });

            let row: number = checkLessonlinked.length;
            if (row > 0) {
                const error: any = new Error('Selected Timetable slot is linked to a Lesson. Please remove the link before deleting.');
                error.code = 500;
                throw error;
                return;
            }
            await this.models.schedule.update({
                disabled: 1
            },
                {
                    where: this.where(id, query.date, query.all === 'true'),
                    transaction
                });

            lessons.map(async (lesson) => {
                await this.emit({
                    id: lesson.id,
                    event: 'DELETED',
                    emiter: 'local'
                }, { id: lesson.id, date: lesson.date }, me.school);
            });
        } catch (error) {
            console.log('Error', error.message);
            throw error;
        }


    }




}
