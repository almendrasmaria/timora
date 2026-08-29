import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const google: any;

const SIGN_IN_TIMEOUT_MS = 60000;

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private initialized = false;
  private pendingResolve: ((idToken: string) => void) | null = null;
  private pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private ensureInitialized(): void {
    if (this.initialized) {
      return;
    }
    if (typeof google === 'undefined' || !google.accounts?.id) {
      throw new Error('Google todavía no está disponible. Probá de nuevo en unos segundos.');
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        if (this.pendingTimeoutId) {
          clearTimeout(this.pendingTimeoutId);
          this.pendingTimeoutId = null;
        }
        const resolve = this.pendingResolve;
        this.pendingResolve = null;
        resolve?.(response.credential);
      },
    });
    this.initialized = true;
  }

  signIn(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        this.ensureInitialized();
      } catch (error) {
        reject(error as Error);
        return;
      }

      this.pendingResolve = resolve;
      this.pendingTimeoutId = setTimeout(() => {
        this.pendingTimeoutId = null;
        if (this.pendingResolve) {
          this.pendingResolve = null;
          reject(new Error('Se canceló el inicio de sesión con Google.'));
        }
      }, SIGN_IN_TIMEOUT_MS);

      google.accounts.id.prompt();
    });
  }
}
