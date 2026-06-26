import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1>Timora</h1>
        <p class="subtitle">Iniciá sesión en tu cuenta</p>
        <p class="placeholder">Pantalla de login — próximamente</p>
        <a routerLink="/auth/register">Crear cuenta</a>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
      .auth-card {
        width: 100%;
        max-width: 400px;
        padding: 2rem;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface);
      }
      h1 {
        margin: 0 0 0.25rem;
        font-size: 1.5rem;
        font-weight: 600;
      }
      .subtitle {
        margin: 0 0 1.5rem;
        color: var(--text-muted);
        font-size: 0.875rem;
      }
      .placeholder {
        color: var(--text-muted);
        font-size: 0.875rem;
      }
      a {
        display: inline-block;
        margin-top: 1rem;
        color: var(--primary);
        text-decoration: none;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class LoginComponent {}
