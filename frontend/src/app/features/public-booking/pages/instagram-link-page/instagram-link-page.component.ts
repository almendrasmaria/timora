import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PublicBookingService } from '../../../../core/public-booking/public-booking.service';

@Component({
  selector: 'app-instagram-link-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instagram-link-page.component.html',
  styleUrl: './instagram-link-page.component.scss'
})
export class InstagramLinkPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicBooking = inject(PublicBookingService);

  readonly business = signal<any>(null);
  readonly error = signal<string>('');

  ngOnInit(): void {
    const slug = this.route.parent?.snapshot.paramMap.get('slug');
    if (slug) {
      this.publicBooking.getBusiness(slug).subscribe({
        next: (data) => this.business.set(data),
        error: () => this.error.set('Negocio no encontrado')
      });
    }
  }

  getBrandGradient(): string {
    const raw = this.business()?.brandColor || '';
    if (raw.startsWith('linear-gradient')) return raw;
    return raw ? `linear-gradient(135deg, ${raw} 0%, ${raw} 100%)` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  getBrandBaseColor(): string {
    const raw = this.business()?.brandColor || '';
    if (raw.startsWith('linear-gradient')) {
      const match = raw.match(/#[0-9a-fA-F]{3,6}/);
      return match ? match[0] : '#667eea';
    }
    return raw || '#667eea';
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
