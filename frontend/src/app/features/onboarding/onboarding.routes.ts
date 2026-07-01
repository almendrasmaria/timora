import { Routes } from '@angular/router';
import { onboardingGuard } from '../../core/onboarding/onboarding.guard';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    canActivate: [onboardingGuard],
    loadComponent: () =>
      import('../../shared/layout/onboarding-layout/onboarding-layout.component').then(
        (m) => m.OnboardingLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'negocio', pathMatch: 'full' },
      {
        path: 'negocio',
        loadComponent: () =>
          import('./pages/business-step/business-step.component').then((m) => m.BusinessStepComponent),
      },
      {
        path: 'contacto',
        loadComponent: () =>
          import('./pages/contact-step/contact-step.component').then((m) => m.ContactStepComponent),
      },
      {
        path: 'marca',
        loadComponent: () =>
          import('./pages/brand-step/brand-step.component').then((m) => m.BrandStepComponent),
      },
      {
        path: 'sucursales',
        loadComponent: () =>
          import('./pages/branches-step/branches-step.component').then((m) => m.BranchesStepComponent),
      },
      {
        path: 'profesionales',
        loadComponent: () =>
          import('./pages/professionals-step/professionals-step.component').then(
            (m) => m.ProfessionalsStepComponent
          ),
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./pages/services-step/services-step.component').then((m) => m.ServicesStepComponent),
      },
      {
        path: 'cobros',
        loadComponent: () =>
          import('./pages/payments-step/payments-step.component').then((m) => m.PaymentsStepComponent),
      },
    ],
  },
];
