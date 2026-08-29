import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private initialized = false;
  private pendingResolve: ((idToken: string) => void) | null = null;
  private pendingReject: ((reason: Error) => void) | null = null;

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
        const resolve = this.pendingResolve;
        this.pendingResolve = null;
        this.pendingReject = null;
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
      this.pendingReject = reject;

      google.accounts.id.prompt((notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => {
        const blocked = notification.isNotDisplayed?.() || notification.isSkippedMoment?.();
        if (blocked && this.pendingReject) {
          const reject2 = this.pendingReject;
          this.pendingResolve = null;
          this.pendingReject = null;
          reject2(new Error('No pudimos abrir el selector de cuentas de Google. Probá de nuevo.'));
        }
      });
    });
  }
}
