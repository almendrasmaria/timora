import { Routes } from '@angular/router';

export const PUBLIC_BOOKING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/booking-page/booking-page.component').then((m) => m.BookingPageComponent),
  },
  {
    path: 'link',
    loadComponent: () =>
      import('./pages/instagram-link-page/instagram-link-page.component').then((m) => m.InstagramLinkPageComponent),
  },
];
