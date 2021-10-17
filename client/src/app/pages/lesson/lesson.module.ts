import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  MatButtonModule,
  MatRadioModule,
  MatSelectModule,
  MatFormFieldModule,
  MatProgressSpinnerModule
} from '@angular/material';

import { ChipsBlockModule } from 'src/app/components/modals/components/chips-block/chips-block.module';
import { LabelInputModule } from 'src/app/components/modals/components/label-input/label-input.module';
import { SelectInputModule } from 'src/app/components/modals/components/select-input/select-input.module';
import { CheckInputModule } from 'src/app/components/modals/components/check-input/check-input.module';

import { LessonComponent } from './components/lesson-create-page/lesson.component';
import { LessonSubclassesBlockComponent } from './components/lesson-subclasses-block/lesson-subclasses-block.component';
import { LessonSubclassComponent } from './components/lesson-subclass/lesson-subclass.component';

import { LessonService } from './lesson.service';

@NgModule({
  declarations: [
    LessonComponent,
    LessonSubclassesBlockComponent,
    LessonSubclassComponent
  ],
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ChipsBlockModule,
    LabelInputModule,
    SelectInputModule,
    CheckInputModule,

    MatFormFieldModule,
    MatRadioModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  providers: [LessonService]
})
export class LessonModule {}
