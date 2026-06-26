import { Routes } from '@angular/router';

export const PUBLIC_BOOKING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/booking-page/booking-page.component').then((m) => m.BookingPageComponent),
  },
];
