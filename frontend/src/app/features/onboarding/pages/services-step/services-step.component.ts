import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import {
  SERVICE_PAYMENT_OPTIONS,
  ServicePaymentRequirement,
  onboardingPathForStep,
} from '../../../../core/onboarding/onboarding.config';
import { OnboardingState } from '../../../../core/onboarding/onboarding.models';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { SelectFieldComponent } from '../../../../shared/ui/select-field/select-field.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-onboarding-services-step',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, TextFieldComponent, SelectFieldComponent],
  templateUrl: './services-step.component.html',
})
export class ServicesStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly paymentOptions = SERVICE_PAYMENT_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));
  readonly currentStep = 6;
  loading = false;
  apiError = '';
  validationError = '';
  services: OnboardingState['services'] = [];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    durationMinutes: [60, [Validators.required, Validators.min(5)]],
    price: [''],
    depositAmount: [''],
    paymentRequirement: ['ONLINE_DEPOSIT' as ServicePaymentRequirement, [Validators.required]],
  });

  ngOnInit(): void {
    this.refreshState();
    this.syncPaymentFields(this.form.controls.paymentRequirement.value);
    this.form.controls.paymentRequirement.valueChanges.subscribe((requirement) => {
      this.syncPaymentFields(requirement);
    });
  }

  get paymentRequirement(): ServicePaymentRequirement {
    return this.form.controls.paymentRequirement.value;
  }

  resetForm(): void {
    this.apiError = '';
    this.form.reset({
      name: '',
      durationMinutes: 60,
      price: '',
      depositAmount: '',
      paymentRequirement: 'ONLINE_DEPOSIT',
    });
    this.syncPaymentFields('ONLINE_DEPOSIT');
  }

  addService(): void {
    this.apiError = '';
    if (!this.validatePaymentFields()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const price = this.resolvePrice(value.paymentRequirement, value.price);
    const depositAmount = this.resolveDeposit(value.paymentRequirement, value.depositAmount);

    this.loading = true;
    this.onboarding
      .addService({
        name: value.name,
        durationMinutes: Number(value.durationMinutes),
        price,
        depositAmount,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (state) => {
          this.services = state.services;
          this.validationError = '';
          this.resetForm();
        },
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  removeService(id: number): void {
    this.loading = true;
    this.onboarding
      .deleteService(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (state) => (this.services = state.services),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  continue(): void {
    this.apiError = '';
    if (this.services.length < 1) {
      this.validationError = 'Agregá al menos un servicio';
      return;
    }
    this.validationError = '';
    void this.router.navigate(['/onboarding', onboardingPathForStep(7)]);
  }

  serviceMeta(service: OnboardingState['services'][number]): string {
    const parts = [`${service.durationMinutes} min`];
    if (service.price != null) {
      parts.push(`$${service.price}`);
    }
    if (service.depositAmount != null) {
      parts.push(`Seña $${service.depositAmount}`);
    }
    return parts.join(' · ');
  }

  priceError(): string {
    if (this.paymentRequirement === 'NO_PAYMENT' || !this.form.controls.price.touched) {
      return '';
    }
    return this.form.controls.price.value ? '' : 'Ingresá el precio total';
  }

  depositError(): string {
    if (this.paymentRequirement !== 'ONLINE_DEPOSIT' || !this.form.controls.depositAmount.touched) {
      return '';
    }
    return this.form.controls.depositAmount.value ? '' : 'Ingresá el monto de la seña';
  }

  private validatePaymentFields(): boolean {
    const requirement = this.form.controls.paymentRequirement.value;
    let valid = true;

    if (requirement !== 'NO_PAYMENT' && !this.form.controls.price.value) {
      this.form.controls.price.setErrors({ required: true });
      valid = false;
    }

    if (requirement === 'ONLINE_DEPOSIT' && !this.form.controls.depositAmount.value) {
      this.form.controls.depositAmount.setErrors({ required: true });
      valid = false;
    }

    return valid;
  }

  private resolvePrice(requirement: ServicePaymentRequirement, price: string): number | null {
    if (requirement === 'NO_PAYMENT') return null;
    return price ? Number(price) : null;
  }

  private resolveDeposit(
    requirement: ServicePaymentRequirement,
    depositAmount: string
  ): number | null {
    if (requirement !== 'ONLINE_DEPOSIT') {
      return null;
    }
    return depositAmount ? Number(depositAmount) : null;
  }

  private syncPaymentFields(requirement: ServicePaymentRequirement): void {
    const price = this.form.controls.price;
    const deposit = this.form.controls.depositAmount;

    if (requirement === 'NO_PAYMENT') {
      price.disable({ emitEvent: false });
      price.setValue('', { emitEvent: false });
      deposit.disable({ emitEvent: false });
      deposit.setValue('', { emitEvent: false });
      return;
    }

    if (requirement === 'ONLINE_FULL') {
      price.enable({ emitEvent: false });
      deposit.disable({ emitEvent: false });
      deposit.setValue('', { emitEvent: false });
      return;
    }

    price.enable({ emitEvent: false });
    deposit.enable({ emitEvent: false });
  }

  private refreshState(): void {
    this.onboarding.getState().subscribe({
      next: (state) => (this.services = state.services),
    });
  }
}
