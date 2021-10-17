import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { SdkService } from 'src/app/services/sdk.service';
import { EventBrokerService } from 'src/app/services/eventBroker.service';
import { IClass } from '../../../../../../../sdk/interfaces';

@Component({
  selector: 'app-learners-page',
  templateUrl: './learners-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LearnersPageComponent {
  public selectedClass: IClass;
  public learnersTabLabel = 'LEARNERS';
  public subclassesTabLabel = 'SUBCLASSES';

  public navLinks: any[];

  constructor(
    private sdk: SdkService,
    public router: Router,
    private _eventBroker: EventBrokerService
  ) {
    this.navLinks = [
      {
        label: this.learnersTabLabel,
        link: '/learners',
        index: 0
      },
      {
        label: this.subclassesTabLabel,
        link: '/subclasses',
        index: 1
      }
    ];
  }

  // setting tab data
  private setTabData(): void {
    if(this.selectedClass) {
      if (this.selectedClass.showName) {
        this.learnersTabLabel = `LEARNERS OF ${this.selectedClass.name}`;
        this.subclassesTabLabel = `SUBCLASSES OF ${this.selectedClass.name}`;
      } else {
        this.learnersTabLabel = `LEARNERS OF ${this.selectedClass.level.name}${
          this.selectedClass.name
        }`;
        this.subclassesTabLabel = `SUBCLASSES OF ${
          this.selectedClass.level.name
        }${this.selectedClass.name}`;
      }
    }
  }

  public classChange(event: IClass): void {
    const localstorageClassId = +localStorage.getItem('classSelected');
    if (
      event &&
      event.id &&
      localstorageClassId &&
      event.id === localstorageClassId
    ) {
      this.sdk.client
        .getClass(event.id)
        .then(
          classData => (
            (this.selectedClass = classData),
            this.sendEventForReload(true),
            this.setTabData()
          )
        );
    } else {
      this.selectedClass = null;
    }
  }

  public sendEventForReload(value: any, data?: IClass): void {
    const _data = { reload: value, classData: data };
    this._eventBroker.emit<any>('reloadData', Object.assign({}, _data));
  }
}
