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
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
        font-weight: 600;
      }
      .subtitle {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class DashboardHomeComponent {}
