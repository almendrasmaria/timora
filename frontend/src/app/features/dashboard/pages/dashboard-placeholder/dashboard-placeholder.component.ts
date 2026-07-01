import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  template: `
    <section class="dashboard-placeholder">
      <h1 class="dashboard-placeholder__title">{{ title }}</h1>
      <p class="dashboard-placeholder__text">Esta sección está en camino. Seguimos construyendo Timora.</p>
    </section>
  `,
  styles: [
    `
      .dashboard-placeholder {
        padding: var(--space-10);
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-xl);
        background: rgba(255, 255, 255, 0.72);
        text-align: center;
      }

      .dashboard-placeholder__title {
        margin: 0 0 var(--space-2);
        font-size: var(--text-2xl);
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .dashboard-placeholder__text {
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class DashboardPlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = (this.route.snapshot.data['title'] as string) ?? 'Próximamente';
}
