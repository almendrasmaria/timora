import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard-home/dashboard-home.component').then(
        (m) => m.DashboardHomeComponent
      ),
  },
];
