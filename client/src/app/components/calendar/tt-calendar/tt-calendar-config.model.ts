import { ICalendar, ICalendarInternal } from '../common/models/calendar.model';
import { WeekDays } from '../common/types/week-days.type';
import { Moment } from 'moment';
import { ECalendarValue } from '../common/types/calendar-value-enum';

export interface IConfig {
  isDayDisabledCallback?: (date: Moment) => boolean;
  isMonthDisabledCallback?: (date: Moment) => boolean;
  weekDayFormat?: string;
  weekDayFormatter?: (dayIndex: number) => string;
  firstDayOfWeek?: WeekDays;
  format?: string;
  allowMultiSelect?: boolean;
  monthFormat?: string;
  monthFormatter?: (month: Moment) => string;
  yearFormat?: string;
  yearFormatter?: (year: Moment) => string;
  dayBtnFormat?: string;
  dayBtnFormatter?: (day: Moment) => string;
  dayBtnCssClassCallback?: (day: Moment) => string;
  monthBtnFormat?: string;
  monthBtnFormatter?: (day: Moment) => string;
  monthBtnCssClassCallback?: (day: Moment) => string;
  returnedValueType?: ECalendarValue;
  unSelectOnClick?: boolean;
}

export interface IDayCalendarConfig extends IConfig, ICalendar {}

export interface IDayCalendarConfigInternal
  extends IConfig,
    ICalendarInternal {}
