import { NgModule } from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import {
  MatButtonModule,
  MatFormFieldModule,
  MatProgressBarModule,
  MatChipsModule,
} from "@angular/material";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";

import { ToggleInputModule } from "../../components/modals/components/toggle-input/toggle-input.module";
import { PopupModule } from 'src/app/components/popup/popup.module';
import { PermissionsComponent } from "./components/permissions.component";

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatChipsModule,
    ReactiveFormsModule,
    FormsModule,
    ToggleInputModule,
    PopupModule
  ],
  providers: [DecimalPipe],
  declarations: [PermissionsComponent],
})
export class PermissionsModule {}
