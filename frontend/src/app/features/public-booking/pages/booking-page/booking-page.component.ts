import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  BookableDate,
  formatScheduleRange,
  formatSelectedDate,
  getBookableDates,
  getTimeSlots,
} from '../../../../core/public-booking/booking-availability';
import {
  BOOKING_STEPS,
  buildWhatsappLink,
  confirmButtonLabel,
  resolveBookingPayment,
  serviceMeta,
  servicePaymentLabel,
} from '../../../../core/public-booking/public-booking.config';
import {
  BookingStep,
  PublicBranch,
  PublicBusiness,
  PublicProfessional,
  PublicService,
} from '../../../../core/public-booking/public-booking.models';
import { PublicBookingService } from '../../../../core/public-booking/public-booking.service';
import { AppointmentsService } from '../../../../core/appointments/appointments.service';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TextFieldComponent],
  templateUrl: './booking-page.component.html',
  styleUrl: './booking-page.component.scss',
})
export class BookingPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicBooking = inject(PublicBookingService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly formBuilder = inject(FormBuilder);

  readonly confirmForm = this.formBuilder.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', Validators.required],
    email: [''],
    notes: [''],
  });

  readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';

  loading = true;
  notFound = false;
  business: PublicBusiness | null = null;

  readonly currentStep = signal<BookingStep>(1);
  readonly selectedServiceId = signal<number | null>(null);
  readonly selectedBranchId = signal<number | null>(null);
  readonly selectedProfessionalId = signal<number | null>(null);
  readonly selectedDateKey = signal<string | null>(null);
  readonly selectedTimeSlot = signal<string | null>(null);
  readonly bookingConfirmed = signal(false);
  readonly confirmedClientName = signal('');
  readonly submitting = signal(false);

  get steps(): { step: BookingStep; label: string }[] {
    const hasBranches = (this.business?.branches?.length ?? 0) >= 2;
    if (hasBranches) {
      return [
        { step: 1, label: 'Servicio' },
        { step: 2, label: 'Sucursal' },
        { step: 3, label: 'Fecha' },
        { step: 4, label: 'Confirmar' },
      ];
    } else {
      return [
        { step: 1, label: 'Servicio' },
        { step: 2, label: 'Fecha' },
        { step: 3, label: 'Confirmar' },
      ];
    }
  }

  confirmSubmitAttempted = false;
  submitError = '';

  ngOnInit(): void {
    if (!this.slug) {
      this.notFound = true;
      this.loading = false;
      return;
    }

    this.publicBooking.getBusiness(this.slug).subscribe({
      next: (business) => {
        this.business = {
          ...business,
          professionals: business.professionals ?? [],
          branches: business.branches ?? [],
        };
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
    const raw = this.business?.brandColor?.trim() || '#5b5bd6';
    if (raw.startsWith('linear-gradient')) {
      const match = raw.match(/#[0-9a-fA-F]{3,6}/);
      return match ? match[0] : '#5b5bd6';
    }
    return raw;
  }

  get accentGradient(): string {
    const raw = this.business?.brandColor?.trim() || '';
    if (raw.startsWith('linear-gradient')) return raw;
    const color = raw || '#5b5bd6';
    return `linear-gradient(155deg, ${color} 0%, color-mix(in srgb, ${color} 82%, #1a1028) 100%)`;
  }

  get hasBranchesStep(): boolean {
    return (this.business?.branches?.length ?? 0) >= 2;
  }

  get sucursalStepNum(): number {
    return this.hasBranchesStep ? 2 : -1;
  }

  get fechaStepNum(): number {
    return this.hasBranchesStep ? 3 : 2;
  }

  get confirmarStepNum(): number {
    return this.hasBranchesStep ? 4 : 3;
  }

  get progressPercent(): number {
    if (this.bookingConfirmed()) {
      return 100;
    }
    const total = this.hasBranchesStep ? 4 : 3;
    return (this.currentStep() / total) * 100;
  }

  get currentStepLabel(): string {
    if (this.bookingConfirmed()) {
      return 'Confirmado';
    }
    return this.steps.find((item) => item.step === this.currentStep())?.label ?? '';
  }

  get backStep(): BookingStep {
    return (this.currentStep() - 1) as BookingStep;
  }

  get showActions(): boolean {
    if (!this.business) {
      return false;
    }
    if (this.bookingConfirmed()) {
      return false;
    }

    if (this.currentStep() === 1) {
      return this.business.services.length > 0;
    }
    if (this.currentStep() === this.sucursalStepNum) {
      return this.business.branches.length > 0;
    }
    if (this.currentStep() === this.fechaStepNum) {
      return this.filteredProfessionals.length > 0;
    }
    return this.currentStep() === this.confirmarStepNum;
  }

  get selectedService(): PublicService | null {
    const id = this.selectedServiceId();
    return this.business?.services.find((service) => service.id === id) ?? null;
  }

  get selectedProfessional(): PublicProfessional | null {
    const id = this.selectedProfessionalId();
    return this.business?.professionals.find((professional) => professional.id === id) ?? null;
  }

  get hasMultipleProfessionals(): boolean {
    return (this.filteredProfessionals.length ?? 0) > 1;
  }

  get bookableDates(): BookableDate[] {
    const professional = this.selectedProfessional;
    const branchId = this.selectedBranchId();
    if (!professional) {
      return [];
    }

    return getBookableDates(professional.availabilityJson, branchId);
  }

  get timeSlots(): string[] {
    const professional = this.selectedProfessional;
    const service = this.selectedService;
    const dateKey = this.selectedDateKey();
    const branchId = this.selectedBranchId();

    if (!professional || !service || !dateKey) {
      return [];
    }

    return getTimeSlots(professional.availabilityJson, dateKey, service.durationMinutes, branchId);
  }

  get canContinueFromSchedule(): boolean {
    return Boolean(this.selectedDateKey() && this.selectedTimeSlot());
  }

  get selectedDateLabel(): string {
    const dateKey = this.selectedDateKey();
    return dateKey ? formatSelectedDate(dateKey) : '';
  }

  get selectedScheduleLabel(): string {
    const service = this.selectedService;
    const dateKey = this.selectedDateKey();
    const startTime = this.selectedTimeSlot();

    if (!service || !dateKey || !startTime) {
      return '';
    }

    return formatScheduleRange(dateKey, startTime, service.durationMinutes);
  }

  get selectedBranch(): PublicBranch | null {
    if (!this.business || this.business.branches.length === 0) {
      return null;
    }
    if (!this.hasBranchesStep) {
      return this.business.branches[0];
    }
    const id = this.selectedBranchId();
    return this.business.branches.find((b) => b.id === id) ?? null;
  }

  get branchLabel(): string | null {
    const branch = this.selectedBranch;
    if (!branch) {
      return null;
    }
    return `${branch.name} / ${branch.address}`;
  }

  get filteredProfessionals(): PublicProfessional[] {
    const branch = this.selectedBranch;
    const all = this.business?.professionals ?? [];
    if (!branch) return all;
    return all.filter((pro) => !pro.branchIds || pro.branchIds.length === 0 || pro.branchIds.includes(branch.id));
  }

  get bookingPayment() {
    const service = this.selectedService;
    const paymentMethods = this.business?.paymentMethods ?? [];

    if (!service) {
      return null;
    }

    return resolveBookingPayment(paymentMethods, service);
  }

  get confirmLabel(): string {
    const service = this.selectedService;
    const paymentMethods = this.business?.paymentMethods ?? [];

    if (!service) {
      return 'Confirmar reserva';
    }

    return confirmButtonLabel(paymentMethods, service);
  }

  get whatsappLink(): string | null {
    return buildWhatsappLink(this.business?.whatsapp);
  }

  get canConfirmBooking(): boolean {
    return this.confirmForm.valid && this.canContinueFromSchedule;
  }

  fieldError(controlName: 'firstName' | 'lastName' | 'phone' | 'email'): string {
    const control = this.confirmForm.controls[controlName];

    if (!control.touched && !this.confirmSubmitAttempted) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Completá este campo';
    }

    if (controlName === 'email' && control.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(control.value)) {
      return 'Ingresá un email válido';
    }

    return '';
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

  selectProfessional(professionalId: number): void {
    this.selectedProfessionalId.set(professionalId);
    this.resetScheduleSelection();
  }

  selectDate(dateKey: string): void {
    this.selectedDateKey.set(dateKey);
    this.selectedTimeSlot.set(null);
  }

  selectTimeSlot(slot: string): void {
    this.selectedTimeSlot.set(slot);
  }

  goToStep(step: BookingStep): void {
    if (step === 1) {
      this.currentStep.set(step);
      return;
    }

    if (this.hasBranchesStep) {
      if (step === 2 && !this.selectedServiceId()) {
        return;
      }
      if (step === 3 && (!this.selectedServiceId() || !this.selectedBranchId())) {
        return;
      }
      if (step === 4 && !this.canContinueFromSchedule) {
        return;
      }
    } else {
      if (step === 2 && !this.selectedServiceId()) {
        return;
      }
      if (step === 3 && !this.canContinueFromSchedule) {
        return;
      }
    }

    this.currentStep.set(step);
  }

  continueFromServices(): void {
    if (!this.selectedServiceId()) {
      return;
    }
    if (this.hasBranchesStep) {
      this.currentStep.set(2);
    } else {
      this.initializeScheduleStep();
      this.currentStep.set(2);
    }
  }

  selectBranch(branchId: number): void {
    this.selectedBranchId.set(branchId);
  }

  isBranchSelected(branchId: number): boolean {
    return this.selectedBranchId() === branchId;
  }

  continueFromBranch(): void {
    if (!this.selectedBranchId()) {
      return;
    }
    this.initializeScheduleStep();
    this.currentStep.set(3);
  }

  continueFromSchedule(): void {
    if (!this.canContinueFromSchedule) {
      return;
    }

    this.confirmSubmitAttempted = false;
    this.currentStep.set(this.confirmarStepNum as BookingStep);
  }

  submitBooking(): void {
    this.confirmSubmitAttempted = true;
    this.submitError = '';
    this.confirmForm.markAllAsTouched();

    if (!this.canConfirmBooking || this.submitting()) {
      return;
    }

    const service = this.selectedService;
    const professional = this.selectedProfessional;
    const dateKey = this.selectedDateKey();
    const time = this.selectedTimeSlot();

    if (!service || !professional || !dateKey || !time) {
      return;
    }

    const form = this.confirmForm.getRawValue();
    this.submitting.set(true);

    this.appointmentsService
      .createPublic(this.slug, {
        serviceId: service.id,
        professionalId: professional.id,
        branchId: this.selectedBranch?.id ?? null,
        date: dateKey,
        time,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        notes: form.notes || undefined,
      })
      .subscribe({
        next: () => {
          this.confirmedClientName.set(`${form.firstName} ${form.lastName}`.trim());
          this.bookingConfirmed.set(true);
          this.submitting.set(false);
        },
        error: (error) => {
          this.submitting.set(false);
          this.submitError =
            error.error?.message ?? 'No pudimos confirmar tu reserva. Probá de nuevo.';
        },
      });
  }

  startNewBooking(): void {
    this.bookingConfirmed.set(false);
    this.confirmedClientName.set('');
    this.confirmSubmitAttempted = false;
    this.confirmForm.reset();
    this.selectedServiceId.set(null);
    this.selectedBranchId.set(null);
    this.selectedProfessionalId.set(null);
    this.selectedDateKey.set(null);
    this.selectedTimeSlot.set(null);
    this.currentStep.set(1);
  }

  stepState(step: BookingStep): 'done' | 'active' | 'upcoming' {
    if (this.bookingConfirmed()) {
      return 'done';
    }

    const current = this.currentStep();

    if (step < current) {
      return 'done';
    }

    if (step === current) {
      return 'active';
    }

    return 'upcoming';
  }

  private initializeScheduleStep(): void {
    const professionals = this.filteredProfessionals;
    const currentProfessionalId = this.selectedProfessionalId();
    const hasCurrent = professionals.some((professional) => professional.id === currentProfessionalId);

    if (!hasCurrent && professionals.length > 0) {
      this.selectedProfessionalId.set(professionals[0].id);
    } else if (professionals.length === 0) {
      this.selectedProfessionalId.set(null);
    }

    this.resetScheduleSelection();
  }

  private resetScheduleSelection(): void {
    const dates = this.bookableDates;
    this.selectedDateKey.set(dates[0]?.key ?? null);
    this.selectedTimeSlot.set(null);
  }
}
