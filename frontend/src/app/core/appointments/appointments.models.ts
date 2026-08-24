export type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

export interface Appointment {
  id: number;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string;
  clientEmail: string | null;
  notes: string | null;
  serviceId: number;
  serviceName: string;
  durationMinutes: number;
  professionalId: number;
  professionalName: string;
  branchId: number | null;
  branchName: string | null;
  branchAddress: string | null;
  startsAt: string;
  endsAt: string;
  price: number | null;
  depositAmount: number | null;
  status: AppointmentStatus;
  createdAt: string;
}

export interface AppointmentSummary {
  appointmentsCount: number;
  incomeTotal: number;
  noShowCount: number;
  attendanceMarkedCount: number;
}

export type AppointmentsView = 'day' | 'week' | 'month';

export interface CreatePublicAppointmentRequest {
  serviceId: number;
  professionalId: number;
  branchId?: number | null;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  notes?: string;
}
