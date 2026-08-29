import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { parseApiError } from '../../../../core/auth/api-error';
import { AuthService } from '../../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../../core/auth/google-identity.service';
import { AuthLayoutComponent } from '../../../../shared/layout/auth-layout/auth-layout.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayoutComponent,
    ButtonComponent,
    TextFieldComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['../../../../shared/styles/auth-form-card.scss'],
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly features = [
    'Menos mensajes por WhatsApp, más tiempo para atender.',
    'Señá previa para reducir ausencias.',
    'Tus clientes reservan solos, 24/7.',
  ];

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = false;
  apiError = '';
  sessionExpiredMessage = '';
  resetSuccessMessage = '';

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('sessionExpired') === '1') {
      this.sessionExpiredMessage = 'Tu sesión expiró. Volvé a iniciar sesión.';
    }
    if (this.route.snapshot.queryParamMap.get('resetSuccess') === '1') {
      this.resetSuccessMessage = 'Tu contraseña se actualizó. Ya podés iniciar sesión.';
    }
  }

  async onGoogleSignIn(): Promise<void> {
    this.apiError = '';
    try {
      const idToken = await this.googleIdentity.signIn();
      this.loading = true;
      this.auth
        .loginWithGoogle({ idToken })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            void this.router.navigate(this.auth.postAuthRedirect());
          },
          error: (error) => {
            this.apiError = parseApiError(error);
          },
        });
    } catch (error) {
      this.apiError = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google.';
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.apiError = '';
    const { email, password } = this.form.getRawValue();
    this.loading = true;

    this.auth
      .login({ email, password })
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
