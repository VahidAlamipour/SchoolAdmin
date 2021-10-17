import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material';

import { TestComponent } from './component/test.component';

@NgModule({
  imports: [CommonModule, MatButtonModule],
  declarations: [TestComponent]
})
export class TestModule {}
