import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PublicBusiness } from './public-booking.models';

@Injectable({ providedIn: 'root' })
export class PublicBookingService {
  private readonly http = inject(HttpClient);

  getBusiness(slug: string): Observable<PublicBusiness> {
    return this.http.get<PublicBusiness>(`${environment.apiUrl}/public/businesses/${slug}`);
  }
}
