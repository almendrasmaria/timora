import { Component } from '@angular/core';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="logo">Timora</div>
        <nav>
          <a class="nav-item active">Dashboard</a>
          <a class="nav-item">Turnos</a>
          <a class="nav-item">Clientes</a>
          <a class="nav-item">Servicios</a>
        </nav>
      </aside>
      <main class="main">
        <ng-content />
      </main>
    </div>
  `,
  styles: [
    `
      .shell {
        display: flex;
        min-height: 100vh;
      }
      .sidebar {
        width: 240px;
        flex-shrink: 0;
        border-right: 1px solid var(--border);
        background: var(--surface);
        padding: 1.5rem 1rem;
      }
      .logo {
        font-size: 1.125rem;
        font-weight: 600;
        padding: 0 0.75rem 1.5rem;
      }
      nav {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .nav-item {
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        font-size: 0.875rem;
        color: var(--text-muted);
        cursor: default;
      }
      .nav-item.active {
        background: var(--surface-hover);
        color: var(--text);
        font-weight: 500;
      }
      .main {
        flex: 1;
        padding: 2rem;
      }
    `,
  ],
})
export class AppShellComponent {}
