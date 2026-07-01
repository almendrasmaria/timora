import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { finalize } from 'rxjs';

import { parseApiError } from '../../../../core/auth/api-error';

import { onboardingPathForStep } from '../../../../core/onboarding/onboarding.config';

import {

  createDefaultAvailability,

  formatAvailabilitySummary,

  serializeAvailability,

  splitProfessionalName,

  ProfessionalAvailability,

} from '../../../../core/onboarding/professional-schedule.model';

import { OnboardingState } from '../../../../core/onboarding/onboarding.models';

import { OnboardingService } from '../../../../core/onboarding/onboarding.service';

import { ProfessionalScheduleComponent } from '../../components/professional-schedule/professional-schedule.component';

import { ButtonComponent } from '../../../../shared/ui/button/button.component';

import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';



@Component({

  selector: 'app-onboarding-professionals-step',

  standalone: true,

  imports: [

    ReactiveFormsModule,

    RouterLink,

    ButtonComponent,

    TextFieldComponent,

    ProfessionalScheduleComponent,

  ],

  templateUrl: './professionals-step.component.html',

})

export class ProfessionalsStepComponent implements OnInit {

  private readonly fb = inject(FormBuilder);

  private readonly onboarding = inject(OnboardingService);

  private readonly router = inject(Router);



  readonly currentStep = 5;

  loading = false;

  apiError = '';

  validationError = '';

  professionals: OnboardingState['professionals'] = [];

  draftAvailability: ProfessionalAvailability = createDefaultAvailability();



  readonly form = this.fb.nonNullable.group({

    displayName: ['', [Validators.required, Validators.maxLength(160)]],

  });



  ngOnInit(): void {

    this.refreshState();

  }



  resetForm(): void {

    this.apiError = '';

    this.form.reset();

    this.draftAvailability = createDefaultAvailability();

  }



  addProfessional(): void {

    this.apiError = '';

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }



    const { firstName, lastName } = splitProfessionalName(this.form.controls.displayName.value);

    this.loading = true;



    this.onboarding

      .addProfessional({

        firstName,

        lastName,

        availabilityJson: serializeAvailability(this.draftAvailability),

      })

      .pipe(finalize(() => (this.loading = false)))

      .subscribe({

        next: (state) => {

          this.professionals = state.professionals;

          this.validationError = '';

          this.resetForm();

        },

        error: (error) => (this.apiError = parseApiError(error)),

      });

  }



  removeProfessional(id: number): void {

    this.loading = true;

    this.onboarding

      .deleteProfessional(id)

      .pipe(finalize(() => (this.loading = false)))

      .subscribe({

        next: (state) => (this.professionals = state.professionals),

        error: (error) => (this.apiError = parseApiError(error)),

      });

  }



  continue(): void {

    this.apiError = '';

    if (this.professionals.length < 1) {

      this.validationError = 'Agregá al menos un profesional';

      return;

    }

    this.validationError = '';

    void this.router.navigate(['/onboarding', onboardingPathForStep(6)]);

  }



  displayName(professional: OnboardingState['professionals'][number]): string {

    if (professional.firstName === professional.lastName) {

      return professional.firstName;

    }

    return `${professional.firstName} ${professional.lastName}`.trim();

  }



  initials(professional: OnboardingState['professionals'][number]): string {

    const name = this.displayName(professional).trim();

    const parts = name.split(/\s+/).filter(Boolean);



    if (parts.length >= 2) {

      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();

    }



    return name.slice(0, 2).toUpperCase();

  }



  scheduleMeta(professional: OnboardingState['professionals'][number]): string {

    return formatAvailabilitySummary(professional.availabilityJson);

  }



  private refreshState(): void {

    this.onboarding.getState().subscribe({

      next: (state) => (this.professionals = state.professionals),

    });

  }

}

