import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AgendaView,
  STATS_PERIOD_OPTIONS,
  StatsPeriod,
  publicBookingUrl,
} from '../../../../core/dashboard/dashboard.config';
import {
  appointmentClientName,
  appointmentStatusLabel,
  formatAppointmentRange,
  formatAppointmentTime,
  formatIncome,
} from '../../../../core/appointments/appointments.format';
import { Appointment } from '../../../../core/appointments/appointments.models';
import { AppointmentsService } from '../../../../core/appointments/appointments.service';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [ButtonComponent, RouterLink],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class DashboardHomeComponent implements OnInit {
  private readonly onboarding = inject(OnboardingService);
  private readonly appointmentsService = inject(AppointmentsService);

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
  readonly noShowCount = signal(0);
  readonly todayAppointments = signal<Appointment[]>([]);
  readonly recentAppointments = signal<Appointment[]>([]);

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

    this.loadDashboard();
  }

  get hasTodayAppointments(): boolean {
    return this.todayAppointments().length > 0;
  }

  get showRecentFallback(): boolean {
    return !this.hasTodayAppointments && this.recentAppointments().length > 0;
  }

  clientName(appointment: Appointment): string {
    return appointmentClientName(appointment);
  }

  statusLabel(appointment: Appointment): string {
    return appointmentStatusLabel(appointment.status);
  }

  timeRange(appointment: Appointment): string {
    return formatAppointmentRange(appointment.startsAt, appointment.endsAt);
  }

  timeLabel(appointment: Appointment): string {
    return formatAppointmentTime(appointment.startsAt);
  }

  incomeLabel(): string {
    return formatIncome(this.incomeCount());
  }

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as StatsPeriod;
    this.statsPeriod.set(value);
    this.loadSummary();
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

  private loadDashboard(): void {
    this.loadSummary();
    this.loadToday();
    this.loadRecent();
  }

  private loadSummary(): void {
    this.appointmentsService.getSummary(this.statsPeriod()).subscribe({
      next: (summary) => {
        this.appointmentsCount.set(summary.appointmentsCount);
        this.incomeCount.set(Number(summary.incomeTotal ?? 0));
        this.noShowCount.set(summary.noShowCount);
      },
    });
  }

  private loadToday(): void {
    this.appointmentsService.listToday().subscribe({
      next: (appointments) => this.todayAppointments.set(appointments),
    });
  }

  private loadRecent(): void {
    this.appointmentsService.listRecent().subscribe({
      next: (appointments) => this.recentAppointments.set(appointments),
    });
  }
}
