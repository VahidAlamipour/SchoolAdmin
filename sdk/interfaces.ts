export interface IRole {
    id?: number;
    name: string;
    code?: string;
    role_id?: number;
    subcode?: string;
    branch_id?: number;
    school_id?: number;
}

export interface IProfile {
    id: number;
    name: string;
    surname: string;
    middle_name?: string;
    birthday?: Date;
    msisdn?: string;
    email?: string;
    photo?: string;
    changePassUrl?: string;
    teacher?: {
        education?: string;
        university?: string;
        speciality?: string;
        category?: string;
        graduation_date?: Date;
        refresher_date?: Date;
    };
}

export interface IClass {
    id?: number;
    name: string;
    showName: boolean;
    teacher?: ITeacher;
    teacherId?: number;
    schoolId?: number;
    level?: ILevel;
    levelId?: number;
    segment?: ISegment;
    segmentId?: number;
    studentsCount?: number;
    yearId?: number;
    start?: any;
    end?: any;
}

export interface ILevel {
    id?: number;
    name?: string;
    value?: number;
    segment?: ISegment;
    segmentId?: number;
    classesIds?: number[];
    classesCount?: number;
    studentsCount?: number;
}

export interface ISegment {
    id?: number;
    name: string;
    levels?: number[];
    levelsCount?: number;
    studentsCount?: number;
}

export interface IStructure {
    academicYears: IAcademicYear[];
    segments: ISegment[];
    levels: ILevel[];
    classes: IClass[];
    activeAcademicYear: number;
}

export interface ILevelsStructure {
    levels: ILevel[];
    classes: IClass[];
}

export interface IUser {
    id?: number;
    name: string;
    lastName: string;
    middleName: string;
    msisdn: string;
    email?: string;
    birthday: Date;
    address: string;
    active?: boolean | null;
    gender?: "male" | "female";
    roles?: IRole[];
}

export interface IParent extends IUser {
    familyRole?: "mother" | "father" | "guardian";
    nationality?: string;
    passportBirthCertificate?: string;
    phoneNumber?: string;

    email: string;
    designation?: string;
    company?: string;
    companyAddress?: string;

    parentsStatus?: string;

    students?: IStudent[];
    studentsIds?: number[];
    studentsEmails?: string[];
}

export interface IStudent extends IUser {
    localAddress?: string;
    phoneNumber?: string;
    nationality?: string;
    religion?: string;
    race?: string;
    other?: string;
    passportBirthCertificate?: string;
    educationalClassId?: number;
    educationalClass?: IClass;
    parentsIds?: number[];
    parents?: IParent[];
}

export interface IAdministrator extends IUser {
    schoolsId?: number[];
    schools?: ISchool[];
    types?: string[];
}

export interface ITeacherSubject {
    readonly subject?: ISubject;
    subjectId?: number;
    readonly levels?: ILevel[];
    levelsIds?: number[];
}

export interface IAccountRole {
    isDirector?: boolean;
    isCurriculumDirector?: boolean;
}

export interface ITeacherRole extends IAccountRole {
    readonly homeClass?: IClass[];
    homeClassId?: number;
    teacherSubjects?: ITeacherSubject[];
    readonly headOfSubjects?: ISubject[];
    headOfSubjectsIds?: number[];
    readonly school?: Partial<ISchool>;
    schoolId?: number;
}

export interface ILearnerRoleFromClient {
    school_id: number;
    class_id: number;
}

export interface ILearnerRole {
    class: {
        id: number;
        name: string;
        level: {
            id: number;
            name: string;
        };
    };
    school: {
        id: number;
        name: string;
        city: {
            id: number;
            name: string;
        };
    };
}

export interface ITeacher extends IUser, ITeacherRole {
    education?: string;
    university?: string;
    speciality?: string;
    category?: string;
    graduationYear?: Date;
    trainingYear?: Date;
    readonly types?: string[];
}

export interface ISubject {
    id?: number;
    name: string;
}

export interface IRoom {
    id?: number;
    name: string;
    description: string;
    capacity: number;
    subjects?: ISubject[];
    subjectsIds?: number[];
    teacher?: ITeacher;
    teacherId?: number;
}

