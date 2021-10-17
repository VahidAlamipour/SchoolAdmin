import { BrowserModule } from '@angular/platform-browser';
import {
  NgModule,
  APP_INITIALIZER,
  ErrorHandler,
  Injectable
} from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ROUTER } from './router/app.router';
import { LoginModule } from './pages/login/login.module';
import { LayoutModule } from './layouts/layouts.module';
import { DashboardModule } from './pages/dashboard/dashboard.module';
import { LearnersModule } from './pages/learners/learners.module';
import { ParentsModule } from './pages/parents/parents.module';
import { EducatorsModule } from './pages/educators/educators.module';
import { FacilitiesModule } from './pages/facilities/facilities.module';
import { RolesModule } from './pages/roles/roles.module';
import { SubclassesModule } from './pages/subclasses/subclasses.module';
import { CoursesModule } from './pages/courses/courses.module';
import { SBModule } from './pages/institutions/institutions.module';

import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { SelectGuard } from './auth/select.guard';
import { AppInitService } from './services/init.service';
import { EventBrokerService } from './services/eventBroker.service';
import { TimetableModule } from './pages/timetable/timetable.module';
import { LessonModule } from './pages/lesson/lesson.module';
import { TestModule } from './pages/test/test.module';
import { StaffModule } from './pages/staff/staff.module';

import { NotFoundComponent } from './pages/not-found/not-found.component';
import { InstitutionModule } from './pages/institution/institution.module';
import { ProfileModule } from './pages/profile/profile.module';
import { PermissionsModule } from './pages/permissions/permissions.module';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  constructor() {}
  handleError(error) {
    console.log(error);
    throw error;
  }
}

export function init_app(appLoadService: AppInitService) {
  return () => appLoadService.initializeApp();
}

@NgModule({
  declarations: [AppComponent, NotFoundComponent],
  imports: [
    ROUTER,
    BrowserAnimationsModule,
    HttpClientModule,
    BrowserModule,
    LayoutModule,
    LoginModule,
    DashboardModule,
    LearnersModule,
    ParentsModule,
    EducatorsModule,
    FacilitiesModule,
    RolesModule,
    SubclassesModule,
    CoursesModule,
    TimetableModule,
    LessonModule,
    SBModule,
    InstitutionModule,
    TestModule,
    StaffModule,
    ProfileModule,
    PermissionsModule
  ],
  providers: [
    AuthService,
    AuthGuard,
    RolesGuard,
    SelectGuard,
    AppInitService,
    EventBrokerService,
    {
      provide: APP_INITIALIZER,
      useFactory: init_app,
      deps: [AppInitService],
      multi: true
    },
    { provide: ErrorHandler, useClass: ErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
