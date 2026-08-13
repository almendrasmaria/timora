import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthLayoutComponent } from '../../../../shared/layout/auth-layout/auth-layout.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    TextFieldComponent,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['../../../../shared/styles/auth-form-card.scss'],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly features = [
    'Menos mensajes por WhatsApp, más tiempo para atender.',
    'Señá previa para reducir ausencias.',
    'Tus clientes reservan solos, 24/7.',
  ];

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: (group) => {
        const password = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
      },
    }
  );

  submitted = false;
  loading = false;
  apiError = '';

  get emailError(): string {
    const control = this.form.controls.email;
    if (!this.submitted && !control.touched) return '';
    if (control.hasError('required')) return 'El email es obligatorio';
    if (control.hasError('email')) return 'Ingresá un email válido';
    return '';
  }

  get passwordError(): string {
    const control = this.form.controls.password;
    if (!this.submitted && !control.touched) return '';
    if (control.hasError('required')) return 'La contraseña es obligatoria';
    if (control.hasError('minlength')) return 'Mínimo 8 caracteres';
    return '';
  }

  get confirmPasswordError(): string {
    const control = this.form.controls.confirmPassword;
    if (!this.submitted && !control.touched) return '';
    if (control.hasError('required')) return 'Confirmá tu contraseña';
    if (this.form.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    return '';
  }

  onSubmit(): void {
    this.submitted = true;
    this.apiError = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.loading = true;

    this.auth
      .register({ email, password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          void this.router.navigate(this.auth.postAuthRedirect());
        },
        error: (error) => {
          this.apiError = parseApiError(error);
        },
      });
  }
}
