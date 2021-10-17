import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ParentsComponent } from './component/parents.component';

const MODULE_ROUTES: Routes = [
  {
    path: 'parents',
    component: ParentsComponent
  }
];

export const PARENTS_ROUTES: ModuleWithProviders = RouterModule.forChild(
  MODULE_ROUTES
);
