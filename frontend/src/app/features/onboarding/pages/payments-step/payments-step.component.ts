import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import { PAYMENT_METHOD_OPTIONS } from '../../../../core/onboarding/onboarding.config';
import { OnboardingState, PaymentMethodType } from '../../../../core/onboarding/onboarding.models';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-onboarding-payments-step',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './payments-step.component.html',
})
export class PaymentsStepComponent implements OnInit {
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly options = PAYMENT_METHOD_OPTIONS;
  readonly currentStep = 7;
  loading = false;
  apiError = '';
  paymentMethods: OnboardingState['paymentMethods'] = [];

  ngOnInit(): void {
    this.refreshState();
  }

  togglePaymentMethod(option: (typeof PAYMENT_METHOD_OPTIONS)[number]): void {
    if (this.loading) {
      return;
    }

    const existing = this.paymentMethods.find((method) =>
      (option.types as readonly PaymentMethodType[]).includes(method.type)
    );

    if (existing) {
      this.removePaymentMethod(existing.id);
      return;
    }

    this.addPaymentMethod(option.value);
  }

  addPaymentMethod(type: PaymentMethodType): void {
    this.apiError = '';
    this.loading = true;

    this.onboarding
      .addPaymentMethod(type)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (state) => (this.paymentMethods = state.paymentMethods),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  removePaymentMethod(id: number): void {
    this.loading = true;
    this.onboarding
      .deletePaymentMethod(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (state) => (this.paymentMethods = state.paymentMethods),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  finish(): void {
    if (this.paymentMethods.length < 1) {
      this.apiError = 'Elegí al menos una forma de cobro.';
      return;
    }

    this.loading = true;
    this.onboarding
      .finish()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  isSelected(option: (typeof PAYMENT_METHOD_OPTIONS)[number]): boolean {
    return this.paymentMethods.some((method) =>
      (option.types as readonly PaymentMethodType[]).includes(method.type)
    );
  }

  private refreshState(): void {
    this.onboarding.getState().subscribe({
      next: (state) => (this.paymentMethods = state.paymentMethods),
    });
  }
}
