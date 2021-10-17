import {
  IUser,
  IStudent,
  ISchool,
  ITeacherRole,
  IAccountRole
} from '../../../../../../sdk/interfaces';

export interface UserRoles {
  user: Partial<IUser>;
  students: IStudent[];
  adminRoles: {
    name: string;
    school: Partial<ISchool>;
  }[];
  teacherRoles: ITeacherRole[];
  accountRoles: IAccountRole;
  isAccountAdministrator?: boolean;
}

export interface UserRoleElement {
  title: string;
  code: string;
  roles: any[];
}