export interface ICountry {
    id: number;
    name: string;
}

export interface ICity {
    id?: number;
    name: string;
    schoolsCount?: number;
    countryId?: number;
    readonly country?: ICountry;
}

export interface ITime {
    id?: number;
    isBlocked?: boolean;
    start: string;
    end: string;
}

export interface IShift {
    id?: number;
    name: string;
    range: Partial<ITime>;
    times?: ITime[];
}

export interface IInterval {
    id?: number;
    name: string;
    days: number;
}

export interface ITerm {
    id: number;
    start: Date;
    end: Date;
}

export interface IDay {
    id: number;
    code: string;
    selected?: boolean;
}

export interface ISchoolTimes {
    shifts?: IShift[];
    intervals?: IInterval[];
    terms?: ITerm[];
    days?: IDay[];
}

export interface IAcademicYear extends ISchoolTimes {
    id: number;
    yearId: number;
    name: string;
    start: number;
    end: number;
}

export interface IBranch {
    id: number;
    name: string;
    domain: string;
}

export interface ISchool {
    id?: number;
    name: string;
    fullName?: string;
    readonly city?: ICity;
    cityId?: number;
    adminId?: number[];
    branch?: IBranch;
    image?: IImage;
    active_report_year?: number;
    activeAcademicYear?:number;
    academicYearList?:any;
}

export interface IImage {
    name: string;
    base64: string;
}

export interface IGroup {
    id?: number;
    subject?: ISubject;
    subjectId?: number;
    class?: IClass;
    classId?: number;
    subgroups?: ISubGroup[];
    unassignedStudents?: IStudent[];
    unassignedStudentsCount?: number;
}

export interface ISubGroup {
    id?: number;
    name: string;
    students?: Partial<IStudent>[];
    studentsIds?: number[];
    msg ?:any; 
}

export interface IBaseLesson {
    subjectId: number;
    readonly subject?: ISubject;
    teacherId: number;
    teacherOAuthId?: number;
    readonly teacher?: Partial<ITeacher>;
    roomId: number;
    readonly room?: IRoom;
}

export interface ILessonGroup extends IBaseLesson {
    subGroupId: number;
    readonly subGroup?: ISubGroup;
}

export enum CrossLessons {
    remove,
    ignore,
    break,
}

export interface ICrossLesson {
    subjectName: string;
    time: string;
    date: string;
    id: number;
}

export interface ILesson extends Partial<IBaseLesson> {
    id?: number;
    date?: Date | string;
    academicYearId?: number;
    classId: number;
    readonly class?: IClass;
    timeId: number;
    readonly time?: ITime;
    repeat?: "Once" | "Term" | "Year";
    intervalId?: number;
    groups?: ILessonGroup[];
    readonly lastDate?: Date;
    crossingLessonsMode?: CrossLessons;
}

export interface IStudyDay {
    date: Date;
    lessons: ILesson[];
}

export type EImportTypes = 'educator' | 'learner' | 'parent';

export interface IImportOptions {
    academicYearId?: number;
    academicYearName?: string;
    segmentId?: number;
    segmentName?: string;
    levelId?: number;
    levelName?: string;
    classId?: number;
    className?: string;
}

export interface IImportError {
    line?: number;
    name: string;
    description?: string;
}

export interface IImportResult {
    id: string;
    mode: EImportTypes;
    progress: {
        value: number; // 0-100%
        lines: number; // total lines in doc
        parsed: number;
        notParsed: number;
        errors: IImportError[];
    };
    structure: {
        city: string;
        school: string;
        segment?: string;
        level?: string;
        class?: string;
    };
}

export interface IImportStop {
    importId: string;
}

export interface IPermission extends IUser {
    plagiarism: {
        schoolsId?: number[];
        schools?: ISchool[];
        types?: string[];
    }
    downloadDocument?: boolean;
}

export interface IPlagiarismFeature {
    id: number,
    featureId: number,
    accountId: number,
    lmsId: number,
    isActive: boolean,
    pageCount: number,
    maxPageCount: number,
    quotaBalance: number
}
