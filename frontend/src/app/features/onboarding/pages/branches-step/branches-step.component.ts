import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import { onboardingPathForStep } from '../../../../core/onboarding/onboarding.config';
import { OnboardingState } from '../../../../core/onboarding/onboarding.models';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-onboarding-branches-step',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, TextFieldComponent],
  templateUrl: './branches-step.component.html',
})
export class BranchesStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly currentStep = 4;
  loading = false;
  apiError = '';
  validationError = '';
  branches: OnboardingState['branches'] = [];

  readonly form = this.fb.nonNullable.group({
    address: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.refreshState();
  }

  addBranch(): void {
    this.apiError = '';
    this.validationError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { address } = this.form.getRawValue();
    const name = address.length > 120 ? `${address.slice(0, 117)}...` : address;
    this.loading = true;

    this.onboarding
      .addBranch(name, address)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (state) => {
          this.branches = state.branches;
          this.validationError = '';
          this.form.reset();
        },
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  removeBranch(id: number): void {
    this.loading = true;
    this.onboarding
      .deleteBranch(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (state) => (this.branches = state.branches),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  continue(): void {
    this.apiError = '';
    if (this.branches.length < 1) {
      this.validationError = 'Agregá al menos una sucursal';
      return;
    }
    this.validationError = '';
    void this.router.navigate(['/onboarding', onboardingPathForStep(5)]);
  }

  private refreshState(): void {
    this.onboarding.getState().subscribe({
      next: (state) => (this.branches = state.branches),
    });
  }
}
