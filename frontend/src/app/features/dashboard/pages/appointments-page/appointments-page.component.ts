import { Component, OnInit, inject, signal } from '@angular/core';
import {
  appointmentClientName,
  appointmentStatusLabel,
  canMarkNoShow,
  formatAppointmentDate,
  formatAppointmentDateLong,
  formatAppointmentRange,
} from '../../../../core/appointments/appointments.format';
import { Appointment, AppointmentsView } from '../../../../core/appointments/appointments.models';
import { AppointmentsService } from '../../../../core/appointments/appointments.service';

type StatusFilter = 'all' | 'NO_SHOW';

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss',
})
export class AppointmentsPageComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);

  readonly viewOptions: { value: AppointmentsView; label: string }[] = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ];

  readonly view = signal<AppointmentsView>('week');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.loadAppointments();
  }

  get viewLabel(): string {
    const current = this.view();
    if (current === 'day') {
      return formatAppointmentDateLong(new Date().toISOString());
    }

    if (current === 'month') {
      return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date());
    }

    return 'Esta semana';
  }

  clientName(appointment: Appointment): string {
    return appointmentClientName(appointment);
  }

  statusLabel(appointment: Appointment): string {
    return appointmentStatusLabel(appointment.status);
  }

  scheduleLabel(appointment: Appointment): string {
    return `${formatAppointmentDate(appointment.startsAt)} · ${formatAppointmentRange(
      appointment.startsAt,
      appointment.endsAt
    )}`;
  }

  canMarkNoShow(appointment: Appointment): boolean {
    return canMarkNoShow(appointment);
  }

  setView(view: AppointmentsView): void {
    this.view.set(view);
    this.loadAppointments();
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
    this.loadAppointments();
  }

  markNoShow(appointment: Appointment): void {
    this.appointmentsService.markNoShow(appointment.id).subscribe({
      next: (updated) => {
        this.appointments.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item))
        );
      },
    });
  }

  private loadAppointments(): void {
    this.loading.set(true);
    const status = this.statusFilter() === 'NO_SHOW' ? 'NO_SHOW' : undefined;

    this.appointmentsService.list(this.view(), undefined, status).subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
