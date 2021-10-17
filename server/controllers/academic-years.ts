import { sortBy } from 'lodash';
import { Op, Transaction } from 'sequelize';
import { Request, Response } from 'express';

import { GenericController, ReqUser, IPageQuery } from '../crud';
import { IAcademicYear, IShift, IStudyDay } from '../../sdk/interfaces';

import { StudyDaysRepository } from '../repositories/relation';
import { BeedError } from '../services/beed';
import { study_timeAttribute } from '../models/db';
import { Messages, IMessage } from '../repositories/messages';

const studyDaysRepo = new StudyDaysRepository();

const whereDisabled = {
    disabled: 0,
};

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IPeriods {
    id: null | number;
    start: Date;
    end: Date;
    year_id?: number;
    time_set_id?: number;
    code?: number;
}

export default class CRUD extends GenericController<IAcademicYear> {
    public resource = '/academic-years';
    public entity = 'year';

    private static formatTime(time): string {
        return time.match(/\d+:\d+/)[0];
    }

    private static shiftProcessing(row, index): IShift {
        const range = {
            start: '',
            end: '',
        };

        const times = sortBy(row.study_times, 'start').map(row => {
            if (!range.start || row.start < range.start) {
                range.start = CRUD.formatTime(row.start);
            }

            if (!range.end || row.end > range.end) {
                range.end = CRUD.formatTime(row.end);
            }

            return {
                id: row.id,
                isBlocked: Boolean(row.schedules && row.schedules.length),
                start: CRUD.formatTime(row.start),
                end: CRUD.formatTime(row.end),
            };
        });

        return {
            id: row.id,
            name: `${index + 1}`,
            range,
            times,
        };
    }

