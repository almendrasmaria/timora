import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  BOOKING_STEPS,
  serviceMeta,
  servicePaymentLabel,
} from '../../../../core/public-booking/public-booking.config';
import { BookingStep, PublicBusiness, PublicService } from '../../../../core/public-booking/public-booking.models';
import { PublicBookingService } from '../../../../core/public-booking/public-booking.service';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './booking-page.component.html',
  styleUrl: './booking-page.component.scss',
})
export class BookingPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicBooking = inject(PublicBookingService);

  readonly steps = BOOKING_STEPS;
  readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';

  loading = true;
  notFound = false;
  business: PublicBusiness | null = null;

  readonly currentStep = signal<BookingStep>(1);
  readonly selectedServiceId = signal<number | null>(null);

  ngOnInit(): void {
    if (!this.slug) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    this.publicBooking.getBusiness(this.slug).subscribe({
      next: (business) => {
        this.business = business;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.notFound = error.status === 404;
        this.loading = false;
      },
    });
  }

  get businessInitial(): string {
    const name = this.business?.name.trim() ?? '';
    return name ? name.charAt(0).toUpperCase() : 'T';
  }

  get accentColor(): string {
    return this.business?.brandColor?.trim() || '#5b5bd6';
  }

  get progressPercent(): number {
    return (this.currentStep() / 3) * 100;
  }

  get currentStepLabel(): string {
    return this.steps.find((item) => item.step === this.currentStep())?.label ?? '';
  }

  get backStep(): BookingStep {
    return (this.currentStep() - 1) as BookingStep;
  }

  get showActions(): boolean {
    if (!this.business) {
      return false;
    }

    if (this.currentStep() === 1) {
      return this.business.services.length > 0;
    }

    return this.currentStep() === 2;
  }

  get selectedService(): PublicService | null {
    const id = this.selectedServiceId();
    return this.business?.services.find((service) => service.id === id) ?? null;
  }

  serviceMeta(service: PublicService): string {
    return serviceMeta(service);
  }

  servicePaymentLabel(service: PublicService): string {
    return servicePaymentLabel(service.depositAmount, service.price);
  }

  selectService(serviceId: number): void {
    this.selectedServiceId.set(serviceId);
  }

  isSelected(serviceId: number): boolean {
    return this.selectedServiceId() === serviceId;
  }

  goToStep(step: BookingStep): void {
    if (step === 2 && !this.selectedServiceId()) {
      return;
    }

    if (step === 3 && this.currentStep() < 2) {
      return;
    }

    this.currentStep.set(step);
  }

  continueFromServices(): void {
    if (!this.selectedServiceId()) {
      return;
    }

    this.currentStep.set(2);
  }

  stepState(step: BookingStep): 'done' | 'active' | 'upcoming' {
    const current = this.currentStep();

    if (step < current) {
      return 'done';
    }

    if (step === current) {
      return 'active';
    }

    return 'upcoming';
  }
}
