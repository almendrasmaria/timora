import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { parseApiError } from '../../../../core/auth/api-error';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { ConfigService } from '../../../../core/config/config.service';
import { ConfirmService } from '../../../../core/confirm/confirm.service';
import {
  OnboardingState,
  BusinessCategory,
  PaymentMethodType,
} from '../../../../core/onboarding/onboarding.models';
import {
  BUSINESS_CATEGORIES,
  BRAND_COLORS,
  PAYMENT_METHOD_OPTIONS,
  SERVICE_PAYMENT_OPTIONS,
  specialtiesForCategory,
} from '../../../../core/onboarding/onboarding.config';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';
import { SelectFieldComponent } from '../../../../shared/ui/select-field/select-field.component';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { ProfessionalScheduleComponent } from '../../../onboarding/components/professional-schedule/professional-schedule.component';
import {
  createDefaultAvailability,
  formatAvailabilitySummary,
  serializeAvailability,
  parseAvailability,
  splitProfessionalName,
  ProfessionalAvailability,
} from '../../../../core/onboarding/professional-schedule.model';

@Component({
  selector: 'app-config-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    TextFieldComponent,
    SelectFieldComponent,
    ModalComponent,
    ProfessionalScheduleComponent,
  ],
  templateUrl: './config-page.component.html',
  styleUrl: './config-page.component.scss',
  animations: [
    trigger('fadeAnimation', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ConfigPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly onboarding = inject(OnboardingService);
  private readonly configService = inject(ConfigService);
  private readonly confirmService = inject(ConfirmService);

  readonly state = signal<OnboardingState | null>(null);
  readonly activeSection = signal<string>('sucursales');
  readonly loading = signal<boolean>(false);
  readonly apiError = signal<string>('');

  readonly sectionTitles: Record<string, string> = {
    sucursales: 'Sucursales',
    profesionales: 'Profesionales',
    servicios: 'Servicios',
    cobros: 'Formas de cobro',
    negocio: 'Negocio',
    recordatorios: 'Recordatorios',
    link_instagram: 'Link Instagram',
    link_turnos: 'Link de turnos',
  };

  // Dropdown options
  readonly businessCategories = [...BUSINESS_CATEGORIES];
  readonly brandColors = [...BRAND_COLORS];
  readonly paymentOptions = PAYMENT_METHOD_OPTIONS;
  readonly servicePaymentOptions = SERVICE_PAYMENT_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  // Formas de cobro: vista previa visual (todavía sin conectar al backend).
  readonly senaEnabled = signal(false);
  readonly senaTipoOptions = [
    { value: 'FIJO', label: 'Monto fijo' },
    { value: 'PORCENTAJE', label: 'Porcentaje' },
  ];
  readonly senaForm = this.fb.group({
    tipo: [{ value: 'FIJO', disabled: true }],
    monto: [{ value: '', disabled: true }],
  });
  readonly senaTipo = signal<'FIJO' | 'PORCENTAJE'>('FIJO');

  readonly mpConectado = signal(false);

  // Modals state
  readonly showBranchModal = signal<boolean>(false);
  readonly editingBranch = signal<any | null>(null);

  readonly showProModal = signal<boolean>(false);
  readonly editingPro = signal<any | null>(null);
  readonly proBranchAvailabilities = signal<Record<number, ProfessionalAvailability>>({});
  readonly selectedScheduleBranchId = signal<number | null>(null);

  readonly showServiceModal = signal<boolean>(false);
  readonly editingService = signal<any | null>(null);

  // Forms
  readonly branchForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
  });

  readonly proForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(160)]],
    branchIds: [[] as number[]],
  });

  readonly serviceForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    durationMinutes: [60, [Validators.required, Validators.min(5)]],
    price: [''],
    depositAmount: [''],
    paymentRequirement: ['ONLINE_DEPOSIT' as any, [Validators.required]],
  });

  readonly negocioForm = this.fb.nonNullable.group({
    logoUrl: [''],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    whatsapp: ['', [Validators.required, Validators.maxLength(32)]],
    showWhatsappToClients: [true],
    instagram: ['', [Validators.maxLength(80)]],
    slug: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    brandColor: [''],
  });

  readonly recordatoriosForm = this.fb.nonNullable.group({
    reminderTemplate: ['', [Validators.maxLength(500)]],
  });

  readonly linkInstagramForm = this.fb.nonNullable.group({
    bioLinkText: ['', [Validators.maxLength(280)]],
    bioShowBooking: [true],
    bioShowLocation: [true],
    bioShowWhatsapp: [true],
  });

  ngOnInit(): void {
    this.refreshState();

    this.refreshState();

    // Sync service payment options
    this.serviceForm.controls.paymentRequirement.valueChanges.subscribe((req) => {
      this.syncServicePaymentFields(req);
    });

    this.senaForm.controls.tipo.valueChanges.subscribe((tipo) => {
      this.senaTipo.set(tipo === 'PORCENTAJE' ? 'PORCENTAJE' : 'FIJO');
      this.saveDepositSettings();
    });

    this.senaForm.controls.monto.valueChanges.pipe(debounceTime(600)).subscribe(() => {
      this.saveDepositSettings();
    });
  }



  get servicePaymentRequirement(): string {
    return this.serviceForm.controls.paymentRequirement.value;
  }

  refreshState(): void {
    this.loading.set(true);
    this.onboarding.getState().subscribe({
      next: (state) => {
        this.state.set(state);
        this.prefillBusinessForms(state);
        this.loading.set(false);
      },
      error: (err) => {
        this.apiError.set(parseApiError(err));
        this.loading.set(false);
      },
    });
  }

  prefillBusinessForms(state: OnboardingState): void {
    const business = state.business;
    if (!business) return;

    this.negocioForm.patchValue({
      logoUrl: business.logoUrl || '',
      name: business.name,
      whatsapp: business.whatsapp || '',
      showWhatsappToClients: business.showWhatsappToClients ?? true,
      instagram: business.instagram || '',
      slug: business.slug,
      brandColor: business.brandColor || '',
    });
    this.recordatoriosForm.patchValue({
      reminderTemplate: business.reminderTemplate || '',
    });
    this.linkInstagramForm.patchValue({
      bioLinkText: business.bioLinkText || '',
      bioShowBooking: business.bioShowBooking ?? true,
      bioShowLocation: business.bioShowLocation ?? true,
      bioShowWhatsapp: business.bioShowWhatsapp ?? true,
    });

    this.senaEnabled.set(business.depositEnabled ?? false);
    const tipo = business.depositType === 'PERCENTAGE' ? 'PORCENTAJE' : 'FIJO';
    this.senaForm.patchValue(
      {
        tipo,
        monto: business.depositAmount != null ? String(business.depositAmount) : '',
      },
      { emitEvent: false }
    );
    this.senaTipo.set(tipo);
    if (this.senaEnabled()) {
      this.senaForm.enable({ emitEvent: false });
    } else {
      this.senaForm.disable({ emitEvent: false });
    }
  }

  // Branch operations
  openAddBranchModal(): void {
    this.editingBranch.set(null);
    this.branchForm.reset({ name: '', address: '' });
    this.showBranchModal.set(true);
  }

  openEditBranchModal(branch: any): void {
    this.editingBranch.set(branch);
    this.branchForm.patchValue({
      name: branch.name,
      address: branch.address,
    });
    this.showBranchModal.set(true);
  }

  saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    const { name, address } = this.branchForm.getRawValue();
    this.loading.set(true);
    this.apiError.set('');

    const request$ = this.editingBranch()
      ? this.onboarding.updateBranch(this.editingBranch().id, name, address)
      : this.onboarding.addBranch(name, address);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (state) => {
        this.state.set(state);
        this.showBranchModal.set(false);
      },
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  async removeBranch(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar sucursal',
      message: '¿Estás seguro de eliminar esta sucursal?',
      confirmText: 'Eliminar',
      isDestructive: true
    });
    if (!confirmed) return;
    this.loading.set(true);
    this.onboarding.deleteBranch(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (state) => this.state.set(state),
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  // Professional operations
  openAddProModal(): void {
    this.editingPro.set(null);
    this.proForm.reset({ displayName: '', branchIds: [] });
    this.proBranchAvailabilities.set({});
    this.selectedScheduleBranchId.set(null);
    this.showProModal.set(true);
  }

  openEditProModal(pro: any): void {
    this.editingPro.set(pro);
    const displayName = pro.firstName === pro.lastName ? pro.firstName : `${pro.firstName} ${pro.lastName}`;
    this.proForm.patchValue({
      displayName,
      branchIds: pro.branchIds || [],
    });

    const branchAvails: Record<number, ProfessionalAvailability> = {};
    if (pro.availabilityJson) {
      try {
        const parsed = JSON.parse(pro.availabilityJson);
        const keys = Object.keys(parsed);
        const isMultiBranch = keys.length > 0 && keys.every((k) => /^\d+$/.test(k));

        if (isMultiBranch) {
          for (const key of keys) {
            branchAvails[Number(key)] = parsed[key];
          }
        } else {
          // Legacy: assign the single schedule to all assigned branches
          const legacyAvail = parsed as ProfessionalAvailability;
          for (const bid of pro.branchIds || []) {
            branchAvails[bid] = JSON.parse(JSON.stringify(legacyAvail));
          }
        }
      } catch {
        // Ignored, default created lazily
      }
    }

    this.proBranchAvailabilities.set(branchAvails);

    const branchIds = pro.branchIds || [];
    if (branchIds.length > 0) {
      this.selectedScheduleBranchId.set(branchIds[0]);
    } else {
      this.selectedScheduleBranchId.set(null);
    }

    this.showProModal.set(true);
  }

  proInitials(pro: any): string {
    const name = (pro.firstName === pro.lastName ? pro.firstName : `${pro.firstName} ${pro.lastName}`).trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  proScheduleSummary(pro: any): string {
    return formatAvailabilitySummary(pro.availabilityJson);
  }

  proBranchesSummary(pro: any): string {
    if (!pro.branchIds || pro.branchIds.length === 0) {
      return 'Sin sucursal asignada';
    }
    const allBranches = this.state()?.branches || [];
    const names = pro.branchIds
      .map((id: number) => allBranches.find((b) => b.id === id)?.name)
      .filter(Boolean);
    return names.join(', ');
  }

  savePro(): void {
    if (this.proForm.invalid) {
      this.proForm.markAllAsTouched();
      return;
    }
    const { displayName, branchIds } = this.proForm.getRawValue();
    const { firstName, lastName } = splitProfessionalName(displayName);

    // Keep only schedules for selected branches
    const finalAvails: Record<number, ProfessionalAvailability> = {};
    for (const bid of branchIds) {
      finalAvails[bid] = this.getBranchAvailability(bid);
    }
    const availabilityJson = JSON.stringify(finalAvails);

    this.loading.set(true);
    this.apiError.set('');

    const proData = {
      firstName,
      lastName,
      availabilityJson,
      branchIds,
    };

    const request$ = this.editingPro()
      ? this.onboarding.updateProfessional(this.editingPro().id, proData)
      : this.onboarding.addProfessional(proData);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (state) => {
        this.state.set(state);
        this.showProModal.set(false);
      },
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  isBranchSelectedForPro(branchId: number): boolean {
    const selected = this.proForm.controls.branchIds.value;
    return selected.includes(branchId);
  }

  toggleBranchForPro(branchId: number): void {
    const selected = [...this.proForm.controls.branchIds.value];
    const index = selected.indexOf(branchId);
    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(branchId);
    }
    this.proForm.controls.branchIds.setValue(selected);
    this.proForm.controls.branchIds.markAsDirty();

    // Update active schedule tab
    const currentActive = this.selectedScheduleBranchId();
    if (selected.length === 0) {
      this.selectedScheduleBranchId.set(null);
    } else if (currentActive === null || !selected.includes(currentActive)) {
      this.selectedScheduleBranchId.set(selected[0]);
    }
  }

  selectedBranchesForPro(): any[] {
    const selectedIds = this.proForm.controls.branchIds.value || [];
    const allBranches = this.state()?.branches || [];
    return allBranches.filter((b) => selectedIds.includes(b.id));
  }

  getBranchAvailability(branchId: number): ProfessionalAvailability {
    const avails = this.proBranchAvailabilities();
    if (!avails[branchId]) {
      avails[branchId] = createDefaultAvailability();
      this.proBranchAvailabilities.set({ ...avails });
    }
    return avails[branchId];
  }

  setBranchAvailability(branchId: number, availability: ProfessionalAvailability): void {
    const avails = this.proBranchAvailabilities();
    avails[branchId] = availability;
    this.proBranchAvailabilities.set({ ...avails });
  }

  async removePro(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar profesional',
      message: '¿Estás seguro de eliminar este profesional?',
      confirmText: 'Eliminar',
      isDestructive: true
    });
    if (!confirmed) return;
    this.loading.set(true);
    this.onboarding.deleteProfessional(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (state) => this.state.set(state),
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  // Service operations
  openAddServiceModal(): void {
    this.editingService.set(null);
    this.serviceForm.reset({
      name: '',
      durationMinutes: 60,
      price: '',
      depositAmount: '',
      paymentRequirement: 'ONLINE_DEPOSIT',
    });
    this.syncServicePaymentFields('ONLINE_DEPOSIT');
    this.showServiceModal.set(true);
  }

  openEditServiceModal(service: any): void {
    this.editingService.set(service);
    let requirement: string = 'NO_PAYMENT';
    if (service.depositAmount != null) {
      requirement = 'ONLINE_DEPOSIT';
    } else if (service.price != null) {
      requirement = 'ONLINE_FULL';
    }

    this.serviceForm.patchValue({
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price ? String(service.price) : '',
      depositAmount: service.depositAmount ? String(service.depositAmount) : '',
      paymentRequirement: requirement as any,
    });
    this.syncServicePaymentFields(requirement);
    this.showServiceModal.set(true);
  }

  saveService(): void {
    if (!this.validateServicePaymentFields()) {
      this.serviceForm.markAllAsTouched();
      return;
    }
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const { name, durationMinutes, price, paymentRequirement } = this.serviceForm.getRawValue();
    const resolvedPrice = paymentRequirement !== 'NO_PAYMENT' && price ? Number(price) : null;

    this.loading.set(true);
    this.apiError.set('');

    // La seña ahora se define de forma global en Formas de cobro, no por
    // servicio; dejamos de guardar un depositAmount por-servicio acá.
    const serviceData = {
      name,
      durationMinutes: Number(durationMinutes),
      price: resolvedPrice,
      depositAmount: null,
    };

    const request$ = this.editingService()
      ? this.onboarding.updateService(this.editingService().id, serviceData)
      : this.onboarding.addService(serviceData);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (state) => {
        this.state.set(state);
        this.showServiceModal.set(false);
      },
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  async removeService(id: number, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.confirmService.confirm({
      title: 'Eliminar servicio',
      message: '¿Estás seguro de eliminar este servicio?',
      confirmText: 'Eliminar',
      isDestructive: true
    });
    if (!confirmed) return;
    this.loading.set(true);
    this.onboarding.deleteService(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (state) => this.state.set(state),
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  serviceMeta(service: any): string {
    const parts = [`${service.durationMinutes} min`];
    if (service.price != null) {
      parts.push(`$${service.price}`);
    }
    return parts.join(' · ');
  }

  private validateServicePaymentFields(): boolean {
    const requirement = this.serviceForm.controls.paymentRequirement.value;
    let valid = true;
    if (requirement !== 'NO_PAYMENT' && !this.serviceForm.controls.price.value) {
      this.serviceForm.controls.price.setErrors({ required: true });
      valid = false;
    }
    return valid;
  }

  private syncServicePaymentFields(requirement: string): void {
    const price = this.serviceForm.controls.price;
    const deposit = this.serviceForm.controls.depositAmount;

    if (requirement === 'NO_PAYMENT') {
      price.disable({ emitEvent: false });
      price.setValue('', { emitEvent: false });
      deposit.disable({ emitEvent: false });
      deposit.setValue('', { emitEvent: false });
    } else if (requirement === 'ONLINE_FULL') {
      price.enable({ emitEvent: false });
      deposit.disable({ emitEvent: false });
      deposit.setValue('', { emitEvent: false });
    } else {
      price.enable({ emitEvent: false });
      deposit.enable({ emitEvent: false });
    }
  }

  toggleSena(): void {
    const next = !this.senaEnabled();
    this.senaEnabled.set(next);
    next
      ? this.senaForm.enable({ emitEvent: false })
      : this.senaForm.disable({ emitEvent: false });
    this.saveDepositSettings();
  }

  saveDepositSettings(): void {
    const raw = this.senaForm.getRawValue();
    this.configService
      .updateDepositSettings({
        depositEnabled: this.senaEnabled(),
        depositType: raw.tipo === 'PORCENTAJE' ? 'PERCENTAGE' : 'FIXED',
        depositAmount: raw.monto ? Number(raw.monto) : null,
      })
      .subscribe({
        error: (err) => this.apiError.set(parseApiError(err)),
      });
  }

  // Payment Methods operations
  isPaymentSelected(option: any): boolean {
    const paymentMethods = this.state()?.paymentMethods || [];
    return paymentMethods.some((method) =>
      option.types.includes(method.type)
    );
  }

  togglePaymentMethod(option: any): void {
    if (this.loading()) return;
    const paymentMethods = this.state()?.paymentMethods || [];
    const existing = paymentMethods.find((method) =>
      option.types.includes(method.type)
    );

    this.loading.set(true);
    this.apiError.set('');

    const request$ = existing
      ? this.onboarding.deletePaymentMethod(existing.id)
      : this.onboarding.addPaymentMethod(option.value);

    request$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (state) => this.state.set(state),
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  selectColor(colorValue: string): void {
    this.negocioForm.controls.brandColor.setValue(colorValue);
    this.negocioForm.controls.brandColor.markAsDirty();
  }

  saveNegocio(): void {
    if (this.negocioForm.invalid) {
      this.negocioForm.markAllAsTouched();
      return;
    }
    const val = this.negocioForm.getRawValue();
    this.loading.set(true);
    this.apiError.set('');

    const recVals = this.recordatoriosForm.getRawValue();
    const linkVals = this.linkInstagramForm.getRawValue();

    const data = {
      name: val.name,
      whatsapp: val.whatsapp,
      showWhatsappToClients: val.showWhatsappToClients,
      instagram: val.instagram,
      brandColor: val.brandColor,
      reminderTemplate: recVals.reminderTemplate,
      bioLinkText: linkVals.bioLinkText,
      bioShowBooking: linkVals.bioShowBooking,
      bioShowLocation: linkVals.bioShowLocation,
      bioShowWhatsapp: linkVals.bioShowWhatsapp,
    };

    forkJoin({
      settings: this.configService.updateSettings(data),
      brand: this.onboarding.updateBrand(val.slug, val.brandColor || undefined)
    }).pipe(finalize(() => {
      this.loading.set(false);
      this.refreshState();
    })).subscribe({
      next: () => {
        this.negocioForm.markAsPristine();
      },
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  saveRecordatorios(): void {
    if (this.recordatoriosForm.invalid) {
      this.recordatoriosForm.markAllAsTouched();
      return;
    }
    const recVals = this.recordatoriosForm.getRawValue();
    const negocioVals = this.negocioForm.getRawValue();
    const linkVals = this.linkInstagramForm.getRawValue();
    
    this.loading.set(true);
    this.apiError.set('');
    
    this.configService.updateSettings({
      name: negocioVals.name,
      whatsapp: negocioVals.whatsapp,
      showWhatsappToClients: negocioVals.showWhatsappToClients,
      instagram: negocioVals.instagram,
      brandColor: negocioVals.brandColor,
      reminderTemplate: recVals.reminderTemplate,
      bioLinkText: linkVals.bioLinkText,
      bioShowBooking: linkVals.bioShowBooking,
      bioShowLocation: linkVals.bioShowLocation,
      bioShowWhatsapp: linkVals.bioShowWhatsapp,
    }).pipe(finalize(() => {
      this.loading.set(false);
      this.refreshState();
    })).subscribe({
      next: () => {
        this.recordatoriosForm.markAsPristine();
      },
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  saveLinkInstagram(): void {
    if (this.linkInstagramForm.invalid) {
      this.linkInstagramForm.markAllAsTouched();
      return;
    }
    const recVals = this.recordatoriosForm.getRawValue();
    const negocioVals = this.negocioForm.getRawValue();
    const linkVals = this.linkInstagramForm.getRawValue();
    
    this.loading.set(true);
    this.apiError.set('');
    
    this.configService.updateSettings({
      name: negocioVals.name,
      whatsapp: negocioVals.whatsapp,
      showWhatsappToClients: negocioVals.showWhatsappToClients,
      instagram: negocioVals.instagram,
      brandColor: negocioVals.brandColor,
      reminderTemplate: recVals.reminderTemplate,
      bioLinkText: linkVals.bioLinkText,
      bioShowBooking: linkVals.bioShowBooking,
      bioShowLocation: linkVals.bioShowLocation,
      bioShowWhatsapp: linkVals.bioShowWhatsapp,
    }).pipe(finalize(() => {
      this.loading.set(false);
      this.refreshState();
    })).subscribe({
      next: () => {
        this.linkInstagramForm.markAsPristine();
      },
      error: (err) => this.apiError.set(parseApiError(err)),
    });
  }

  onLogoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.loading.set(true);
      this.configService.uploadLogo(file).pipe(finalize(() => {
        this.loading.set(false);
        this.refreshState();
      })).subscribe({
        next: (business) => {
          this.negocioForm.controls.logoUrl.setValue(business.logoUrl);
        },
        error: (err) => this.apiError.set(parseApiError(err)),
      });
    }
  }

  getFullUrl(type: 'booking' | 'instagram'): string {
    const slug = this.negocioForm.controls.slug.value || '';
    const origin = window.location.origin;
    return `${origin}/${slug}`;
  }

  copyLink(type: 'booking' | 'instagram'): void {
    const url = this.getFullUrl(type);
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiado: ' + url);
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }
}
