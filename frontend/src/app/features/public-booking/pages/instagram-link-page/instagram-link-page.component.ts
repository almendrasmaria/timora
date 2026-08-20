import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PublicBookingService } from '../../../../core/public-booking/public-booking.service';
import { LogoComponent } from '../../../../shared/ui/logo/logo.component';

@Component({
  selector: 'app-instagram-link-page',
  standalone: true,
  imports: [CommonModule, LogoComponent],
  templateUrl: './instagram-link-page.component.html',
  styleUrl: './instagram-link-page.component.scss'
})
export class InstagramLinkPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicBooking = inject(PublicBookingService);

  readonly business = signal<any>(null);
  readonly error = signal<string>('');
  readonly shareLabel = signal<string>('Compartir');

  ngOnInit(): void {
    const slug = this.route.parent?.snapshot.paramMap.get('slug');
    if (slug) {
      this.publicBooking.getBusiness(slug).subscribe({
        next: (data) => this.business.set(data),
        error: () => this.error.set('Negocio no encontrado')
      });
    }
  }

  private getPageUrl(): string {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }

  async share(): Promise<void> {
    const url = this.getPageUrl();
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({ title: this.business()?.name, url });
        return;
      } catch {
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      this.shareLabel.set('¡Copiado!');
      window.setTimeout(() => this.shareLabel.set('Compartir'), 2000);
    }
  }

  getBrandGradient(): string {
    const raw = this.business()?.brandColor || '';
    if (raw.startsWith('linear-gradient')) return raw;
    return raw || '#004AAD';
  }

  getBrandBaseColor(): string {
    const raw = this.business()?.brandColor || '';
    if (raw.startsWith('linear-gradient')) {
      const match = raw.match(/#[0-9a-fA-F]{3,6}/);
      return match ? match[0] : '#004AAD';
    }
    return raw || '#004AAD';
  }

  getBookingUrl(): string {
    const slug = this.route.parent?.snapshot.paramMap.get('slug');
    return `/${slug}`;
  }

  getWhatsappUrl(phone: string): string {
    const clean = phone.replace(/\D/g, '');
    return `https://wa.me/${clean}`;
  }

  getMapsUrl(branches: any[]): string {
    if (!branches || branches.length === 0) return '#';
    const address = encodeURIComponent(branches[0].address);
    return `https://www.google.com/maps/search/?api=1&query=${address}`;
  }
}
