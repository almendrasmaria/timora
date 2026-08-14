import { Component, ElementRef, HostListener, OnInit, inject, signal, viewChild } from '@angular/core';
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
  readonly userMenuOpen = signal(false);
  readonly sidebarCollapsed = signal(false);
  private readonly userMenuRef = viewChild<ElementRef<HTMLElement>>('userMenu');

  businessName = '';
  bookingUrl = '';
  private currentPath = '';

  get businessInitial(): string {
    const name = this.businessName.trim();
    return name ? name.charAt(0).toUpperCase() : 'T';
  }

  get bookingSlug(): string {
    return this.bookingUrl.replace(/^\//, '');
  }

  get activePageLabel(): string {
    const path = this.currentPath || this.router.url;
    const match = this.nav.find((item) => path.includes(item.path));
    return match ? match.label : 'Inicio';
  }

  get activePageIcon(): string {
    const path = this.currentPath || this.router.url;
    const match = this.nav.find((item) => path.includes(item.path));
    return match ? match.svgPath : 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z';
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentPath = (event as NavigationEnd).urlAfterRedirects;
        this.closeMobileMenu();
        this.closeUserMenu();
      });

    this.onboarding.getState().subscribe({
      next: (state) => {
        this.businessName = state.business.name;
        this.bookingUrl = state.business.slug ? `/${state.business.slug}` : '';
      },
    });
  }

  toggleMobileMenu(): void {
    this.closeUserMenu();
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleSidebar(): void {
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(next));
    }
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) {
      return;
    }

    const menu = this.userMenuRef()?.nativeElement;
    if (menu?.contains(event.target as Node)) {
      return;
    }

    this.closeUserMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeUserMenu();
  }

  logout(): void {
    this.closeUserMenu();
    this.closeMobileMenu();
    this.auth.logout();
    void this.router.navigate(['/auth/login']);
  }
}
