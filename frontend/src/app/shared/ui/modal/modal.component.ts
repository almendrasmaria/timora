import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ElementRef,
  Renderer2,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() title = '';
  @Input() closeOnBackdrop = true;
  /** 'lg' para formularios con muchos campos (ej. crear turno): más ancho en desktop para que las filas de 2 columnas respiren y haya menos scroll. */
  @Input() size: 'md' | 'lg' = 'md';
  @Output() closed = new EventEmitter<void>();

  readonly titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Move modal host element to document.body so position:fixed works correctly
    // regardless of stacking contexts (backdrop-filter, transform, etc.) in ancestors
    this.renderer.appendChild(document.body, this.el.nativeElement);
    // Prevent body scroll while modal is open
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  ngOnDestroy(): void {
    // Restore body scroll
    this.renderer.removeStyle(document.body, 'overflow');
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop) {
      this.closed.emit();
    }
  }
}
