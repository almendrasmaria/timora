import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmModalConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly config = signal<ConfirmModalConfig | null>(null);
  private responseSubject = new Subject<boolean>();

  confirm(config: ConfirmModalConfig): Promise<boolean> {
    this.config.set(config);
    this.responseSubject = new Subject<boolean>();
    return new Promise((resolve) => {
      this.responseSubject.subscribe((res) => {
        this.config.set(null);
        resolve(res);
      });
    });
  }

  respond(res: boolean): void {
    this.responseSubject.next(res);
    this.responseSubject.complete();
  }
}
