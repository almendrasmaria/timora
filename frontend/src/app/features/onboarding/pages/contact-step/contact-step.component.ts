import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import { onboardingPathForStep } from '../../../../core/onboarding/onboarding.config';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-onboarding-contact-step',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, TextFieldComponent],
  templateUrl: './contact-step.component.html',
})
export class ContactStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly currentStep = 2;
  loading = false;
  apiError = '';

  readonly form = this.fb.nonNullable.group({
    whatsapp: ['', [Validators.required, Validators.maxLength(32)]],
    instagram: ['', [Validators.maxLength(80)]],
  });

  ngOnInit(): void {
    this.onboarding.getState().subscribe({
      next: (state) => {
        this.form.patchValue({
          whatsapp: state.business.whatsapp ?? '',
          instagram: state.business.instagram ?? '',
        });
      },
    });
  }

  onSubmit(): void {
    this.apiError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { whatsapp, instagram } = this.form.getRawValue();
    this.loading = true;

    this.onboarding
      .updateContact(whatsapp, instagram)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => void this.router.navigate(['/onboarding', onboardingPathForStep(3)]),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }
}
