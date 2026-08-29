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

  submitted = false;
  loading = false;
  sentSuccessfully = false;
  apiError = '';

  get emailError(): string {
    const control = this.form.controls.email;
    if (!this.submitted && !control.touched) return '';
    if (control.hasError('required')) return 'El email es obligatorio';
    if (control.hasError('email')) return 'Ingresá un email válido';
    return '';
  }

  onSubmit(): void {
    this.submitted = true;
    this.apiError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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
