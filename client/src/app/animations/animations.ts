import {
  transition,
  style,
  trigger,
  animate,
  state,
  sequence
} from '@angular/animations';

const cubicFunction = ' cubic-bezier(0, 0, 0.2, 1)';

export let fadeAnimation = trigger('fade', [
  state(
    'void',
    style({
      opacity: 0
    })
  ),
  state(
    'showing',
    style({
      opacity: 1
    })
  ),
  transition('void => *', animate('300ms' + cubicFunction)),
  transition(
    '* => void',
    animate('200ms cubic-bezier(0, 0, 0.2, 1)', style({ opacity: 0 }))
  )
]);

export let fadeContainerAnimation = trigger('fadeContainer', [
  state(
    'void',
    style({
      position: 'absolute',
      opacity: 0
    })
  ),
  state(
    'showing',
    style({
      opacity: 1
    })
  ),
  transition('void => *', animate('300ms' + cubicFunction)),
  transition(
    '* => void',
    animate('200ms' + cubicFunction, style({ opacity: 0 }))
  )
]);

export let heightAnimation = trigger('height', [
  state(
    '*',
    style({
      overflow: 'hidden',
      height: '*',
      paddingTop: '*',
      paddingBottom: '*'
    })
  ),
  state(
    'void',
    style({
      opacity: 0,
      overflow: 'hidden',
      height: 0,
      paddingTop: 0,
      paddingBottom: 0
    })
  ),
  transition('* => void', animate('250ms' + cubicFunction)),
  transition('void => *', animate('250ms' + cubicFunction))
]);

export let widthAnimation = trigger('width', [
  state(
    '*',
    style({
      overflow: 'hidden',
      width: '*',
      paddingLeft: '*',
      paddingRight: '*'
    })
  ),
  state(
    'void',
    style({
      opacity: 0,
      overflow: 'hidden',
      width: 0,
      paddingLeft: 0,
      paddingRight: 0
    })
  ),
  transition('* => void', animate('100ms' + cubicFunction)),
  transition('void => *', animate('150ms 310ms' + cubicFunction))
]);

export let widthFadeAnimation = trigger('widthFade', [
  state(
    '*',
    style({
      overflow: 'hidden',
      width: '*',
      paddingLeft: '*',
      paddingRight: '*'
    })
  ),
  state(
    'void',
    style({
      opacity: 0,
      overflow: 'hidden',
      width: 0,
      paddingLeft: 0,
      paddingRight: 0
    })
  ),
  transition('* => void', [
    sequence([
      animate(
        '150ms' + cubicFunction,
        style({
          opacity: 0
        })
      ),
      animate(
        '250ms' + cubicFunction,
        style({
          width: 0,
          paddingLeft: 0,
          paddingRight: 0
        })
      )
    ])
  ]),
  transition('void => *', [
    sequence([
      animate(
        '250ms' + cubicFunction,
        style({
          width: '*',
          paddingLeft: '*',
          paddingRight: '*'
        })
      ),
      animate(
        '150ms' + cubicFunction,
        style({
          opacity: 1
        })
      )
    ])
  ])
]);

export let importOverlayAnimation = trigger('overlay', [
  state('void', style({ background: 'rgba(0, 0, 0, 0)' })),
  state('*', style({ background: 'rgba(0, 0, 0, 0.3)' })),
  transition('void => *', animate('300ms ease')),
  transition('* => void', animate('100ms 25ms linear'))
]);
