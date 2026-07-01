import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { onboardingCompleteGuard } from '../../core/onboarding/onboarding.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, onboardingCompleteGuard],
    loadComponent: () =>
      import('./pages/dashboard-home/dashboard-home.component').then(
        (m) => m.DashboardHomeComponent
      ),
  },
];
