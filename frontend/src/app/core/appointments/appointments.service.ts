import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatsPeriod } from '../dashboard/dashboard.config';
import {
  Appointment,
  AppointmentSummary,
  AppointmentsView,
  CreatePublicAppointmentRequest,
} from './appointments.models';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);

  getSummary(period: StatsPeriod): Observable<AppointmentSummary> {
    return this.http.get<AppointmentSummary>(`${environment.apiUrl}/appointments/summary`, {
      params: { period },
    });
  }

  listToday(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiUrl}/appointments/today`);
  }

  listRecent(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${environment.apiUrl}/appointments/recent`);
  }

  list(view: AppointmentsView, date?: string, status?: string): Observable<Appointment[]> {
    let params = new HttpParams().set('view', view);
    if (date) {
      params = params.set('date', date);
    }
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Appointment[]>(`${environment.apiUrl}/appointments`, { params });
  }

  markNoShow(id: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${environment.apiUrl}/appointments/${id}/no-show`, {});
  }

  update(id: number, payload: any): Observable<Appointment> {
    return this.http.put<Appointment>(`${environment.apiUrl}/appointments/${id}`, payload);
  }

  cancel(id: number): Observable<Appointment> {
    return this.http.patch<Appointment>(`${environment.apiUrl}/appointments/${id}/cancel`, {});
  }

  createPublic(slug: string, payload: CreatePublicAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(
      `${environment.apiUrl}/public/businesses/${slug}/appointments`,
      payload
    );
  }
}
