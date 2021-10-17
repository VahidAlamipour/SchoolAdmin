import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import io from "socket.io-client";

import {
    IAcademicYear, IAdministrator,
    ICity, IClass, ICountry, IDay, IGroup, ILesson,
    ILevel, ILevelsStructure, IParent, IRoom, ISchool,
    ISegment, IStructure, IStudent, IStudyDay,
    ISubGroup, ISubject, ITeacher, ITeacherRole, IUser, IAccountRole,
    EImportTypes, IImportOptions, ICrossLesson, IProfile, IPlagiarismFeature
} from "./interfaces";

export interface IPageQuery {
    query?: string;
    page?: number;
    limit?: number;
    order?: "desc" | "asc" | "";
    exclude?: number[];
    currentAndFuture?: boolean;
}

export interface IPageResponse<T> {
    page: number;
    pages: number;
    list: T[];
    count:any;
}

interface ISchoolQuery {
    schoolId: number;
}

const METHODS = {
    POST: "post",
    PUT: "put",
    DELETE: "delete",
};

export class SDK {
    public options: AxiosRequestConfig;
    public socket: any;

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    constructor(options: AxiosRequestConfig = {}, socketOptions: any = {}) {
        this.options = options;
        this.socket = io(socketOptions.url, socketOptions);
    }

    public async request(options: AxiosRequestConfig) {
        return axios({
            ...this.options,
            ...options,
            validateStatus: () => true,
        }).then((res) => {
            return this.processResponse(res);
        });
    }

    public processResponse(res: AxiosResponse) {
        if (res.status < 400) {
            return res.data;
        } else {
            return this.processError(res);
        }
    }

    public processError(res: AxiosResponse) {
        throw new Error(`HTTP ERROR: [${res.status}] ${res.data || res.statusText}`);
    }

    public async getVersion() {
        return this.request({
            url: "/health",
        }).then((res) => res.version);
    }

    public async getAdmins(params?: IPageQuery & Partial<ISchoolQuery> & {
        type?: string;
    }): Promise<IPageResponse<IAdministrator>> {
        return this.request({
            params,
            url: "/admins",
        });
    }

    public async getStaffRoles(params?: IPageQuery): Promise<string[]> {
        return this.request({
            params,
            url: "/admins/roles",
        }).then(({ rows }) => rows);
    }

