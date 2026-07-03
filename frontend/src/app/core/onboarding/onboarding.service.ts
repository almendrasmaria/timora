import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import {
  BusinessCategory,
  OnboardingState,
  PaymentMethodType,
} from './onboarding.models';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  getState(): Observable<OnboardingState> {
    return this.http
      .get<OnboardingState>(`${environment.apiUrl}/onboarding`)
      .pipe(tap((state) => this.syncSession(state)));
  }

  updateBusiness(name: string, category: BusinessCategory, specialty?: string): Observable<OnboardingState> {
    return this.http
      .put<OnboardingState>(`${environment.apiUrl}/onboarding/business`, { name, category, specialty })
      .pipe(tap((state) => this.syncSession(state)));
  }

  updateContact(whatsapp: string, instagram?: string): Observable<OnboardingState> {
    return this.http
      .put<OnboardingState>(`${environment.apiUrl}/onboarding/contact`, { whatsapp, instagram })
      .pipe(tap((state) => this.syncSession(state)));
  }

  updateBrand(slug: string, brandColor?: string): Observable<OnboardingState> {
    return this.http
      .put<OnboardingState>(`${environment.apiUrl}/onboarding/brand`, { slug, brandColor })
      .pipe(tap((state) => this.syncSession(state)));
  }

  addBranch(name: string, address: string): Observable<OnboardingState> {
    return this.http
      .post<OnboardingState>(`${environment.apiUrl}/onboarding/branches`, { name, address })
      .pipe(tap((state) => this.syncSession(state)));
  }

  deleteBranch(id: number): Observable<OnboardingState> {
    return this.http
      .delete<OnboardingState>(`${environment.apiUrl}/onboarding/branches/${id}`)
      .pipe(tap((state) => this.syncSession(state)));
  }

  addProfessional(data: {
    firstName: string;
    lastName: string;
    availabilityJson?: string;
    branchIds?: number[];
  }): Observable<OnboardingState> {
    return this.http
      .post<OnboardingState>(`${environment.apiUrl}/onboarding/professionals`, data)
      .pipe(tap((state) => this.syncSession(state)));
  }

  deleteProfessional(id: number): Observable<OnboardingState> {
    return this.http
      .delete<OnboardingState>(`${environment.apiUrl}/onboarding/professionals/${id}`)
      .pipe(tap((state) => this.syncSession(state)));
  }

  addService(data: {
    name: string;
    durationMinutes: number;
    price?: number | null;
    depositAmount?: number | null;
  }): Observable<OnboardingState> {
    return this.http
      .post<OnboardingState>(`${environment.apiUrl}/onboarding/services`, data)
      .pipe(tap((state) => this.syncSession(state)));
  }

  deleteService(id: number): Observable<OnboardingState> {
    return this.http
      .delete<OnboardingState>(`${environment.apiUrl}/onboarding/services/${id}`)
      .pipe(tap((state) => this.syncSession(state)));
  }

  addPaymentMethod(type: PaymentMethodType): Observable<OnboardingState> {
    return this.http
      .post<OnboardingState>(`${environment.apiUrl}/onboarding/payment-methods`, { type })
      .pipe(tap((state) => this.syncSession(state)));
  }

  deletePaymentMethod(id: number): Observable<OnboardingState> {
    return this.http
      .delete<OnboardingState>(`${environment.apiUrl}/onboarding/payment-methods/${id}`)
      .pipe(tap((state) => this.syncSession(state)));
  }

  updateBranch(id: number, name: string, address: string): Observable<OnboardingState> {
    return this.http
      .put<OnboardingState>(`${environment.apiUrl}/onboarding/branches/${id}`, { name, address })
      .pipe(tap((state) => this.syncSession(state)));
  }

  updateProfessional(
    id: number,
    data: {
      firstName: string;
      lastName: string;
      availabilityJson?: string;
      branchIds?: number[];
    }
  ): Observable<OnboardingState> {
    return this.http
      .put<OnboardingState>(`${environment.apiUrl}/onboarding/professionals/${id}`, data)
      .pipe(tap((state) => this.syncSession(state)));
  }

  updateService(
    id: number,
    data: {
      name: string;
      durationMinutes: number;
      price?: number | null;
      depositAmount?: number | null;
    }
  ): Observable<OnboardingState> {
    return this.http
      .put<OnboardingState>(`${environment.apiUrl}/onboarding/services/${id}`, data)
      .pipe(tap((state) => this.syncSession(state)));
  }

  finish(): Observable<OnboardingState> {
    return this.http
      .post<OnboardingState>(`${environment.apiUrl}/onboarding/finish`, {})
      .pipe(tap((state) => this.syncSession(state)));
  }

  private syncSession(state: OnboardingState): void {
    this.auth.updateOnboarding({
      onboardingCompleted: state.completed,
      onboardingStep: state.currentStep,
      businessSlug: state.business.slug,
    });
  }
}
