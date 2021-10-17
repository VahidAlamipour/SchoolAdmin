import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Subject, from } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'search-input',
  templateUrl: './search-input.component.html'
})
export class SearchInputComponent {
  @Input()
  public searchString = '';
  @Input()
  public placeholder: string;
  @Input()
  public id: string;
  @Input()
  public liveSearch: boolean;
  @Output()
  public searchEvent: EventEmitter<string> = new EventEmitter();
  public searchSubject: Subject<string> = new Subject<string>();

  constructor() {
    this.searchSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      )
      .subscribe(searchString => {
        this.searchEvent.emit(searchString);
      });
  }

  public modelChange(searchString: string): void {
    if (searchString.length === 0 || (this.liveSearch && this.searchString.length > 2)) {
      this.searchSubject.next(searchString);
    }
  }

  public clearInput(): void {
    this.searchString = '';
    this.searchEvent.emit(this.searchString);
  }
}
