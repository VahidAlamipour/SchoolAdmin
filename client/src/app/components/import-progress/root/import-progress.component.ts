import { Component } from '@angular/core';

import { ImportProgressService } from '../import-progress.service';
import {
  fadeAnimation,
  importOverlayAnimation
} from 'src/app/animations/animations';

@Component({
  selector: 'import-progress',
  templateUrl: './import-progress.component.html',
  animations: [fadeAnimation, importOverlayAnimation]
})
export class ImportProgressComponent {
  constructor(public service: ImportProgressService) {}

  public clearImport(): void {
    this.service.clearImport();
  }
}
