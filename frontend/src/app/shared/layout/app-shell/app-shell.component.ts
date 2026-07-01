import { Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DASHBOARD_NAV } from '../../../core/dashboard/dashboard.config';
import { AuthService } from '../../../core/auth/auth.service';
import { OnboardingService } from '../../../core/onboarding/onboarding.service';
import { LogoComponent } from '../../ui/logo/logo.component';

@Component({
  selector: 'app-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly nav = DASHBOARD_NAV;
  readonly mobileMenuOpen = signal(false);

  businessName = '';
  bookingUrl = '';

  get businessInitial(): string {
    const name = this.businessName.trim();
    return name ? name.charAt(0).toUpperCase() : 'T';
  }

  get bookingSlug(): string {
    return this.bookingUrl.replace(/^\//, '');
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.closeMobileMenu());

    this.onboarding.getState().subscribe({
      next: (state) => {
        this.businessName = state.business.name;
        this.bookingUrl = state.business.slug ? `/${state.business.slug}` : '';
      },
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
