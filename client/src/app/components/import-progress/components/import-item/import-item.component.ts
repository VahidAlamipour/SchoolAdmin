import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { ImportModalComponent } from 'src/app/components/modals/import-modal/import-modal.component';
import { ImportProgressService } from '../../import-progress.service';
import { LayoutService } from 'src/app/services/layout.service';
import { fadeAnimation } from 'src/app/animations/animations';
import { ImportItem } from '../../models/interfaces';

@Component({
  selector: 'import-item',
  templateUrl: './import-item.component.html',
  animations: [fadeAnimation]
})
export class ImportItemComponent implements OnInit {
  public mode: string;
  @Input() public data: ImportItem;

  get itemErrors(): number {
    return this.data.progress && this.data.progress.errors
      ? this.data.progress.errors.length
      : 0;
  }

  get itemIsLoaded(): boolean {
    return (this.data.progress && this.data.progress.value === 100) || this.data.progress.isStopped;
  }

  constructor(
    public service: ImportProgressService,
    private dialog: MatDialog,
    private layout: LayoutService
  ) {}

  ngOnInit() {
    this.mode = this.data && this.data.progress.isStopped ? undefined : 'buffer';
  }

  public openImportModal(): void {
    this.layout.blurWrapContainer();
    this.service.controlProgressSize(false);
    const createModal = this.dialog.open(ImportModalComponent, {
      panelClass: ['modal', 'import'],
      restoreFocus: false,
      autoFocus: false,
      data: { type: this.data.mode, structure: null, endMode: true, result: this.data, path: this.getItemPath() }
    });
    createModal.beforeClosed().subscribe({
      next: () => this.layout.unblurWrapContainer()
    });
  }

  public getItemStatus(): string {
    if (this.data.progress.isStopped) {
      return 'stop';
    }
    if (this.itemErrors) {
      return 'error';
    }
    return this.data.progress.value < 100 ? 'load' : 'done';
  }

  public getIconClass(): string {
    if (this.itemErrors) {
      return 'alert-o-icon';
    }
    if (this.data.progress.isStopped) {
      return 'done-o-icon';
    }
    return this.data.progress.value < 100 ? 'load-icon' : 'done-o-icon';
  }

  public getItemPath(): string {
    return Object.values(this.data.structure)
      .filter(item => !!item)
      .join(' > ');
  }

  public stopImport(): void {
    this.mode = undefined;
    this.service.stopItemImport(this.data);
  }
}
