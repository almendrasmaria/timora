import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AgendaView,
  STATS_PERIOD_OPTIONS,
  StatsPeriod,
  publicBookingUrl,
} from '../../../../core/dashboard/dashboard.config';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent implements OnInit {
  private readonly onboarding = inject(OnboardingService);

  readonly periodOptions = STATS_PERIOD_OPTIONS;

  businessName = 'Mi negocio';
  bookingUrl = '';
  copyLabel = 'Copiar link';
  greeting = '';
  todayShort = '';
  todayLabel = '';

  readonly statsPeriod = signal<StatsPeriod>('today');
  readonly agendaView = signal<AgendaView>('list');
  readonly appointmentsCount = signal(0);
  readonly incomeCount = signal(0);

  ngOnInit(): void {
    const now = new Date();
    const hour = now.getHours();

    if (hour < 12) {
      this.greeting = 'Buenos días';
    } else if (hour < 19) {
      this.greeting = 'Buenas tardes';
    } else {
      this.greeting = 'Buenas noches';
    }

    this.todayShort = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    }).format(now);

    this.todayLabel = new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);

    this.onboarding.getState().subscribe({
      next: (state) => {
        this.businessName = state.business.name;
        this.bookingUrl = publicBookingUrl(state.business.slug);
      },
    });
  }

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as StatsPeriod;
    this.statsPeriod.set(value);
  }

  setAgendaView(view: AgendaView): void {
    this.agendaView.set(view);
  }

  async copyBookingLink(): Promise<void> {
    if (!this.bookingUrl || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(this.bookingUrl);
    this.copyLabel = 'Link copiado';
    window.setTimeout(() => (this.copyLabel = 'Copiar link'), 2000);
  }
}
