import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-feature-item',
  standalone: true,
  templateUrl: './feature-item.component.html',
  styleUrl: './feature-item.component.scss',
})
export class FeatureItemComponent {
  @Input({ required: true }) text!: string;
}
