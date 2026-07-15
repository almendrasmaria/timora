import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { onboardingCompleteGuard } from '../../core/onboarding/onboarding.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, onboardingCompleteGuard],
    loadComponent: () =>
      import('../../shared/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./pages/dashboard-home/dashboard-home.component').then((m) => m.DashboardHomeComponent),
      },
      {
        path: 'turnos',
        loadComponent: () =>
          import('./pages/appointments-page/appointments-page.component').then(
            (m) => m.AppointmentsPageComponent
          ),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clients-page/clients-page.component').then(
            (m) => m.ClientsPageComponent
          ),
        data: { title: 'Clientes' },
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./pages/config-page/config-page.component').then(
            (m) => m.ConfigPageComponent
          ),
        data: { title: 'Configuración' },
      },
    ],
  },
];
