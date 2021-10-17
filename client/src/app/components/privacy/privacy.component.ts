import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  topSlideAnimation,
  contentBottomSlideAnimation
} from './privacy.animation';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  animations: [topSlideAnimation, contentBottomSlideAnimation]
})
export class PrivacyComponent {
  @Input() public isOpen = false;
  @Output() public closePrivacy: EventEmitter<boolean> = new EventEmitter();

  public scrollToElement($element: any): void {
    $element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
  }
}
