import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ONBOARDING_STEPS } from '../../../core/onboarding/onboarding.config';
import { LogoComponent } from '../../ui/logo/logo.component';

@Component({
  selector: 'app-onboarding-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './onboarding-layout.component.html',
  styleUrl: './onboarding-layout.component.scss',
})
export class OnboardingLayoutComponent {
  private readonly router = inject(Router);

  readonly steps = ONBOARDING_STEPS;
  readonly totalSteps = ONBOARDING_STEPS.length;

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.resolveCurrentPath()),
      startWith(this.resolveCurrentPath())
    ),
    { initialValue: 'negocio' }
  );

  readonly currentStepNumber = computed(() => {
    const index = ONBOARDING_STEPS.findIndex((step) => step.path === this.currentPath());
    return index >= 0 ? index + 1 : 1;
  });

  readonly progressPercent = computed(() =>
    Math.round((this.currentStepNumber() / this.totalSteps) * 100)
  );

  isComplete(stepPath: string): boolean {
    const currentIndex = ONBOARDING_STEPS.findIndex((step) => step.path === this.currentPath());
    const stepIndex = ONBOARDING_STEPS.findIndex((step) => step.path === stepPath);
    return stepIndex >= 0 && currentIndex >= 0 && stepIndex < currentIndex;
  }

  private resolveCurrentPath(): string {
    const segments = this.router.url.split('/').filter(Boolean);
    const onboardingIndex = segments.indexOf('onboarding');
    if (onboardingIndex === -1) {
      return 'negocio';
    }
    return segments[onboardingIndex + 1] ?? 'negocio';
  }
}
