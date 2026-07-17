import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../core/confirm/confirm.service';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    @if (config()) {
      <app-modal [title]="config()!.title" (closed)="onCancel()">
        <p class="confirm-message">{{ config()!.message }}</p>
        
        <div modal-actions class="confirm-actions">
          <app-button variant="secondary" (click)="onCancel()">
            {{ config()!.cancelText || 'Cancelar' }}
          </app-button>
          <app-button 
            [variant]="config()!.isDestructive ? 'danger' : 'primary'" 
            (click)="onConfirm()"
          >
            {{ config()!.confirmText || 'Confirmar' }}
          </app-button>
        </div>
      </app-modal>
    }
  `,
  styles: [`
    .confirm-message {
      margin: 0;
      color: var(--color-text);
      font-size: var(--text-base, 1rem);
      line-height: 1.5;
    }
    .confirm-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      width: 100%;
    }
  `]
})
export class ConfirmModalComponent {
  private readonly confirmService = inject(ConfirmService);
  readonly config = this.confirmService.config;

  onCancel(): void {
    this.confirmService.respond(false);
  }

  onConfirm(): void {
    this.confirmService.respond(true);
  }
}
