import { Component, Input } from '@angular/core';

export type LogoSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-logo',
  standalone: true,
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent {
  @Input() size: LogoSize = 'md';
}
