import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../ui/logo/logo.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {}
