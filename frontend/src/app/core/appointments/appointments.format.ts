import { Appointment, AppointmentStatus } from './appointments.models';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado',
  NO_SHOW: 'No-show',
  CANCELLED: 'Cancelado',
};

export function appointmentClientName(appointment: Appointment): string {
  return `${appointment.clientFirstName} ${appointment.clientLastName}`.trim();
}

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return STATUS_LABELS[status];
}

export function formatAppointmentTime(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso));
}

export function formatAppointmentDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso));
}

export function formatAppointmentDateLong(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso));
}

export function formatAppointmentRange(startsAt: string, endsAt: string): string {
  return `${formatAppointmentTime(startsAt)} – ${formatAppointmentTime(endsAt)}`;
}

export function formatIncome(value: number): string {
  if (value >= 1_000_000) {
    return `$${Math.round(value / 100_000) / 10}M`;
  }

  if (value >= 1_000) {
    return `$${Math.round(value / 100) / 10}k`;
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function canMarkNoShow(appointment: Appointment): boolean {
  if (appointment.status !== 'CONFIRMED') {
    return false;
  }

  return new Date(appointment.endsAt).getTime() <= Date.now();
}
