import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthLayoutComponent } from '../../../../shared/layout/auth-layout/auth-layout.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    TextFieldComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../../../../shared/styles/auth-form-card.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly features = [
    'Menos mensajes por WhatsApp, más tiempo para atender.',
    'Señá previa para reducir ausencias.',
    'Tus clientes reservan solos, 24/7.',
  ];

  readonly form = this.fb.nonNullable.group(
    {
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

  token = '';
  loading = false;
  apiError = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.apiError = 'El enlace no es válido o expiró. Solicitá uno nuevo.';
    }
  }

  onSubmit(): void {
    if (!this.token || this.form.invalid) {
      return;
    }

    this.apiError = '';
    const { password } = this.form.getRawValue();
    this.loading = true;

    this.auth
      .resetPassword({ token: this.token, newPassword: password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/auth/login'], { queryParams: { resetSuccess: '1' } });
        },
        error: (error) => {
          this.apiError = parseApiError(error);
        },
      });
  }
}