    public async newAdmin(data: IAdministrator): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/admins",
        });
    }

    public async getAdmin(id: number): Promise<IAdministrator> {
        return this.request({
            url: `/admins/${id}`,
        });
    }

    public async updateAdmin(id: number, data: IAdministrator) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/admins/${id}`,
        });
    }

    public async deleteAdmin(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/admins/${id}`,
        });
    }

    public async getParents(params?: IPageQuery & { classId?: number; schoolId?: number }): Promise<IPageResponse<IParent>> {
        return this.request({
            params,
            url: "/parents",
        });
    }

    public async newParent(data: IParent): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/parents",
        });
    }

    public async getParent(id: number): Promise<IParent> {
        return this.request({
            url: `/parents/${id}`,
        });
    }

    public async updateParent(id: number, data: IParent) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/parents/${id}`,
        });
    }

    public async deleteParent(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/parents/${id}`,
        });
    }

    public async getStudents(params?: IPageQuery & { classId?: number }): Promise<IPageResponse<IStudent>> {
        return this.request({
            params,
            url: "/students",
        });
    }
    public async getStudent(id: number): Promise<IStudent> {
        return this.request({
            url: `/students/${id}`,
        });
    }

    public async newStudent(data: IStudent): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/students",
        });
    }

    public async updateStudent(id: number, data: IStudent) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/students/${id}`,
        });
    }

    public async deleteStudent(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/students/${id}`,
        });
    }

    public async getRooms(params?: IPageQuery & {
        subject?: number;
        schoolId?: number;
    }): Promise<IPageResponse<IRoom>> {
        return this.request({
            params,
            url: "/rooms",
        });
    }

    public async getRoom(id: number): Promise<IRoom> {
        return this.request({
            url: `/rooms/${id}`,
        });
    }

    public async updateRoom(id: number, data: IRoom): Promise<IRoom> {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/rooms/${id}`,
        });
    }

    public async deleteRoom(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/rooms/${id}`,
        });
    }

    public async newRoom(data: IRoom): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/rooms",
        });
    }

    public async newSegment(data: ISegment): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/segments",
        });
    }

    public async getSegments(params?: IPageQuery & { schoolId?: number }): Promise<IPageResponse<ISegment>> {
        return this.request({
            params,
            url: "/segments",
        });
    }

    public async getSegment(id: number): Promise<ISegment> {
        return this.request({
            url: `/segments/${id}`,
        });
    }

    public async updateSegment(id: number, data: ISegment) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/segments/${id}`,
        });
    }

    public async deleteSegment(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/segments/${id}`,
        });
    }

    public async newLevel(data: ILevel): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/levels",
        });
    }

    public async getLevelsValues(params?: { segmentId?: number }): Promise<{ id: number; name: string }[]> {
        return this.request({
            params,
            url: "/levels/values",
        });
    }

    public async getLevels(params?: IPageQuery & {
        segmentId?: number;
    }): Promise<IPageResponse<ILevel>> {
        return this.request({
            params,
            url: "/levels",
        });
    }

    public async getLevel(id: number): Promise<ILevel> {
        return this.request({
            url: `/levels/${id}`,
        });
    }

    public async updateLevel(id: number, data: ILevel) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/levels/${id}`,
        });
    }

    public async deleteLevel(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/levels/${id}`,
        });
    }

    public async newClass(data: IClass): Promise<number> {
        return axios({
            ...this.options,
            ...{
                data,
                method: METHODS.POST,
                url: "/classes",
            },
            validateStatus: () => true,
        }).then((res) => {
            if (res.status < 400) {
                return res.data;
            } else if (res.status == 409){
                res.data = 'Class name already exists. Please insert a different class name.';
                return this.processError(res);
            }else {
                return this.processError(res);
            }
        });
        /*return this.request({
            data,
            method: METHODS.POST,
            url: "/classes",
        });*/
    }

    public async getClasses(params?: IPageQuery & {
        levelId?: number;
        schoolId?: number;
        forParents?: boolean;
        yearId?: number
    }): Promise<IPageResponse<IClass>> {
        return this.request({
            params,
            url: "/classes",
        });
    }

    public async getClass(id: number): Promise<IClass> {
        return this.request({
            url: `/classes/${id}`,
        });
    }

    public async updateClass(id: number, data: IClass) {
        return axios({
            ...this.options,
            ...{
                data,
                method: METHODS.PUT,
                url: `/classes/${id}`,
            },
            validateStatus: () => true,
        }).then((res) => {
            if (res.status < 400) {
                return res.data;
            } else if (res.status == 409){
                res.data = 'Class name already exists. Please insert a different class name.';
                return this.processError(res);
            }else {
                return this.processError(res);
            }
        });
        /*
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/classes/${id}`,
        });*/
    }

    public async deleteClass(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/classes/${id}`,
        });
    }

    public async newGroup(data: IGroup): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/groups",
        });
    }

    public async getGroups(params?: IPageQuery & {
        classId: number;
        subjectId?: number;
    }): Promise<IPageResponse<IGroup>> {
        return this.request({
            params,
            url: "/groups",
        });
    }

    public async getGroup(id: number): Promise<IGroup> {
        return this.request({
            url: `/groups/${id}`,
        });
    }

    public async getSubGroup(id: number): Promise<ISubGroup> {
        return this.request({
            url: `/subgroups/${id}`,
        });
    }

    public async updateGroup(id: number, data: Partial<IGroup>) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/groups/${id}`,
        });
    }

    public async deleteGroup(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/groups/${id}`,
        });
    }

    public async getCountries(params?: IPageQuery): Promise<IPageResponse<ICountry>> {
        return this.request({
            params,
            url: "/countries",
        });
    }

    public async newCity(data: ICity): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/cities",
        });
    }

    public async getCities(params?: IPageQuery & { countryId?: number }): Promise<IPageResponse<ICity>> {
        return this.request({
            params,
            url: "/cities",
        });
    }

    public async getYears(params?: Partial<ISchoolQuery>): Promise<{ id: number; name: string }[]> {
        return this.request({
            params,
            url: `/academic-years/years`,
        });
    }

    public async getDays(params?: { countryId?: number }): Promise<IDay[]> {
        return this.request({
            params,
            url: `/academic-years/days`,
        });
    }

    public async newAcademicYear(params: ISchoolQuery, data: {
        yearId: number;
        daysIds: number[];
        shifts: {
            times: {
                start: string;
                end: string;
            }[];
        }[];
        periods: {
            startDate: string;
            endDate: string;
        }[];
        duplicatedYearId?: number
    }): Promise<any> {
        return this.request({
            params,
            data,
            method: METHODS.POST,
            url: "/academic-years",
        });
    }

    public async updateAcademicYear(params: ISchoolQuery, data: any): Promise<void> {
        return this.request({
            params,
            data,
            method: METHODS.PUT,
            url: `/academic-years/${data.id}`,
        });
    }


    public async getAcademicYears(params: IPageQuery
        & Partial<ISchoolQuery>
        | {
            shiftId?: number;
            classId: number;
            date: Date;
            id?: number;
        }): Promise<IPageResponse<IAcademicYear>> {
        return this.request({
            params,
            url: "/academic-years",
        });
    }

    public async getAcademicYear(id: number): Promise<IAcademicYear> {
        return this.request({
            url: `/academic-years/${id}`,
        });
    }

    public async newSchool(data: ISchool): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/schools",
        });
    }

    public async getSchool(id: number): Promise<ISchool> {
        return this.request({
            url: `/schools/${id}`,
        });
    }

    public async getSchools(params?: IPageQuery & { cityId?: number }): Promise<IPageResponse<ISchool>> {
        return this.request({
            params,
            url: "/schools",
        });
    }

    public async updateSchool(id: number, data: Partial<ISchool>) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/schools/${id}`,
        });
    }

    public async deleteSchool(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/schools/${id}`,
        });
    }
    public async newSubject(data: ISubject): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/subjects",
        });
    }

    public async getSubjects(params?: IPageQuery & {
        schoolId?: number;
    }): Promise<IPageResponse<ISubject>> {
        return this.request({
            params,
            url: "/subjects",
        });
    }

    public async getSubject(id: number): Promise<ISubject> {
        return this.request({
            url: `/subjects/${id}`,
        });
    }

    public async updateSubject(id: number, data: Partial<ISubject>) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/subjects/${id}`,
        });
    }

    public async deleteSubject(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/subjects/${id}`,
        });
    }

    public async newLesson(data: ILesson): Promise<ICrossLesson[]> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/lessons",
        });
    }

    public async getLessons(params?: IPageQuery & {
        classId: number;
        startDate?: string;
        endDate?: string;
        shiftId?: number;
        academicYearId: number;
    }): Promise<IStudyDay[]> {
        return this.request({
            params,
            url: "/lessons",
        }).then((res) => res.list);
    }

    public async getLessonsCount(params?: IPageQuery & {
        classId?: number;
        startDate?: string;
        endDate?: string;
        shiftId?: number;
        academicYearId: number;
    }): Promise<{ rows: any[]; count: number }>{
        return this.request({
            params,
            url: "/lessons",
        }).then((res) => res);
    }
    
    public async getLesson(id: number, params: {
        date: Date;
        academicYearId: number;
    }): Promise<ILesson> {
        return this.request({
            params,
            url: `/lessons/${id}`,
        });
    }

    public async updateLesson(id: number, data: Partial<ILesson>, params?: { date: Date; all: boolean }) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/lessons/${id}`,
            params,
        });
    }

    public async deleteLesson(id: number, params?: { date: Date; all: boolean }) {
        return this.request({
            method: METHODS.DELETE,
            url: `/lessons/${id}`,
            params,
        });
    }

    public async getTeachers(params?: IPageQuery & {
        type?: string;
        schoolId?: number;
        subjectId?: number;
        levelId?: number;
        yearId?: number;
        disabled?: number;
    }): Promise<IPageResponse<ITeacher>> {
        return this.request({
            params,
            url: "/teachers",
        });
    }

    public async getTeachersRoles(params?: IPageQuery): Promise<string[]> {
        return this.request({
            params,
            url: "/teachers/roles",
        }).then(({ rows }) => rows);
    }

    public async newTeacher(data: ITeacher): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: "/teachers",
        });
    }

    public async getTeacher(id: number): Promise<ITeacher> {
        return this.request({
            url: `/teachers/${id}`,
        });
    }

    public async updateTeacher(id: number, data: ITeacher) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/teachers/${id}`,
        });
    }

    public async deleteTeacher(id: number) {
        return this.request({
            method: METHODS.DELETE,
            url: `/teachers/${id}`,
        });
    }

    public async getSchoolStructure(params ?:boolean): Promise<IStructure> {
        return this.request({
            params,
            url: "/school/structure",
        });
    }

    public async getSchoolLevelsStructure(): Promise<ILevelsStructure> {
        return this.request({
            url: "/school/structure/levels",
        });
    }

    public async activateUser(id: number) {
        return this.request({
            method: METHODS.POST,
            url: `/users/${id}/activate`,
        });
    }

    public async deactivateUser(id: number) {
        return this.request({
            method: METHODS.POST,
            url: `/users/${id}/deactivate`,
        });
    }
    public async activationUserInSchool(id: number, data: {
        role: string;
    }) {
        return this.request({
            data,
            method: METHODS.POST,
            url: `/users/${id}/activationInSchool`,
        });
    }

    public async updateUserRoles(id: number, data: {
        studentsIds: number[];
        adminSchoolsIds?: number[];
        teacherRoles: ITeacherRole[];
        accountRole?: IAccountRole;
    }) {
        return this.request({
            data,
            method: METHODS.PUT,
            url: `/users/${id}/roles`,
        });
    }

    public async getUserRoles(id: number): Promise<{
        user: Partial<IUser>;
        students: IStudent[];
        adminRoles: { name: string; school: Partial<ISchool> }[];
        teacherRoles: ITeacherRole[];
        accountRoles: IAccountRole;
        isAccountAdministrator?: boolean;
    }> {
        return this.request({
            url: `/users/${id}/roles`,
        });
    }

    public async getMe(): Promise<Partial<IUser> & {
        school: ISchool;
        access: {
            isSuperAdmin: boolean;
            schoolsId: number[];
            allSchool:number[];
        };
        interfaces: {
            [codename: string]: string;
        };
    }> {
        return this.request({
            url: `/users/me`,
        });
    }

    public async getProfile(): Promise<IProfile> {
        return this.request({
            url: `/users/profile`,
        });
    }

    public async import(type: EImportTypes, data: any): Promise<number> {
        return this.request({
            data,
            method: METHODS.POST,
            url: `/import/${type}`,
        });
    }

    // public async testPermissionApi(params?: IPageQuery): Promise<any> {
    //     return this.request({
    //         params,
    //         url: "/permissions/test",
    //     }).then(({rows}) => rows);
    // }

    public async getPermission(params?: IPageQuery): Promise<any> {
        const userDataRes = localStorage.getItem('userData');
        let userData = { school: { branchId: 0 } };
        if (userDataRes) userData = JSON.parse(userDataRes.toString());
        return this.request({
            params,
            url: `/permissions/all`,
        }).then((data) => data);
    }

    public async setPermissions(data:
        { plagiarism: IPlagiarismFeature, downloadDocument: Boolean })
        : Promise<number> {
        const userDataRes = localStorage.getItem('userData');
        let userData = { school: { branchId: 0 } };
        if (userDataRes) userData = JSON.parse(userDataRes.toString());

        return this.request({
            data,
            method: METHODS.PUT,
            url: `/permissions/${userData && userData.school ? userData.school.branchId : 0}`,
        });
    }
}
