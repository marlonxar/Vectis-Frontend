import {
  trigger, transition, style, animate, query, stagger, state,
} from '@angular/animations';

/** Fade + rise used across sections. */
export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px)' }),
    animate('500ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

/** Staggered children entrance (lists / grids). */
export const staggerList = trigger('staggerList', [
  transition(':enter', [
    query('.stagger-item', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(70, [
        animate('450ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

/** Mobile menu links staggered drop. */
export const mobileMenuStagger = trigger('mobileMenuStagger', [
  transition(':enter', [
    query('a, button', [
      style({ opacity: 0, transform: 'translateY(-18px)' }),
      stagger(60, [
        animate('360ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

/** Horizontal slide between wizard steps. */
export const stepTransition = trigger('stepTransition', [
  transition(':increment', [
    style({ opacity: 0, transform: 'translateX(40px)' }),
    animate('320ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':decrement', [
    style({ opacity: 0, transform: 'translateX(-40px)' }),
    animate('320ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

/** Simple fade for mode switch in contact form. */
export const fadeSwitch = trigger('fadeSwitch', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('260ms ease-out', style({ opacity: 1 })),
  ]),
]);

/** Back-to-top show/hide. */
export const fadeScale = trigger('fadeScale', [
  state('void', style({ opacity: 0, transform: 'scale(0.8)' })),
  transition(':enter', [animate('220ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))]),
  transition(':leave', [animate('160ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))]),
]);
