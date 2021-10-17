import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EducatorsComponent } from './component/educators.component';

const MODULE_ROUTES: Routes = [
  {
    path: 'educators',
    component: EducatorsComponent
  },
  {
    path: 'educators/**',
    redirectTo: 'educators'
  }
];

export const EDUCATORS_ROUTES: ModuleWithProviders = RouterModule.forChild(
  MODULE_ROUTES
);
