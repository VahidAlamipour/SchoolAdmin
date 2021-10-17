import { CONFIG } from 'src/app/config';

export const FULLDATE_FORMAT = {
  parse: {
    dateInput: CONFIG.VIEW_DATE_FORMAT
  },
  display: {
    dateInput: CONFIG.VIEW_DATE_FORMAT,
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};
export const YEAR_FORMAT = {
  parse: {
    dateInput: 'YYYY'
  },
  display: {
    dateInput: 'YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};
