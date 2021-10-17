import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';

import { PopupData } from 'src/app/models/interfaces.model';
import { CONFIG } from 'src/app/config';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html'
})
export class PopupComponent implements OnInit {
  @Input() data: any;
  @Input() position = 'right';
  public popupData: PopupData = {};

  constructor() {}

  ngOnInit() {
    if (this.data.birthday && this.data.birthday !== '0000-00-00') {
      this.popupData.birthday = moment(this.data.birthday).format(
        CONFIG.VIEW_DATE_FORMAT
      );
    }
    if (this.data.gender) {
      this.popupData.gender = this.data.gender;
    }
    if (this.data.address) {
      this.popupData.address = this.data.address;
    }

    if (this.data.teacher) {
      this.popupData.educator = this.data.teacher;
    }
    if (this.data.room) {
      this.popupData.facility = this.data.room.name;
    }
    if (this.data.general) {
      this.popupData.general = this.data.general;
    }
  }
}
