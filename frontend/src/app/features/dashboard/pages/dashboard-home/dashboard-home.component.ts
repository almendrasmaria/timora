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
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [ButtonComponent, FormsModule, NgSelectModule],
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
  private readonly router = inject(Router);

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
  readonly attendanceMarkedCount = signal(0);
  readonly todayAppointments = signal<Appointment[]>([]);
  readonly recentAppointments = signal<Appointment[]>([]);

  readonly noShowRatePercent = computed(() => {
    const marked = this.attendanceMarkedCount();
    if (!marked || marked <= 0) {
      return 0;
    }
    return Math.round((this.noShowCount() / marked) * 100);
  });

  readonly noShowGaugeArcPath = computed(() => {
    const percent = Math.min(100, Math.max(0, this.noShowRatePercent()));
    const angleDeg = 180 - (percent / 100) * 180;
    const angleRad = (angleDeg * Math.PI) / 180;
    const cx = 90;
    const cy = 90;
    const r = 75;
    const x = cx + r * Math.cos(angleRad);
    const y = cy - r * Math.sin(angleRad);
    return `M15,90 A75,75 0 0,1 ${x.toFixed(2)},${y.toFixed(2)}`;
  });

  readonly filteredRecentAppointments = computed(() => {
    const list = this.recentAppointments();
    const period = this.statsPeriod();
    const now = new Date();

    // Calculate start date based on active period
    const startDate = new Date(now);
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      // "Esta semana": semana calendario (lunes a domingo), igual que el backend.
      startDate.setTime(this.startOfCalendarWeek(now).getTime());
    } else {
      // "Últimos 30 días": ventana móvil, igual que el backend.
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    return list.filter(appt => {
      const apptDate = new Date(appt.startsAt);
      return apptDate.getTime() >= startDate.getTime();
    });
  });

  private startOfCalendarWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }

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
      const start = this.startOfCalendarWeek(now);
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

  onPeriodChange(value: StatsPeriod): void {
    this.statsPeriod.set(value);
    this.loadSummary();
  }

  setAgendaView(view: AgendaView): void {
    this.agendaView.set(view);
  }

  goToNewAppointment(): void {
    this.router.navigate(['/dashboard/turnos'], { queryParams: { new: '1' } });
  }

  openAppointment(appointmentId: number): void {
    this.router.navigate(['/dashboard/turnos'], { queryParams: { appointmentId } });
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
        this.attendanceMarkedCount.set(summary.attendanceMarkedCount ?? 0);
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
