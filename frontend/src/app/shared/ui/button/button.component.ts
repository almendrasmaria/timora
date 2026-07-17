import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonShape = 'default' | 'pill';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() shape: ButtonShape = 'default';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;
}
