import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';
import { EMPTY } from 'rxjs';
import { tap } from 'rxjs/operators';

import { fadeAnimation } from 'src/app/animations/animations';
import { AddDataModalService } from '../../services/add-data-modal.service';

@Component({
  selector: 'app-add-data-list',
  templateUrl: './add-data-list.component.html',
  animations: [fadeAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddDataListComponent implements OnDestroy {
  @Input()
  public name: string;
  @Input()
  public classId: string;

  public searchString = '';
  public data: any[] = [];
  public scrollCallback: any;

  get selectedInstitutionId(): number {
    return +this.getItemFromLocalstorage('Institution');
  }

  constructor(public service: AddDataModalService) {
    this.service.loadingSubject.next(true);
    this.scrollCallback = this.getData.bind(this);
  }

  public getData(reload?: boolean): any {
    console.log("injsSDK: ",this.classId);
    if (reload) {
      this.service.currentPage = 0;
      this.data = [];
      this.service.сountSubject.next(0);
      return this.service
        .loadData(this.name, {
          limit: 20,
          page: this.service.currentPage,
          query: this.searchString,
          ...(this.selectedInstitutionId
            ? { schoolId: this.selectedInstitutionId }
            : null),
          ...({disabled:0}),
          classId:Number(this.classId)
        })
        .pipe(tap(this.processData))
        .subscribe(null);
    }
    return this.service.currentPage > this.service.сountSubject.value
      ? EMPTY
      : this.service
          .loadData(this.name, {
            limit: 20,
            page: this.service.currentPage,
            query: this.searchString,
            ...(this.selectedInstitutionId
              ? { schoolId: this.selectedInstitutionId }
              : null),
              ...({disabled:0}),
              classId:Number(this.classId)
          })
          .pipe(tap(this.processData));
  }

  private processData = (data: any) => {
    this.service.currentPage++;
    this.service.сountSubject.next(data.pages);
    this.data = this.data.concat(data.list);
    this.service.loadingSubject.next(false);
  }

  public isItemSelected(item: any): boolean {
    return this.service.selectedItems.some(
      selectedItem => selectedItem.id === item.id
    );
  }

  public itemClick(item: any): void {
    if (this.isItemSelected(item)) {
      const index = this.service.selectedItems.findIndex(
        sitem => sitem.id === item.id
      );
      this.service.selectedItems.splice(index, 1);
    } else {
      this.service.selectedItems.push(item);
    }
  }

  private getItemFromLocalstorage(itemName: string): string {
    const localName =
      'auto' + itemName.replace(/^\w/, c => c.toUpperCase()) + 'IdSelected';
    return localStorage.getItem(localName);
  }

  ngOnDestroy() {
    this.service.currentPage = 0;
  }
}
