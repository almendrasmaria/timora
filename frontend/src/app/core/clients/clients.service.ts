import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment } from '../appointments/appointments.models';

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  appointmentsCount: number;
}

export interface ClientDetail extends Client {
  appointments: Appointment[];
}

export interface ClientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);

  getAll(query?: string, professionalId?: number): Observable<Client[]> {
    let params = new HttpParams();
    if (query) {
      params = params.set('query', query.trim());
    }
    if (professionalId) {
      params = params.set('professionalId', professionalId.toString());
    }
    return this.http.get<Client[]>(`${environment.apiUrl}/clients`, { params });
  }

  getById(id: number): Observable<ClientDetail> {
    return this.http.get<ClientDetail>(`${environment.apiUrl}/clients/${id}`);
  }

  create(client: ClientRequest): Observable<Client> {
    return this.http.post<Client>(`${environment.apiUrl}/clients`, client);
  }

  update(id: number, client: ClientRequest): Observable<Client> {
    return this.http.put<Client>(`${environment.apiUrl}/clients/${id}`, client);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/clients/${id}`);
  }
}
