import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';

import {
  IStudent,
  IParent,
  ITeacher,
  IAdministrator
} from '../../../../../../sdk/interfaces';
import { BigSearchService } from '../big-search.service';

@Component({
  selector: 'big-search',
  templateUrl: './big-search.component.html',
  animations: [
    trigger('bigSearch', [
      state(
        'void',
        style({
          opacity: 0,
          height: 0
        })
      ),
      state(
        'showing',
        style({
          opacity: 1,
          height: '*'
        })
      ),
      transition('void => *', animate('220ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void',
        animate(
          '160ms 25ms cubic-bezier(0, 0, 0.2, 1)',
          style({ opacity: 0, height: 0 })
        )
      )
    ]),
    trigger('dropdownItem', [
      state(
        'void',
        style({
          transform: 'scaleY(0.8) translateY(-20%)',
          minWidth: '100%',
          opacity: 0,
          height: 0
        })
      ),
      state(
        'showing',
        style({
          opacity: 1,
          height: '*',
          minWidth: 'calc(100% + 32px)',
          transform: 'scaleY(1) translateY(-20%)'
        })
      ),
      transition('void => *', animate('220ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void',
        animate(
          '160ms cubic-bezier(0, 0, 0.2, 1)',
          style({ opacity: 0, height: 0 })
        )
      )
    ]),
    trigger('dropdownIcon', [
      state(
        'void',
        style({
          transform: 'scaleY(0.8) translateY(-20%)',
          minWidth: '100%',
          opacity: 0,
          height: 0
        })
      ),
      state(
        'showing',
        style({
          opacity: 1,
          height: '*',
          minWidth: 'calc(100% + 32px)',
          transform: 'scaleY(1) translateY(-20%)'
        })
      ),
      transition('void => *', animate('220ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void',
        animate(
          '160ms cubic-bezier(0, 0, 0.2, 1)',
          style({ opacity: 0, height: 0 })
        )
      )
    ]),
    trigger('fade', [
      state(
        'void',
        style({
          opacity: 0
        })
      ),
      state(
        'showing',
        style({
          opacity: 1,
          height: '*',
          minWidth: 'calc(100% + 32px)',
          transform: 'scaleY(1) translateY(-20%)'
        })
      ),
      transition('void => *', animate('220ms cubic-bezier(0, 0, 0.2, 1)')),
      transition(
        '* => void',
        animate(
          '160ms cubic-bezier(0, 0, 0.2, 1)',
          style({ opacity: 0, height: 0 })
        )
      )
    ])
  ]
})
export class BigSearchComponent implements OnChanges {
  @Input()
  public mode: string;

  public searchString = '';
  public dropdownOpened = false;
  public dropdownData: IStudent[] | IParent[] | ITeacher[];

  constructor(private service: BigSearchService, private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.mode.firstChange && this.searchString) {
      this.searchData(this.searchString);
    }
  }

  // searching for data
  public searchData(searchString: string): void {
    this.dropdownOpened = true;
    switch (this.mode) {
      case 'all users':
        this.searchForAll(searchString);
        break;
      case 'learners':
        this.searchLearners(searchString);
        break;
      case 'parents':
        this.searchParents(searchString);
        break;
      case 'educators':
        this.searchEducators(searchString);
        break;
      case 'staff':
        this.searchStaff(searchString);
        break;

      default:
        break;
    }
  }

  // clearing search input
  public clearSearch(): void {
    this.searchString = '';
    this.dropdownData = null;
    this.dropdownOpened = false;
  }

  // searching for all users
  private searchForAll(query: string): void {
    if (this.searchString.length !== 0) {
      this.service.getAllUsers(query).subscribe(res => {
        this.dropdownData = [].concat(...res).sort((a, b) => {
          if (a.lastName < b.lastName) {
            return -1;
          }
          if (a.lastName > b.lastName) {
            return 1;
          }
          return 0;
        });
      });
    } else {
      this.dropdownData = null;
      this.dropdownOpened = false;
    }
  }

  // searching for learners
  private searchLearners(query: string): void {
    if (this.searchString.length !== 0) {
      this.service
        .getLearners(query)
        .subscribe((data: IStudent[]) => (this.dropdownData = data));
    } else {
      this.dropdownData = null;
      this.dropdownOpened = false;
    }
  }

  // searching for parents
  private searchParents(query: string): void {
    if (this.searchString.length !== 0) {
      this.service
        .getParents(query)
        .subscribe((data: IParent[]) => (this.dropdownData = data));
    } else {
      this.dropdownData = null;
      this.dropdownOpened = false;
    }
  }

  // searching for educators
  private searchEducators(query: string): void {
    if (this.searchString.length !== 0) {
      this.service
        .getEducators(query)
        .subscribe(data => (this.dropdownData = data));
    } else {
      this.dropdownData = null;
      this.dropdownOpened = false;
      return;
    }
  }

  // searching for staff
  private searchStaff(query: string): void {
    if (this.searchString.length !== 0) {
      this.service
        .getStaff(query)
        .subscribe((data: IAdministrator[]) => (this.dropdownData = data));
    } else {
      this.dropdownData = null;
      this.dropdownOpened = false;
    }
  }

  // select item from search list and navigate to appropriate page
  public itemSelected(item: any, mode: string): void {
    switch (mode) {
      case 'learner':
      case 'learners':
        this.navigateToLearners(item);
        break;
      case 'parent':
      case 'parents':
        this.router.navigate(['/parents'], {
          queryParams: { search: item.name + ' ' + item.lastName }
        });
        break;
      case 'educator':
      case 'educators':
        this.router.navigate(['/educators'], {
          queryParams: { search: item.name + ' ' + item.lastName }
        });
        break;
      case 'staff':
        this.router.navigate(['/staff'], {
          queryParams: { search: item.name + ' ' + item.lastName }
        });
        break;
      default:
        break;
    }
  }

  // navigate to learners page with setting SLC block
  private navigateToLearners(item: IStudent): void {
    this.service.getStructureByClass(item).subscribe(res => {
      if (!res) {
        this.router.navigate(['/learners'], {
          queryParams: {
            search: item.name + ' ' + item.lastName
          }
        });
      }
    });
  }
}
