import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import {
  PRIMARY_BUSINESS_CATEGORIES,
  BusinessSpecialtyCategory,
  onboardingPathForStep,
  specialtiesForCategory,
} from '../../../../core/onboarding/onboarding.config';
import { BusinessCategory } from '../../../../core/onboarding/onboarding.models';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { SelectFieldComponent } from '../../../../shared/ui/select-field/select-field.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-onboarding-business-step',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, TextFieldComponent, SelectFieldComponent],
  templateUrl: './business-step.component.html',
})
export class BusinessStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly categories = PRIMARY_BUSINESS_CATEGORIES;
  readonly currentStep = 1;

  loading = false;
  submitted = false;
  apiError = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['' as BusinessCategory | '', [Validators.required]],
    specialty: [''],
  });

  ngOnInit(): void {
    this.onboarding.getState().subscribe({
      next: (state) => {
        this.form.patchValue({
          name: state.business.name === 'Mi negocio' ? '' : state.business.name,
          category: state.business.category ?? '',
          specialty: state.business.specialty ?? '',
        });
        this.syncSpecialtyValidators(state.business.category);
      },
    });
  }

  get showSpecialty(): boolean {
    return this.isSpecialtyCategory(this.form.controls.category.value);
  }

  get specialtyOptions() {
    return specialtiesForCategory(this.form.controls.category.value).map((item) => ({
      value: item.value,
      label: item.label,
    }));
  }

  selectCategory(category: BusinessCategory): void {
    this.form.controls.category.setValue(category);
    this.form.controls.specialty.setValue('');
    this.syncSpecialtyValidators(category);
  }

  onSubmit(): void {
    this.submitted = true;
    this.apiError = '';
    this.syncSpecialtyValidators(this.form.controls.category.value as BusinessCategory | '');

    if (this.form.invalid) {
      return;
    }

    const { name, category, specialty } = this.form.getRawValue();
    this.loading = true;

    this.onboarding
      .updateBusiness(
        name,
        category as BusinessCategory,
        this.isSpecialtyCategory(category) ? specialty : undefined
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => void this.router.navigate(['/onboarding', onboardingPathForStep(2)]),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  private isSpecialtyCategory(category: string | null | undefined): category is BusinessSpecialtyCategory {
    return category === 'ESTETICA' || category === 'SALUD' || category === 'SERVICIOS';
  }

  private syncSpecialtyValidators(category: BusinessCategory | '' | null): void {
    const specialtyControl = this.form.controls.specialty;

    if (this.isSpecialtyCategory(category)) {
      specialtyControl.setValidators([Validators.required]);
    } else {
      specialtyControl.clearValidators();
      specialtyControl.setValue('');
    }

    specialtyControl.updateValueAndValidity({ emitEvent: false });
  }
}
