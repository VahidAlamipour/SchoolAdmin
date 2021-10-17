import {
  transition,
  style,
  trigger,
  animate,
  query
} from '@angular/animations';

export let routeAnimation = trigger('routeAnimation', [
  transition('* => *', [
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    query(
      ':leave',
      [
        style({ opacity: 1 }),
        animate('0.2s cubic-bezier(0, 0, 0.2, 1)', style({ opacity: 0 }))
      ],
      { optional: true }
    ),
    query(
      ':enter',
      [
        style({ opacity: 0 }),
        animate('0.2s cubic-bezier(0, 0, 0.2, 1)', style({ opacity: 1 }))
      ],
      { optional: true }
    )
  ])
]);
