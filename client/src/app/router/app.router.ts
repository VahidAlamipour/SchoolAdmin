import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from '../layouts/main/layout.component';
import { LoginLayoutComponent } from '../layouts/login/login.component';

import { AuthGuard } from '../auth/auth.guard';
import { DevEnvGuard } from '../auth/dev.guard';
import { SelectGuard } from '../auth/select.guard';
import { RolesGuard } from '../auth/roles.guard';

import { RolesPreloadService } from '../pages/roles/services/roles-preload.service';
import { DashboardComponent } from '../pages/dashboard/component/dashboard.component';
import { RolesComponent } from '../pages/roles/root/roles.component';
import { FacilitiesComponent } from '../pages/facilities/component/facilities.component';
import { ParentsComponent } from '../pages/parents/component/parents.component';
import { EducatorsComponent } from '../pages/educators/component/educators.component';
import { StartPageComponent } from '../pages/login/start-page/start-page.component';
import { NoAccessPageComponent } from '../pages/login/no-access/no-access.component';
import { StartSelectComponent } from '../pages/login/start-select/start-select.component';
import { LearnersPageComponent } from '../pages/learners/components/page/learners-page.component';
import { LearnersSubclassesComponent } from '../pages/learners/components/subclasses/learners-subclasses.component';
import { LearnersTableComponent } from '../pages/learners/components/learners/learners-table.component';
import { SubclassesComponent } from '../pages/subclasses/component/subclasses.component';
import { CoursesComponent } from '../pages/courses/component/courses.component';
import { TimetableComponent } from '../pages/timetable/component/timetable.component';
import { LessonComponent } from '../pages/lesson/components/lesson-create-page/lesson.component';
import { InstitutionsComponent } from '../pages/institutions/component/institutions.component';
import { StaffComponent } from '../pages/staff/component/staff.component';
import { InstitutionComponent } from '../pages/institution/component/institution.component';
import { TestComponent } from '../pages/test/component/test.component';
import { ProfileComponent } from '../pages/profile/component/profile.component';
import { PermissionsComponent } from '../pages/permissions/components/permissions.component';

const APP_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, SelectGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: '',
        component: LearnersPageComponent,
        children: [
          {
            path: 'learners',
            component: LearnersTableComponent
          },
          {
            path: 'subclasses',
            component: LearnersSubclassesComponent
          }
        ]
      },
      {
        path: 'subclasses/:id',
        component: SubclassesComponent
      },
      {
        path: 'parents',
        component: ParentsComponent
      },
      {
        path: 'educators',
        component: EducatorsComponent
      },
      {
        path: 'educators/**',
        redirectTo: 'educators'
      },
      {
        path: ':pageMode/:id/roles',
        component: RolesComponent,
        runGuardsAndResolvers: 'always',
        resolve: { preload: RolesPreloadService }
      },
      {
        path: 'timetable',
        component: TimetableComponent
      },
      {
        path: 'timetable/:classId/:date',
        component: LessonComponent
      },
      {
        path: 'timetable/:classId/:date/:lessonId',
        component: LessonComponent
      },
      {
        path: 'facilities',
        component: FacilitiesComponent
      },
      {
        path: 'courses',
        component: CoursesComponent
      },
      {
        path: 'administrator',
        component: StaffComponent,
        canActivate: [RolesGuard]
      },
      {
        path: 'institutions',
        component: InstitutionsComponent,
        canActivate: [RolesGuard]
      },
      {
        path: 'institution',
        component: InstitutionComponent
      },
      {
        path: 'institution/:id',
        component: InstitutionComponent,
        canActivate: [RolesGuard]
      },
      {
        path: 'test',
        component: TestComponent,
        canLoad: [DevEnvGuard]
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'permissions',
        component: PermissionsComponent
      },
    ]
  },
  {
    path: 'select',
    component: StartSelectComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '',
    component: LoginLayoutComponent,
    children: [
      {
        path: 'start',
        component: StartPageComponent
      },
      {
        path: 'noaccess',
        component: NoAccessPageComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
    // component: NotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(APP_ROUTES, { onSameUrlNavigation: 'reload' })
  ],
  exports: [RouterModule]
})
export class ROUTER {}
