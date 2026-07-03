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