    public async find(query: IPageQuery & {
        classId?: number;
        date?: Date;
        shiftId?: number;
    }, me: ReqUser): Promise<{ rows: IAcademicYear[]; count: number }> {
        const school: any = await this.models.school.findOne({
            where: {
                id: query.schoolId || me.school.id,
                disabled: 0
            },
            include: [{
                model: this.models.city,
            }]
        });

        query.shiftId = Number(query.shiftId) || undefined;

        let dateTimes = [];

        if (query.date && query.classId) {
            const lessons = await this.models.schedule.findAll({
                where: {
                    disabled: 0,
                    date: query.date,
                    class_id: query.classId,
                },
            });

            dateTimes = lessons.map(({ study_time_id }): number => study_time_id);
        }

        const [days, data] = await Promise.all([
            this.getCountryDays(school.city.country_id),
            this.models.academic_year.findAll({
                // where: {
                //     end: {
                //         [Op.gte]: new Date().getFullYear()
                //     }
                // },
                limit: query.limit,
                offset: query.limit * query.page,
                subQuery: false,
                order: [
                    ['start', query.order],
                    ['end', query.order]
                ],
                group: [
                    'academic_year.id',
                    'report_years.id',
                    'report_years->study_days.id',
                    'report_years->report_periods.id',
                    'report_years->time_sets.id',
                    'report_years->time_sets->study_times.id',
                ],
                include: [{
                    required: true,
                    model: this.models.report_year,
                    where: {
                        ...query.id ? {
                            id: query.id,
                        } : {
                                ...query.branchId ? {
                                    branch_id: query.branchId
                                } : {
                                        ...query.schoolId ? {
                                            school_id: query.schoolId
                                        } : {
                                                school_id: me.school.id
                                            },
                                    }
                            },
                        ...whereDisabled
                    },
                    include: [{
                        model: this.models.study_days,
                        where: whereDisabled,
                    }, {
                        model: this.models.report_period,
                        where: {
                            ...whereDisabled
                        }
                    }, {
                        model: this.models.time_set,
                        where: {
                            ...whereDisabled,
                            ...query.shiftId ? {
                                id: query.shiftId,
                            } : {},
                        },
                        include: [{
                            required: false,
                            model: this.models.study_time,
                            where: {
                                id: {
                                    [Op.notIn]: dateTimes
                                }
                            },
                            include: [{
                                model: this.models.schedule,
                                required: false,
                            }]
                        }],
                    }]
                }],
            }),
        ]);

        const rows = data.map((academic_year: any) => {
            const row = academic_year.report_years[0];

            const activeDays = new Set(row.study_days.map(studyDay => studyDay.day_id));

            return {
                id: row.id,
                yearId: academic_year.id,
                name: `${academic_year.start} - ${academic_year.end}`,
                start: academic_year.start,
                end: academic_year.end,
                shifts: sortBy(row.time_sets, 'id').map(CRUD.shiftProcessing),
                terms: sortBy(row.report_periods.map(report_period => ({
                    id: report_period.id,
                    start: new Date(report_period.start),
                    end: new Date(report_period.end),
                })), 'start'),
                days: days.map(day => ({
                    id: day.id,
                    code: day.code,
                    selected: activeDays.has(day.id)
                }))
            };
        });

        if (rows.length && (query.id || ((query.date && query.classId)))) {
            const intervals = await this.models.shift_interval.findAll();
            // @ts-ignore
            rows[0].intervals = intervals.map((row): { id: number; name: string } => ({
                id: row.id,
                name: row.name
            }));
        }

        return {
            rows,
            count: rows.length,
        };
    }
    public async update(id: number, data: IAcademicYear 
        & { daysIds: [number], periods: [any], academicYear: any }, 
        me: ReqUser, query, transaction: Transaction): Promise<void> {


        const rows: any = await this.models.report_year.findAll({
            subQuery: false,
            where: {
                id,
                ...whereDisabled
            },
            group: [
                'report_year.id',
                'study_days.id',
                'report_periods.id',
                'time_sets.id',
                'time_sets->study_times.id',
            ],
            include: [{
                model: this.models.study_days,
                where: whereDisabled,
            }, {
                model: this.models.report_period,
                where: {
                    ...whereDisabled
                }
            }, {
                model: this.models.time_set,
                where: whereDisabled,
                include: [{
                    required: false,
                    model: this.models.study_time,
                    include: [{
                        model: this.models.schedule,
                        required: false,
                    }]
                }],
            }],
        });

        if (!rows[0]) {
            throw new BeedError('Year not found', 404);
        }


        const shifts = [];
        const newShifts = new Set();
        const newTimes = new Set();
        const row = rows[0];


        //#region duplicate periods
        let newPeriods: Array<any> = [];
        let oldPeriods = row.dataValues.report_periods.map(element => {
            return element.dataValues
        });
        let oldPeriodsIds: Array<number> = oldPeriods.map(p => p.id);
        let updateTermsFlag = oldPeriods.length != data.periods.length;
        if (!updateTermsFlag) {
            oldPeriods.forEach((item, index) => {
                if (!updateTermsFlag && (data.periods[index].startDate != item.start || data.periods[index].endDate != item.end)) {
                    updateTermsFlag = true
                }
            });
        }
        if (updateTermsFlag) {
            //delete old Periods 
            this.models.report_period.update({
                disabled: 1
            }, {
                where: {
                    id: {
                        [Op.in]: oldPeriodsIds
                    }
                }
            });
            //making ready new periods for adding 
            newPeriods = data.periods.map((period, index): IPeriods => {
                return {
                    id: null,
                    start: period.startDate,
                    end: period.endDate,
                    year_id: id,
                    code: Number(index) + 1,
                };
            });
            const periods = await this.models.report_period.bulkCreate(newPeriods);
        }
        //#endregion


        //#region duplicate studyDays
        var oldStudyDaysId = row.study_days.map(element => {
            return element.dataValues.day_id
        });
        oldStudyDaysId = sortBy(oldStudyDaysId);
        let inDaysIds = sortBy(data.daysIds);
        let updateStudyDayFlag = oldStudyDaysId.length != inDaysIds.length;
        if (!updateStudyDayFlag) {
            oldStudyDaysId.forEach((item, index) => {
                if (!updateStudyDayFlag && inDaysIds[index] != item) {
                    updateStudyDayFlag = true
                }
            });
        }
        if (updateStudyDayFlag) {
            await studyDaysRepo.linkYearToDays(id, data.daysIds, transaction);
        }
        //#endregion
        const existShifts: (IShift & { isInNew?: boolean })[] = sortBy(row.time_sets, 'id').map(CRUD.shiftProcessing);
        for (let shift of data.shifts) {
            if (!shift.id) {
                const timeSet = await this.models.time_set.create({
                    id: null,
                    year_id: id,
                }, {
                    transaction
                });

                newShifts.add(timeSet.id);

                const times = await this.models.study_time.bulkCreate(shift.times.map((time): study_timeAttribute => {
                    return {
                        id: null,
                        start: time.start,
                        end: time.end,
                        time_set_id: timeSet.id
                    };
                }), {
                    transaction
                });

                shifts.push(times.map((time): IPeriods => {
                    newTimes.add(time.id);

                    return {
                        id: time.id,
                        start: time.start,
                        end: time.end
                    };
                }));

                continue;
            }

            const existShift = existShifts.find((sh): boolean => sh.id === shift.id);

            if (!existShift) {
                throw new BeedError('Shift not found', 404)
            }

            existShift.isInNew = true;
            newShifts.add(existShift.id);

            const times = await this.models.study_time.bulkCreate(
                shift.times
                    .filter((time): boolean => !time.id)
                    .map((time): study_timeAttribute => ({
                        id: null,
                        start: time.start,
                        end: time.end,
                        time_set_id: existShift.id
                    })), { transaction });

            shifts.push([...times, ...shift.times.filter((time): number => time.id)]
                .map((time): IPeriods => {
                    newTimes.add(time.id);

                    return {
                        id: time.id,
                        start: time.start,
                        end: time.end
                    };
                }));
        }

        const shiftsForDelete = [], timesForDelete = [];

        for (let shift of existShifts) {
            let shiftIsBlocked = false;

            for (let time of shift.times) {
                if (time.isBlocked) {
                    shiftIsBlocked = true;

                    if (!newTimes.has(time.id)) {
                        throw new BeedError('Can\'t delete the blocked time', 500);
                    }
                } else if (!newTimes.has(time.id)) {
                    timesForDelete.push(time.id);
                }
            }

            if (shiftIsBlocked && !newShifts.has(shift.id)) {
                throw new BeedError('Can\'t delete the blocked shift', 500);
            } else if (!newShifts.has(shift.id)) {
                shiftsForDelete.push(shift.id);
            }
        }

        await Promise.all([
            this.models.time_set.update({
                disabled: 1
            }, {
                where: {
                    id: {
                        [Op.in]: shiftsForDelete
                    }
                }
            }),
            this.models.study_time.destroy({
                where: {
                    id: {
                        [Op.in]: timesForDelete
                    }
                }
            })
        ]);

        const academicYear = await this.models.academic_year.findOne({
            where: {
                id: row.academic_year_id
            }
        });
        if (academicYear) {
            data.academicYear = academicYear.get();
        }
        const periods = await this.models.report_period.findAll({
            attributes:['id','start','end'],
            where:{
                year_id:id,
                disabled:0
            }
        });
        if (periods) {
            data.periods = periods as [any];
        }
        data.shifts = shifts;
        for (let key in data) {
            if (!['id', 'shifts', 'daysIds', 'periods', 'academicYear'].includes(key)) {
                delete data[key];
            }
        }

    }
    public async create(data, me: ReqUser, query, transaction: Transaction): Promise<any> {
        let year: { id: number };

        try {
            year = await this.models.report_year.create({
                id: null,
                branch_id: null,
                school_id: query.schoolId,
                academic_year_id: data.yearId
            });
        } catch {
            throw new BeedError('Academic year already exist', 500);
        }

        //#region  duplicate yearId 
        // if (data.duplicatedYearId) {
        //     let classForDuplication = await this.models.class.findAll({
        //         where: {
        //             year_id: data.duplicatedYearId,
        //             disabled: 0
        //         },
        //         transaction
        //     });
        //     var objsForClass = classForDuplication.map(item => {
        //         return {
        //             id: null,
        //             name: item.name,
        //             level_id: item.level_id,
        //             shift_id: 1,
        //             year_id: year.id,
        //             school_id: item.school_id,
        //             show_name: item.show_name,
        //             transmitted: 0,
        //             graduated: 0,
        //         }
        //     });
        //     var crateClass = await this.models.class.bulkCreate(objsForClass, { transaction });
        // }
        //#endregion

        const academicYear = await this.models.academic_year.findOne({
            where: {
                id: data.yearId
            },
            transaction
        });
        data.academicYear = academicYear.get();

        Object.assign(data, query);
        await studyDaysRepo.linkYearToDays(year.id, data.daysIds, transaction);

        const periods = await this.models.report_period.bulkCreate(data.periods.map((period, index): IPeriods => {
            return {
                id: null,
                start: period.startDate,
                end: period.endDate,
                year_id: year.id,
                code: Number(index) + 1,
            };
        }), {
            transaction
        });
        data.periods = periods.map((period): IPeriods => {
            return {
                id: period.id,
                start: period.start,
                end: period.end
            };
        });

        const shifts = [];
        for (const shift of data.shifts) {
            const shiftTimes = shift.times;

            const timeSet = await this.models.time_set.create({
                id: null,
                year_id: year.id,
            }, {
                transaction
            });

            const times = await this.models.study_time.bulkCreate(shiftTimes.map((time): IPeriods => {
                return {
                    id: null,
                    start: time.start,
                    end: time.end,
                    time_set_id: timeSet.id
                };
            }), {
                transaction
            });

            shifts.push(times.map((time): IPeriods => {
                return {
                    id: time.id,
                    start: time.start,
                    end: time.end
                };
            }));
        }

        data.shifts = shifts;

        await this.models.report_card_settings.create({
            id: null,
            comments_course_learner_skills: 1,
            comments_course_learner_traits: 1,
            comments_course_rubric: 1,
            comments_overall: 1,
            comments_segment_aggregator: 1,
            comments_segment_learner_skills: 1,
            comments_segment_learner_traits: 1,
            grades_course_aggregator: 1,
            grades_course_learner_skills: 1,
            grades_course_learner_traits: 1,
            grades_segment_aggregator: 1,
            grades_segment_learner_skills: 1,
            grades_segment_learner_traits: 1,
            signatures_count: 0,
            school_id: query.schoolId,
            report_year_id: year.id,
            report_period_id: null
        }, {
            transaction
        });


        //#region checking active academic year
            let isActive : boolean =false;
            let school = await this.models.school.findById(query.schoolId,{
                transaction
            });
            if(!school.active_report_year){
                school.active_report_year = year.id;
                school.save();
                isActive=true;

                const accountId = me.school.branchId;
                setTimeout(() => {
                    Messages.prepareMessage({header :{id:year.id}, message:{id:year.id}}, +accountId,query.schoolId, 'CREATED', 'activeYear');
                }, 3000);
            }
        //#endregion

        return {yearId : year.id, isActive, academicYear:data.academicYear};
    }
    public async getCountryDays(countryId?: number) {
        let firstDayId = 0;

        if (countryId) {
            const country = await this.models.country.findOne({
                where: {
                    id: countryId
                },
            });

            firstDayId = country.first_day_id;
        }

        const [first, last] = await Promise.all([
            this.models.days.findAll({
                where: {
                    id: {
                        [Op.gte]: firstDayId
                    }
                }
            }),
            this.models.days.findAll({
                where: {
                    id: {
                        [Op.lt]: firstDayId
                    }
                }
            }),
        ]);

        return [...first, ...last];
    }
    public extra(): void {
        this.router.get('/years', async (req: Request, res: Response): Promise<void> => {
            const query = {
                schoolId: req.query.schoolId,
                order: 'ASC'
            };
            let configuredYears = []

            if (query.schoolId) {
                const pyears = await this.models.report_year.findAll({
                    where: {
                        school_id: query.schoolId,
                        disabled: 0
                    }
                });

                configuredYears = pyears.map(({ academic_year_id }): number => academic_year_id);
            }

            const years = await this.models.academic_year.findAll({
                where: {
                    id: {
                        [Op.notIn]: configuredYears
                    },
                    end: {
                        [Op.gte]: new Date().getFullYear()
                    }
                },
                order: [
                    ['start', query.order],
                    ['end', query.order]
                ]
            });

            res.json(years.map(year => ({
                id: year.id,
                name: `${year.start} - ${year.end}`
            })));
        });

        this.router.get('/days', async (req: Request, res: Response): Promise<void> => {
            const days = await this.getCountryDays(req.query.countryId);

            res.json(days);
        });
    }
}
