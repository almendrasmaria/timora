import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthCredentials, AuthResponse, AuthSession } from './auth.models';

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

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private persistSession(response: AuthResponse): void {
    const session: AuthSession = {
      accessToken: response.accessToken,
      email: response.email,
      businessId: response.businessId,
      businessSlug: response.businessSlug,
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
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed.accessToken || !parsed.email) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
