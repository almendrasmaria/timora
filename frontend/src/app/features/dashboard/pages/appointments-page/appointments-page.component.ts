import { Component, OnInit, inject, signal, computed } from '@angular/core';
import {
  appointmentClientName,
  appointmentStatusLabel,
  canMarkNoShow,
  formatAppointmentDateLong,
  formatAppointmentRange,
  formatIncome,
} from '../../../../core/appointments/appointments.format';
import { Appointment, AppointmentStatus, AppointmentsView } from '../../../../core/appointments/appointments.models';
import { AppointmentsService } from '../../../../core/appointments/appointments.service';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AppointmentGroup {
  dateKey: string;
  dateLabel: string;
  items: Appointment[];
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'var(--color-primary)',
  COMPLETED: 'var(--color-success)',
  NO_SHOW: 'var(--color-error)',
  CANCELLED: 'var(--color-text-muted)',
};

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss',
})
export class AppointmentsPageComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly onboardingService = inject(OnboardingService);

  readonly viewOptions: { value: AppointmentsView; label: string }[] = [
    { value: 'day',   label: 'Hoy' },
    { value: 'week',  label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ];

  readonly view               = signal<AppointmentsView>('week');
  readonly appointments       = signal<Appointment[]>([]);
  readonly loading            = signal(true);
  readonly selectedAppointment = signal<Appointment | null>(null);
  readonly isEditing          = signal<boolean>(false);

  // Lists for dropdown selectors
  readonly services = signal<any[]>([]);
  readonly professionals = signal<any[]>([]);
  readonly businessName = signal<string>('');
  readonly reminderTemplate = signal<string>('');

  // Edit form state fields
  editServiceId = signal<number | null>(null);
  editProfessionalId = signal<number | null>(null);
  editDate = signal<string>('');
  editTime = signal<string>('');
  editPrice = signal<number | null>(null);
  editDepositAmount = signal<number | null>(null);

  // Inline price & payment actions
  isEditingPrice = signal<boolean>(false);
  inlinePrice = 0;
  showPaymentMenu = signal<boolean>(false);
  showRegisterPaymentModal = signal<boolean>(false);
  registerPaymentAmount = 0;

  readonly grouped = computed<AppointmentGroup[]>(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of this.appointments()) {
      const d    = new Date(a.startsAt);
      const key  = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    const groups: AppointmentGroup[] = [];
    map.forEach((items, dateKey) =>
      groups.push({ dateKey, dateLabel: this.formatGroupDate(items[0].startsAt), items })
    );
    return groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  });

  get viewLabel(): string {
    const v = this.view();
    if (v === 'day')   return 'Hoy, ' + new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' }).format(new Date());
    if (v === 'month') return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date());
    return 'Esta semana';
  }

  ngOnInit(): void {
    this.load();
    this.onboardingService.getState().subscribe({
      next: (state) => {
        this.services.set(state.services || []);
        this.professionals.set(state.professionals || []);
        this.businessName.set(state.business?.name || '');
        this.reminderTemplate.set(
          state.business?.reminderTemplate ||
            '¡Hola! Recordá tu turno en {negocio} el {fecha} a las {hora} con {profesional}. ¡Te esperamos!'
        );
      },
    });
  }

  setView(v: AppointmentsView): void { this.view.set(v); this.load(); }

  openDetail(a: Appointment): void   {
    this.selectedAppointment.set(a);
    this.isEditing.set(false);
    this.isEditingPrice.set(false);
    this.showPaymentMenu.set(false);
    this.showRegisterPaymentModal.set(false);
    this.editServiceId.set(a.serviceId);
    this.editProfessionalId.set(a.professionalId);
    this.editPrice.set(a.price);
    this.editDepositAmount.set(a.depositAmount);

    const d = new Date(a.startsAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.editDate.set(`${year}-${month}-${day}`);

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    this.editTime.set(`${hours}:${minutes}`);
  }

  closeDetail(): void                { this.selectedAppointment.set(null); }

  togglePaymentMenu(): void {
    this.showPaymentMenu.update(v => !v);
  }

  editPriceInline(a: Appointment): void {
    this.inlinePrice = a.price ?? 0;
    this.isEditingPrice.set(true);
    this.showPaymentMenu.set(false);
  }

  cancelInlinePrice(): void {
    this.isEditingPrice.set(false);
  }

  saveInlinePrice(a: Appointment): void {
    this.appointmentsService.update(a.id, { price: this.inlinePrice }).subscribe({
      next: (updated) => {
        this.selectedAppointment.set(updated);
        this.appointments.update(list => list.map(item => item.id === updated.id ? updated : item));
        this.isEditingPrice.set(false);
      }
    });
  }

  openRegisterPayment(a: Appointment): void {
    this.registerPaymentAmount = this.pendingAmount(a);
    this.showRegisterPaymentModal.set(true);
    this.showPaymentMenu.set(false);
  }

  submitRegisterPayment(a: Appointment): void {
    const currentPrice = a.price ?? 0;
    const currentDeposit = a.depositAmount ?? 0;
    const addedAmount = Number(this.registerPaymentAmount) || 0;
    const newDeposit = currentDeposit + addedAmount;
    
    // If the new deposit covers the price, mark it completed. Otherwise keep it as is.
    const newStatus = newDeposit >= currentPrice ? 'COMPLETED' : a.status;

    const payload = {
      serviceId: a.serviceId,
      professionalId: a.professionalId,
      startsAt: a.startsAt,
      price: a.price,
      depositAmount: newDeposit,
      status: newStatus
    };

    this.appointmentsService.update(a.id, payload).subscribe({
      next: (updated) => {
        this.selectedAppointment.set(updated);
        this.appointments.update(list => list.map(item => item.id === updated.id ? updated : item));
        this.showRegisterPaymentModal.set(false);
      }
    });
  }

  // ── Template helpers ──────────────────────────────────────────
  name(a: Appointment): string      { return appointmentClientName(a); }
  initials(a: Appointment): string  {
    return ((a.clientFirstName?.[0] ?? '') + (a.clientLastName?.[0] ?? '')).toUpperCase() || '?';
  }
  statusLabel(a: Appointment): string  { return appointmentStatusLabel(a.status); }
  accent(s: AppointmentStatus): string { return STATUS_COLORS[s] ?? 'var(--color-text-muted)'; }
  timeRange(a: Appointment): string    {
    return formatAppointmentRange(a.startsAt, a.endsAt).replace(/\./g, '').trim();
  }
  price(a: Appointment): string | null { return a.price != null ? formatIncome(a.price) : null; }
  canNoShow(a: Appointment): boolean   { return canMarkNoShow(a); }

  dateLabel(a: Appointment): string    { return formatAppointmentDateLong(a.startsAt); }
  duration(a: Appointment): string {
    const m = a.durationMinutes;
    if (m >= 60) { const h = Math.floor(m / 60); const r = m % 60; return r ? `${h}h ${r}min` : `${h}h`; }
    return `${m}min`;
  }

  receivedAmount(a: Appointment): number {
    if (a.status === 'COMPLETED') return a.price ?? 0;
    return a.depositAmount ?? 0;
  }

  pendingAmount(a: Appointment): number {
    if (a.status === 'COMPLETED' || a.status === 'CANCELLED') return 0;
    const total = a.price ?? 0;
    const received = a.depositAmount ?? 0;
    return Math.max(total - received, 0);
  }

  get editReceived(): number {
    if (this.selectedAppointment()?.status === 'COMPLETED') return this.editPrice() || 0;
    return this.editDepositAmount() || 0;
  }

  get editPending(): number {
    if (this.selectedAppointment()?.status === 'COMPLETED' || this.selectedAppointment()?.status === 'CANCELLED') return 0;
    const total = this.editPrice() || 0;
    const received = this.editReceived;
    return Math.max(total - received, 0);
  }

  formatValue(val: number): string {
    return formatIncome(val);
  }

  proDisplayName(p: any): string {
    return `${p.firstName} ${p.lastName}`.trim();
  }

  whatsappReminderUrl(a: Appointment): string | null {
    if (!a.clientPhone) return null;
    let p = a.clientPhone.replace(/\D/g, '');
    if (p.startsWith('0')) p = '54' + p.slice(1);
    else if (!p.startsWith('54')) p = '54' + p;

    const dateFormatted = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(a.startsAt));
    const timeFormatted = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(a.startsAt));

    const text = this.reminderTemplate()
      .replace(/{negocio}/g, this.businessName())
      .replace(/{fecha}/g, dateFormatted)
      .replace(/{hora}/g, timeFormatted)
      .replace(/{profesional}/g, a.professionalName);

    return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
  }

  markNoShow(a: Appointment): void {
    this.appointmentsService.markNoShow(a.id).subscribe({
      next: (updated) => {
        this.appointments.update(list => list.map(i => i.id === updated.id ? updated : i));
        if (this.selectedAppointment()?.id === updated.id) this.selectedAppointment.set(updated);
      },
    });
  }

  saveChanges(): void {
    const appt = this.selectedAppointment();
    if (!appt) return;

    const dateStr = this.editDate();
    const timeStr = this.editTime();
    let startsAt: string | undefined = undefined;
    if (dateStr && timeStr) {
      const dt = new Date(`${dateStr}T${timeStr}:00-03:00`);
      startsAt = dt.toISOString();
    }

    const payload = {
      serviceId: this.editServiceId(),
      professionalId: this.editProfessionalId(),
      startsAt,
      price: this.editPrice(),
      depositAmount: this.editDepositAmount(),
    };

    this.appointmentsService.update(appt.id, payload).subscribe({
      next: (updated) => {
        this.appointments.update(list => list.map(i => i.id === updated.id ? updated : i));
        this.closeDetail();
      },
    });
  }

  cancelAppointment(): void {
    const appt = this.selectedAppointment();
    if (!appt) return;
    if (confirm('¿Estás seguro de que deseas cancelar este turno?')) {
      this.appointmentsService.cancel(appt.id).subscribe({
        next: (updated) => {
          this.appointments.update(list => list.map(i => i.id === updated.id ? updated : i));
          this.closeDetail();
        },
      });
    }
  }

  // ── Private ───────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    this.appointmentsService.list(this.view()).subscribe({
      next: items => { this.appointments.set(items); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  private formatGroupDate(iso: string): string {
    return new Intl.DateTimeFormat('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(iso));
  }
}
