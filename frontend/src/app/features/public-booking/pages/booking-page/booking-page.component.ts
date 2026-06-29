import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LogoComponent } from '../../../../shared/ui/logo/logo.component';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [LogoComponent],
  template: `
    <div class="booking-page">
      <div class="booking-card">
        <app-logo size="md" />
        <h1>Reservar turno</h1>
        <p class="subtitle">{{ slug }}</p>
        <p class="placeholder">Página pública de reservas — próximamente</p>
      </div>
    </div>
  `,
  styles: [
    `
      .booking-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-6);
        background: var(--color-background);
      }
      .booking-card {
        width: 100%;
        max-width: 28rem;
        padding: var(--space-10);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: var(--color-surface);
        box-shadow: var(--shadow-md);
        text-align: center;
      }
      app-logo {
        display: inline-flex;
        margin-bottom: var(--space-6);
      }
      h1 {
        margin: 0 0 var(--space-2);
        font-size: var(--text-xl);
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .subtitle {
        margin: 0 0 var(--space-6);
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
      .placeholder {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class BookingPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';
}
