import { Component, OnInit, inject, signal, computed } from '@angular/core';
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

  readonly statsPeriod = signal<StatsPeriod>('month');
  readonly agendaView = signal<AgendaView>('list');
  readonly appointmentsCount = signal(0);
  readonly incomeCount = signal(0);
  readonly noShowCount = signal(0);
  readonly todayAppointments = signal<Appointment[]>([]);
  readonly recentAppointments = signal<Appointment[]>([]);

  readonly filteredRecentAppointments = computed(() => {
    const list = this.recentAppointments();
    const period = this.statsPeriod();
    const now = new Date();
    
    // Calculate start date based on active period
    const startDate = new Date(now);
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 'month' (last 30 days)
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }
    
    return list.filter(appt => {
      const apptDate = new Date(appt.startsAt);
      return apptDate.getTime() >= startDate.getTime();
    });
  });

  readonly displayedAppointments = computed(() => {
    const list = this.filteredRecentAppointments();
    return list.slice(0, 5).map(appt => ({
      id: appt.id,
      businessName: this.businessName,
      clientName: appt.clientFirstName + ' ' + appt.clientLastName,
      clientEmail: appt.clientEmail || 'Sin email',
      dateLabel: this.formatAppointmentDateForTable(appt.startsAt)
    }));
  });

  get formattedPeriodRange(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDate = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    if (this.statsPeriod() === 'today') {
      return formatDate(now);
    } else if (this.statsPeriod() === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return `${formatDate(start)} - ${formatDate(now)}`;
    } else {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      return `${formatDate(start)} - ${formatDate(now)}`;
    }
  }

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

  formatAppointmentDateForTable(startsAtStr: string): string {
    const d = new Date(startsAtStr);
    const day = d.getDate();
    const monthNames = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const month = monthNames[d.getMonth()];
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${day} DE ${month} ${pad(d.getHours())}:${pad(d.getMinutes())}hs`;
  }

  incomeLabel(): string {
    const val = this.incomeCount();
    if (val === 0) return '0,00';
    return formatIncome(val).replace('$', '').trim();
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
