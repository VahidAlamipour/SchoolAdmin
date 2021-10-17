import {
  Component,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core';
import {
  trigger,
  transition,
  style,
  animate,
  state
} from '@angular/animations';
import * as _ from 'lodash';

import { LayoutService } from 'src/app/services/layout.service';
import { SLCService } from '../../slc-selector/slc-selector.service';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  animations: [
    trigger('dropdownAction', [
      state(
        'void',
        style({
          transform: 'scaleY(0.8)',
          minWidth: '100%',
          opacity: 0
        })
      ),
      state(
        'showing',
        style({
          opacity: 1,
          minWidth: 'calc(100% + 32px)',
          transform: 'scaleY(1)'
        })
      ),
      state(
        'showing-multiple',
        style({
          opacity: 1,
          minWidth: 'calc(100% + 64px)',
          transform: 'scaleY(1)'
        })
      ),
      transition('void => *', animate('120ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void',
        animate('100ms 25ms linear', style({ opacity: 0 }))
      )
    ])
  ]
})
export class DropdownComponent implements OnChanges {
  @Input()
  public learnerObject?: boolean;
  @Input()
  public data: any[];
  @Input()
  public levels: any[];
  @Input()
  public name: string;
  @Input()
  public editable = true;
  @Input()
  public activeyear: number;
  @Output()
  public init: EventEmitter<any> = new EventEmitter<any>();
  @Output()
  public edit: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  public reselect: EventEmitter<any> = new EventEmitter<any>();

  public item: Object;
  public selectedItem: any;
  public dropdownOpened = false;

  public levelName: string;

  constructor(private layout: LayoutService, private service: SLCService) {}


  ngOnChanges(changes: SimpleChanges) {

    let prev = [];
    let curr = [];
    let firstChange: boolean;
    if (changes && changes.data && !changes.data.firstChange) {
      prev = changes.data.previousValue;
      curr = changes.data.currentValue;
      if (prev && curr) {
        firstChange = curr.length - prev.length > 1;
      }
    }

    // if delete
    if (prev.length - curr.length === 1 && !firstChange) {
      localStorage.removeItem(this.name + 'Selected');
    }
    // if added new
    if (curr.length - prev.length === 1 && !firstChange) {
      const difference = _.differenceBy(curr, prev, 'id');
      if(this.name != 'timetableYear' && this.name != 'year'){
        this.setItemToLocalstorage(this.name, difference[0].id);
      }
      this.reselect.emit(this.selectedItem);
    }
    const itemIdInLocalstorage = this.getItemFromLocalstorage(this.name);
    if (this.data && this.data.length !== 0) {
      this.data.forEach(element => {
        if (element.id.toString() === itemIdInLocalstorage) {
          const index = this.data.findIndex(x => x.id === element.id);
          this.selectedItem = this.data[index];
          this.init.emit(this.selectedItem);
        }
      });
      if (!itemIdInLocalstorage && (changes.data && curr.length !== 0)) {
        this.selectedItem = this.data[0];
        this.setItemToLocalstorage(this.name, this.selectedItem.id);
        this.init.emit(this.selectedItem);
      }
    }
    if (this.selectedItem && this.levels && this.name === 'class') {
      this.getLevelByClassId(this.selectedItem.levelId);
    }
    if (
      this.name === 'class' &&
      changes.levels &&
      changes.levels.currentValue.length === 0
    ) {
      this.data = [];
    }

  }

  // getting level name by levelId in class
  public getLevelByClassId(classLevelId: number): void {
    this.levels.forEach(level => {
      if (classLevelId === level.id) {
        this.levelName = level.name;
      }
    });
  }

  public onClick(target): void {
    if (!target.className.includes('edit-icon')) {
      this.dropdownOpened = true;
      this.layout.contentCanScroll(false);
    }
  }

  public onEditClick(): void {
    this.edit.emit(this.selectedItem);
  }

  public selectDropdownItem(item: Object, index: number): void {
    this.selectedItem = this.data[index];
    this.setItemToLocalstorage(this.name, this.selectedItem.id);
    this.closeDropdown();
    this.reselect.emit(this.selectedItem);
  }

  public closeDropdown(): void {
    this.dropdownOpened = false;
    this.layout.contentCanScroll(true);
  }

  public itemTitle(item: any): string {
    let string = '';
    if (item) {
      if (item.name) {
        string = item.name;
      }
      if (this.name === 'class' && !item.showName) {
        string = this.levelName + item.name;
      }
      if (this.name === 'timetableLevel') {
        string = `${item.name ? item.name : null} Level (${
          item.segment ? item.segment.name : null
        })`;
      }
      if (this.name === 'timetableClasses') {
        if (!item.showName) {
          string = `${item.level.name}${item.name} class`;
        } else {
          string = `${item.name} class`;
        }
      }
    }
    return `<span> ${string} </span>`;
  }

  public itemInfo(item: any): string {
    let string = '';
    if (item) {
      if (this.name === 'segment') {
        string =
          item.levelsCount + ' levels (' + item.studentsCount + ' learners)';
      }
      if (this.name === 'level') {
        string =
          item.classesCount + ' classes (' + item.studentsCount + ' learners)';
      }
      if (this.name === 'timetableLevel') {
        string =
          item.classesCount + ' classes (' + item.studentsCount + ' learners)';
      }
      if (this.name === 'class' || this.name === 'timetableClasses') {
        if (item.teacher) {
          string = `Homeroom educator: ${item.teacher.name}
        ${item.teacher.lastName} </span><span>
        (${item.studentsCount} learners)`;
        } else {
          string = '(' + item.studentsCount + ' learners)';
        }
      }
    }
    return `<span> ${string} </span>`;
  }

  public itemName(name: any): string {
    if (this.name === 'timetableLevel') {
      return 'level';
    }
    if (this.name === 'timetableClasses') {
      return 'class';
    }
    if (this.name === 'timetableYear') {
      return 'academic year';
    }
    return name;
  }

  // working with localstorage
  private getItemFromLocalstorage(itemName: string): string {
    return localStorage.getItem(itemName + 'Selected');
  }

  private setItemToLocalstorage(itemName: string, itemId: string): void {
    localStorage.setItem(itemName + 'Selected', itemId);
  }
}
