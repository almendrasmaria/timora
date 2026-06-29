import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureItemComponent } from '../../ui/feature-item/feature-item.component';
import { LogoComponent } from '../../ui/logo/logo.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink, FeatureItemComponent, LogoComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  @Input({ required: true }) headline!: string;
  @Input() eyebrow = '';
  @Input() features: string[] = [];
  @Input() headerActionLabel = '';
  @Input() headerActionLink = '';
}
