import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UpdateSettingsRequest {
  name: string;
  whatsapp?: string;
  instagram?: string;
  brandColor?: string;
  showWhatsappToClients: boolean;
  reminderTemplate?: string;
  bioLinkText?: string;
  bioShowBooking: boolean;
  bioShowLocation: boolean;
  bioShowWhatsapp: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly http = inject(HttpClient);

  updateSettings(data: UpdateSettingsRequest): Observable<any> {
    return this.http.put(`${environment.apiUrl}/business-config/settings`, data);
  }

  uploadLogo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${environment.apiUrl}/business-config/logo`, formData);
  }
}
