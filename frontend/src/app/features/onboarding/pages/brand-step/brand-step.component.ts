import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import { ConfigService } from '../../../../core/config/config.service';
import { BRAND_COLORS } from '../../../../core/onboarding/onboarding.config';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

const DEFAULT_BRAND_COLOR = BRAND_COLORS[1].value;

@Component({
  selector: 'app-onboarding-brand-step',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, TextFieldComponent],
  templateUrl: './brand-step.component.html',
})
export class BrandStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly configService = inject(ConfigService);
  private readonly router = inject(Router);

  readonly brandColors = BRAND_COLORS;
  readonly currentStep = 3;
  loading = false;
  uploadingLogo = false;
  apiError = '';
  logoPreview: string | null = null;

  readonly form = this.fb.nonNullable.group({
    // Letras en cualquier caso: el slug se pasa a minúsculas recién al enviarlo (ver onSubmit).
    slug: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80), Validators.pattern(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/)]],
    brandColor: [DEFAULT_BRAND_COLOR as string, [Validators.required]],
  });

  ngOnInit(): void {
    this.onboarding.getState().subscribe({
      next: (state) => {
        const slug = state.business.slug.startsWith('tmp-') ? '' : state.business.slug;
        this.form.patchValue({
          slug,
          brandColor: state.business.brandColor ?? DEFAULT_BRAND_COLOR,
        });
        this.logoPreview = state.business.logoUrl || null;
      },
    });
  }

  selectColor(color: string): void {
    this.form.controls.brandColor.setValue(color);
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.apiError = 'El logo no puede superar los 5 MB.';
      input.value = '';
      return;
    }

    this.apiError = '';
    this.uploadingLogo = true;

    this.configService
      .uploadLogo(file)
      .pipe(finalize(() => (this.uploadingLogo = false)))
      .subscribe({
        next: (business) => {
          this.logoPreview = business.logoUrl;
        },
        error: (error) => {
          this.apiError = parseApiError(error);
          input.value = '';
        },
      });
  }

  onSubmit(): void {
    this.apiError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { slug, brandColor } = this.form.getRawValue();
    this.loading = true;

    this.onboarding
      .updateBrand(slug.toLowerCase(), brandColor)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => this.finish(),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }

  private finish(): void {
    this.loading = true;
    this.onboarding
      .finish()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error) => (this.apiError = parseApiError(error)),
      });
  }
}
