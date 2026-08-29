import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthCredentials,
  AuthResponse,
  AuthSession,
  ForgotPasswordRequest,
  GoogleAuthRequest,
  ResetPasswordRequest,
} from './auth.models';

const STORAGE_KEY = 'timora_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<AuthSession | null>(this.readStoredSession());

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly currentSession = this.session.asReadonly();

  token(): string | null {
    return this.session()?.accessToken ?? null;
  }

  onboardingCompleted(): boolean {
    return this.session()?.onboardingCompleted ?? false;
  }

  onboardingStep(): number {
    return this.session()?.onboardingStep ?? 1;
  }

  updateOnboarding(data: Partial<Pick<AuthSession, 'onboardingCompleted' | 'onboardingStep' | 'businessSlug'>>): void {
    const current = this.session();
    if (!current) {
      return;
    }

    const next: AuthSession = {
      ...current,
      ...data,
    };
    this.session.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  postAuthRedirect(): string[] {
    return this.onboardingCompleted() ? ['/dashboard'] : ['/onboarding', 'negocio'];
  }

  login(credentials: AuthCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(tap((response) => this.persistSession(response)));
  }

  register(credentials: AuthCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, credentials)
      .pipe(tap((response) => this.persistSession(response)));
  }

  loginWithGoogle(request: GoogleAuthRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/google`, request)
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/reset-password`, request);
  }

  private persistSession(response: AuthResponse): void {
    const session: AuthSession = {
      accessToken: response.accessToken,
      email: response.email,
      businessId: response.businessId,
      businessSlug: response.businessSlug,
      onboardingCompleted: response.onboardingCompleted,
      onboardingStep: response.onboardingStep,
    };
    this.session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private readStoredSession(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (!parsed.accessToken || !parsed.email) {
        return null;
      }
      return {
        accessToken: parsed.accessToken,
        email: parsed.email,
        businessId: parsed.businessId ?? 0,
        businessSlug: parsed.businessSlug ?? '',
        onboardingCompleted: parsed.onboardingCompleted ?? false,
        onboardingStep: parsed.onboardingStep ?? 1,
      };
    } catch {
      return null;
    }
  }
}
