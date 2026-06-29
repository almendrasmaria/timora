import { Component } from '@angular/core';
import { AppShellComponent } from '../../../../shared/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [AppShellComponent],
  template: `
    <app-app-shell>
      <h1>Dashboard</h1>
      <p class="subtitle">Bienvenido a Timora. Tu agenda centralizada.</p>
    </app-app-shell>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 var(--space-2);
        font-size: var(--text-2xl);
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .subtitle {
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--text-sm);
      }
    `,
  ],
})
export class DashboardHomeComponent {}
