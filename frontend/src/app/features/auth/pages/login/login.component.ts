import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  readonly features = [
    'Gestioná turnos desde un solo lugar',
    'Compartí tu link de reservas con clientes',
    'Recordatorios automáticos por WhatsApp',
  ];

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submitted = false;

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
    return '';
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
    }
  }
}
