import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'onboarding',
    loadChildren: () =>
      import('./features/onboarding/onboarding.routes').then((m) => m.ONBOARDING_ROUTES),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: ':slug',
    loadChildren: () =>
      import('./features/public-booking/public-booking.routes').then((m) => m.PUBLIC_BOOKING_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
