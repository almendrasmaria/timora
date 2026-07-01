import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ONBOARDING_STEPS } from './onboarding.config';

export const onboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (auth.onboardingCompleted()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

export const onboardingCompleteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (!auth.onboardingCompleted()) {
    const step = auth.onboardingStep();
    const route = ONBOARDING_STEPS.find((item) => item.step === step)?.path ?? 'negocio';
    return router.createUrlTree(['/onboarding', route]);
  }

  return true;
};
