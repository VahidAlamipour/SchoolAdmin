import { AnimationTriggerMetadata, transition, style, trigger, animate } from '@angular/animations';

export let topSlideAnimation: AnimationTriggerMetadata = trigger('topSlide', [
  transition('void => *', [
    style({ transform: 'translateY(-70px)' }),
    animate('350ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateY(0)' }))
  ]),
  transition('* => void', [
    animate('350ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateY(-65px)' }))
  ])
]);

export let contentBottomSlideAnimation: AnimationTriggerMetadata = trigger('contentSlide', [
  transition('void => *', [
    style({ transform: 'translateY(120%)', opacity: 0 }),
    animate('250ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
  ]),
  transition('* => void', [
    animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateY(120%)', opacity: 0 }))
  ])
]);
