import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthLayoutComponent } from '../../../../shared/layout/auth-layout/auth-layout.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    TextFieldComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../../../../shared/styles/auth-form-card.scss'],
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly features = [
    'Menos mensajes por WhatsApp, más tiempo para atender.',
    'Señá previa para reducir ausencias.',
    'Tus clientes reservan solos, 24/7.',
  ];

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = false;
  sentSuccessfully = false;
  apiError = '';

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.apiError = '';
    const { email } = this.form.getRawValue();
    this.loading = true;

    this.auth
      .forgotPassword({ email })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.sentSuccessfully = true;
        },
        error: (error) => {
          this.apiError = parseApiError(error);
        },
      });
  }
}
