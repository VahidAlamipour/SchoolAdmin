import { ICity, ISchool, IUser } from '../../../../sdk/interfaces';

export interface InstitutionSelectorData {
  name: string;
  opened: boolean;
  itemsArray: Array<ICity | ISchool>;
  filteredArray: Array<ICity | ISchool>;
}

export interface UserData extends Partial<IUser> {
  institution?: ISchool;
  interfaces: any;
}

export interface PopupData {
  birthday?: string;
  address?: string;
  gender?: string;
  facility?: string;
  educator?: IUser;
  general?: string;
}

// Evenet broker

export interface IEventListener {
  ignore(): void;
}

export interface IBrokeredEventBase {
  name: string;
  emit(data: any): void;
  listen(next: (data: any) => void): IEventListener;
}

export interface IBrokeredEvent<T> extends IBrokeredEventBase {
  emit(data: any): void;
  listen(next: (data: any) => void): IEventListener;
}

// School/Branch

export interface ISBModal {
  title: string;
  saveButtonText: string;
  data?: ISchool;
}

// School/Branch modal

export interface TermsDates {
  startDate: Date | string;
  endDate: Date | string;
}

export interface Shift {
  name: string;
  id?: number;
  timesList: ShiftTime[];
}

export interface ShiftTime {
  start: string;
  end: string;
  id?: number | string;
  clientId?: number | string;
  isDuplicate?: boolean;
  isBlocked?: boolean;
}

export interface AcademicYear {
  yearId: number;
  daysIds: number[];
  shifts: Array<any>;
  periods: Array<{
    startDate: string;
    endDate: string;
  }>;
  duplicatedYearId?:number
}
