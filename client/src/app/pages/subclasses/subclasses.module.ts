import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatProgressSpinnerModule
} from '@angular/material';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TooltipModule } from 'ng2-tooltip-directive';

import { SubclassesComponent } from './component/subclasses.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    DragDropModule,
    TooltipModule
  ],
  declarations: [SubclassesComponent]
})
export class SubclassesModule {}
