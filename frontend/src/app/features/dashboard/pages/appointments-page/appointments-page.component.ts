import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
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
import { ConfirmService } from '../../../../core/confirm/confirm.service';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { publicBookingUrl } from '../../../../core/dashboard/dashboard.config';

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
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AppointmentsPageComponent implements OnInit, OnDestroy {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly confirmService = inject(ConfirmService);

  readonly viewOptions: { value: AppointmentsView; label: string }[] = [
    { value: 'day',   label: 'Día' },
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
  readonly branches = signal<any[]>([]);
  readonly businessName = signal<string>('');
  readonly reminderTemplate = signal<string>('');
  readonly bookingUrl = signal<string>('');

  // Scheduler and DatePicker state
  readonly selectedDate = signal<Date>(new Date(2026, 6, 8)); // Default to July 8, 2026 to match the user mockup
  readonly currentPickerMonth = signal<number>(6); // July
  readonly currentPickerYear = signal<number>(2026);
  readonly selectedProfessionalIds = signal<number[]>([]);
  readonly selectedBranchId = signal<number | null>(null);
  readonly selectedServiceId = signal<number | null>(null);
  readonly searchTerm = signal<string>('');
  readonly todayDate = new Date();

  readonly weekDays = computed<Date[]>(() => {
    const anchor = new Date(this.selectedDate());
    const day = anchor.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() + diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  });

  readonly monthViewDays = computed<Date[]>(() => {
    const anchor = this.selectedDate();
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startWeekday = firstDay.getDay();
    const prevDaysCount = startWeekday === 0 ? 6 : startWeekday - 1;
    const totalDays = lastDay.getDate();

    const days: Date[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = prevDaysCount - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  });

  // Mobile state signals
  readonly mobileSelectedProId = signal<number | null>(null);
  readonly mobileTimeSlots = computed<string[]>(() => {
    const slots: string[] = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const hStr = String(hour).padStart(2, '0');
        const mStr = String(min).padStart(2, '0');
        slots.push(`${hStr}:${mStr}`);
      }
    }
    return slots;
  });

  readonly mobileDateLabel = computed<string>(() => {
    const d = this.selectedDate();
    const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(d);
    return `${weekday}, ${day} de ${month}`;
  });

  readonly businessInitial = computed(() => {
    return (this.businessName()?.[0] ?? 'M').toUpperCase();
  });

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

  // DatePicker popover trigger
  readonly showDatePicker = signal<boolean>(false);

  toggleDatePicker(event: Event): void {
    event.stopPropagation();
    this.showDatePicker.update((val) => !val);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showDatePicker.set(false);
  }

  readonly isFiltersModalOpen = signal<boolean>(false);

  openFiltersModal(): void {
    this.isFiltersModalOpen.set(true);
  }

  closeFiltersModal(): void {
    this.isFiltersModalOpen.set(false);
  }

  getSelectedProValue(): string {
    const ids = this.selectedProfessionalIds();
    const all = this.professionals();
    if (all.length === 0 || ids.length === all.length) {
      return '';
    }
    return ids.length === 1 ? ids[0].toString() : '';
  }

  onProfessionalFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    if (!val) {
      this.selectedProfessionalIds.set(this.professionals().map(p => p.id));
    } else {
      this.selectedProfessionalIds.set([Number(val)]);
    }
  }

  private timeInterval: any;

  // Professional colors mapping
  readonly proColors = [
    { bg: '#fbebe6', border: '#e06c53', text: '#e06c53', name: 'pink' },
    { bg: '#e8f7ee', border: '#1da851', text: '#1da851', name: 'green' },
    { bg: '#f3e8ff', border: '#8b5cf6', text: '#8b5cf6', name: 'purple' },
    { bg: '#e0f2fe', border: '#0284c7', text: '#0284c7', name: 'blue' },
    { bg: '#fef9c3', border: '#ca8a04', text: '#ca8a04', name: 'yellow' },
  ];

  // DatePicker Days computed property (renders 42 days grid)
  readonly pickerDays = computed<Date[]>(() => {
    const year = this.currentPickerYear();
    const month = this.currentPickerMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startWeekday = firstDay.getDay(); // 0 is Sunday
    const totalDays = lastDay.getDate();

    const days: Date[] = [];

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    // Days from next month to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  });

  readonly filteredAppointments = computed<Appointment[]>(() => {
    const list = this.appointments();
    const selectedProIds = this.selectedProfessionalIds();
    const branchId = this.selectedBranchId();
    const serviceId = this.selectedServiceId();
    const query = this.searchTerm().toLowerCase().trim();

    return list.filter(appt => {
      // 1. Filter by professional
      if (!selectedProIds.includes(appt.professionalId)) {
        return false;
      }
      // 2. Filter by branch (if selected)
      if (branchId !== null && appt.branchId !== branchId) {
        return false;
      }
      // 3. Filter by service (if selected)
      if (serviceId !== null && appt.serviceId !== serviceId) {
        return false;
      }
      // 4. Filter by search query
      if (query) {
        const clientName = `${appt.clientFirstName || ''} ${appt.clientLastName || ''}`.toLowerCase();
        const serviceName = (appt.serviceName || '').toLowerCase();
        const profName = (appt.professionalName || '').toLowerCase();
        return clientName.includes(query) || serviceName.includes(query) || profName.includes(query);
      }
      return true;
    });
  });

  // Active columns for scheduler
  readonly activeProfessionals = computed<any[]>(() => {
    const all = this.professionals();
    const selected = this.selectedProfessionalIds();
    return all.filter(p => selected.includes(p.id));
  });

  readonly gridColumnCount = computed<number>(() => {
    return Math.max(this.activeProfessionals().length, 5);
  });

  readonly emptyColumnsArray = computed<number[]>(() => {
    const activeCount = this.activeProfessionals().length;
    const needed = Math.max(5 - activeCount, 0);
    return Array.from({ length: needed }, (_, i) => i);
  });

  get activeDateLabel(): string {
    const d = this.selectedDate();
    const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(d);
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(d);
    const year = d.getFullYear();
    return `${weekday}, ${day} de ${month} de ${year}`;
  }

  get pickerMonthLabel(): string {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[this.currentPickerMonth()]} ${this.currentPickerYear()}`;
  }

  get currentTimePosition(): string | null {
    const now = new Date();
    const todayStr = this.formatToISODate(now);
    const selectedStr = this.formatToISODate(this.selectedDate());

    if (todayStr !== selectedStr) return null;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const gridStartMinutes = 8 * 60; // 8:00 AM
    const gridEndMinutes = 20 * 60; // 8:00 PM

    if (currentMinutes < gridStartMinutes || currentMinutes > gridEndMinutes) return null;

    const pxPerMinute = 80 / 60;
    const top = (currentMinutes - gridStartMinutes) * pxPerMinute;
    return `${top}px`;
  }

  readonly pickerWeekdays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  readonly hourSlots = [
    '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm'
  ];

  ngOnInit(): void {
    this.load();
    this.onboardingService.getState().subscribe({
      next: (state) => {
        const srvs = state.services || [];
        this.services.set(srvs);

        const pros = state.professionals || [];
        this.professionals.set(pros);
        if (this.selectedProfessionalIds().length === 0) {
          this.selectedProfessionalIds.set(pros.map((p: any) => p.id));
        }
        if (pros.length > 0 && !this.mobileSelectedProId()) {
          this.mobileSelectedProId.set(pros[0].id);
        }

        const brms = state.branches || [];
        this.branches.set(brms);
        
        this.businessName.set(state.business?.name || '');
        this.reminderTemplate.set(
          state.business?.reminderTemplate ||
            '¡Hola! Recordá tu turno en {negocio} el {fecha} a las {hora} con {profesional}. ¡Te esperamos!'
        );
        if (state.business?.slug) {
          this.bookingUrl.set(publicBookingUrl(state.business.slug));
        }
      },
    });

    // Refresh currentTimePosition line indicator
    this.timeInterval = setInterval(() => {}, 60000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  prevPickerMonth(): void {
    const m = this.currentPickerMonth();
    const y = this.currentPickerYear();
    if (m === 0) {
      this.currentPickerMonth.set(11);
      this.currentPickerYear.set(y - 1);
    } else {
      this.currentPickerMonth.set(m - 1);
    }
  }

  nextPickerMonth(): void {
    const m = this.currentPickerMonth();
    const y = this.currentPickerYear();
    if (m === 11) {
      this.currentPickerMonth.set(0);
      this.currentPickerYear.set(y + 1);
    } else {
      this.currentPickerMonth.set(m + 1);
    }
  }

  selectDate(d: Date): void {
    this.selectedDate.set(d);
    this.currentPickerMonth.set(d.getMonth());
    this.currentPickerYear.set(d.getFullYear());
    this.load();
  }

  prevDate(): void {
    const d = new Date(this.selectedDate());
    if (this.view() === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (this.view() === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 1);
    }
    this.selectDate(d);
  }

  nextDate(): void {
    const d = new Date(this.selectedDate());
    if (this.view() === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (this.view() === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 1);
    }
    this.selectDate(d);
  }

  getAppointmentsForDate(date: Date): Appointment[] {
    const dateStr = this.formatToISODate(date);
    return this.filteredAppointments().filter(appt => {
      const apptDateStr = this.formatToISODate(new Date(appt.startsAt));
      return apptDateStr === dateStr;
    });
  }

  get dateLabelForView(): string {
    const d = this.selectedDate();
    if (this.view() === 'week') {
      const days = this.weekDays();
      const first = days[0];
      const last = days[6];
      const monthNames = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return `Semana del ${first.getDate()} al ${last.getDate()} de ${monthNames[last.getMonth()]} de ${last.getFullYear()}`;
    } else if (this.view() === 'month') {
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${monthNames[d.getMonth()]} de ${d.getFullYear()}`;
    } else {
      return this.activeDateLabel;
    }
  }

  formatWeekdayLabel(d: Date): string {
    const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(d).replace('.', '');
    const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${weekdayCap} ${d.getDate()}`;
  }

  formatWeekday(d: Date): string {
    return new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(d).replace('.', '');
  }

  formatTimeOnly(startsAtStr: string): string {
    const d = new Date(startsAtStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  toggleProFilter(id: number): void {
    const ids = [...this.selectedProfessionalIds()];
    const index = ids.indexOf(id);
    if (index > -1) {
      ids.splice(index, 1);
    } else {
      ids.push(id);
    }
    this.selectedProfessionalIds.set(ids);
  }

  isProFiltered(id: number): boolean {
    return this.selectedProfessionalIds().includes(id);
  }

  onBranchChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedBranchId.set(val ? Number(val) : null);
  }

  onServiceChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedServiceId.set(val ? Number(val) : null);
  }

  getAppointmentsForPro(proId: number): Appointment[] {
    return this.filteredAppointments().filter(a => a.professionalId === proId);
  }

  getProColor(proId: number): { bg: string; border: string; text: string; name: string } {
    const pro = this.professionals().find(p => p.id === proId);
    if (!pro) return this.proColors[0];
    const fullName = ((pro.firstName ?? '') + ' ' + (pro.lastName ?? '')).toLowerCase();
    
    if (fullName.includes('miércoles') || fullName.includes('miercoles')) {
      return this.proColors[0]; // pink/orange
    } else if (fullName.includes('paulo')) {
      return this.proColors[1]; // green
    } else if (fullName.includes('cecilia')) {
      return this.proColors[2]; // purple
    } else if (fullName.includes('valentina')) {
      return this.proColors[3]; // blue
    } else if (fullName.includes('valen')) {
      return this.proColors[4]; // yellow
    }
    
    // Fallback to index-based mapping
    const index = this.professionals().findIndex(p => p.id === proId);
    if (index === -1) return this.proColors[0];
    return this.proColors[index % this.proColors.length];
  }

  getProInitials(p: any): string {
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase();
  }

  getAppointmentPosition(startsAt: string, durationMinutes: number) {
    const d = new Date(startsAt);
    const startMinutes = d.getHours() * 60 + d.getMinutes();
    const gridStartMinutes = 8 * 60; // 8:00 AM
    
    // 1 hour = 80px, so 1 minute = 80 / 60 = 1.3333px
    const pxPerMinute = 80 / 60;
    
    const top = Math.max((startMinutes - gridStartMinutes) * pxPerMinute, 0);
    const height = Math.max(durationMinutes * pxPerMinute, 70); // Minimum 70px to fit 3 lines + descenders
    
    return {
      top: `${top}px`,
      height: `${height}px`
    };
  }

  getAppointmentTimeLabel(a: Appointment): string {
    const d = new Date(a.startsAt);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const meridiem = hours >= 12 ? 'p.m.' : 'a.m.';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    let label = `${hours}:${minutes} ${meridiem}`;
    if (a.status === 'CONFIRMED') {
      label += ' · Pendiente';
    } else if (a.status === 'NO_SHOW') {
      label += ' · No asistió';
    }
    return label;
  }

  copyBookingLink(): void {
    const url = this.bookingUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      alert('¡Enlace de reserva copiado al portapapeles! Compartilo con tu cliente.');
    });
  }

  splitName(fullName: string): { first: string; last: string } {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return { first: parts[0], last: parts.slice(1).join(' ') };
    }
    return { first: fullName, last: '' };
  }

  formatToISODate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isSameDate(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
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
  
  paymentType(a: Appointment): string {
    if (a.status === 'COMPLETED' && a.price && a.price > 0) return 'Cobro completo';
    if (a.depositAmount && a.depositAmount > 0) return 'Seña registrada';
    return 'Sin cobro online';
  }

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

  async cancelAppointment(): Promise<void> {
    const appt = this.selectedAppointment();
    if (!appt) return;
    const confirmed = await this.confirmService.confirm({
      title: 'Cancelar turno',
      message: '¿Estás seguro de que deseas cancelar este turno?',
      confirmText: 'Cancelar turno',
      isDestructive: true
    });
    if (confirmed) {
      this.appointmentsService.cancel(appt.id).subscribe({
        next: (updated) => {
          this.appointments.update(list => list.map(i => i.id === updated.id ? updated : i));
          this.closeDetail();
        },
      });
    }
  }

  onMobileProChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.mobileSelectedProId.set(val ? Number(val) : null);
  }

  getAppointmentsForSlot(slot: string, proId: number | null): Appointment[] {
    if (!proId) return [];
    const list = this.filteredAppointments();
    const [slotHour, slotMin] = slot.split(':').map(Number);
    const slotMinutesStart = slotHour * 60 + slotMin;
    const slotMinutesEnd = slotMinutesStart + 15;

    return list.filter(appt => {
      if (appt.professionalId !== proId) return false;
      const d = new Date(appt.startsAt);
      const apptMinutes = d.getHours() * 60 + d.getMinutes();
      return apptMinutes >= slotMinutesStart && apptMinutes < slotMinutesEnd;
    });
  }

  getProInitialsForId(proId: number): string {
    const pro = this.professionals().find(p => p.id === proId);
    if (!pro) return '';
    return this.getProInitials(pro);
  }

  createNewAppointmentFromSlot(slot: string): void {
    this.copyBookingLink();
  }

  // ── Private ───────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    const dateStr = this.formatToISODate(this.selectedDate());
    this.appointmentsService.list(this.view(), dateStr).subscribe({
      next: items => { this.appointments.set(items); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }
}
