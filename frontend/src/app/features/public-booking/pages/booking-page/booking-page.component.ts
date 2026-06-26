import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  template: `
    <div class="booking-page">
      <div class="booking-card">
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
        padding: 1.5rem;
      }
      .booking-card {
        width: 100%;
        max-width: 480px;
        padding: 2rem;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface);
        text-align: center;
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
    `,
  ],
})
export class BookingPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';
}
