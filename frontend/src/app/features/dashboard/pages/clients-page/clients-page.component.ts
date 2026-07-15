import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientsService, Client, ClientDetail } from '../../../../core/clients/clients.service';
import { OnboardingService } from '../../../../core/onboarding/onboarding.service';
import { AppointmentsService } from '../../../../core/appointments/appointments.service';
import { Appointment, AppointmentStatus } from '../../../../core/appointments/appointments.models';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../shared/ui/text-field/text-field.component';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ModalComponent,
    ButtonComponent,
    TextFieldComponent,
  ],
  templateUrl: './clients-page.component.html',
  styleUrl: './clients-page.component.scss',
})
export class ClientsPageComponent implements OnInit {
  private readonly clientsService = inject(ClientsService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly fb = inject(FormBuilder);

  readonly clients = signal<Client[]>([]);
  readonly professionals = signal<any[]>([]);
  readonly loading = signal(true);

  readonly activeDropdownId = signal<number | null>(null);

  toggleDropdown(id: number, event: Event): void {
    event.stopPropagation();
    if (this.activeDropdownId() === id) {
      this.activeDropdownId.set(null);
    } else {
      this.activeDropdownId.set(id);
    }
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.activeDropdownId.set(null);
  }

  assignTurn(client: Client, event: Event): void {
    event.stopPropagation();
    window.location.href = '/dashboard/turnos';
  }

  readonly searchTerm = signal<string>('');
  readonly selectedProId = signal<number | null>(null);

  readonly selectedClient = signal<ClientDetail | null>(null);
  readonly activeTab = signal<'history' | 'notes'>('history');
  readonly isDetailModalOpen = signal(false);
  readonly clientNotes = signal<string>('');

  readonly isEditModalOpen = signal(false);
  readonly editingClient = signal<Client | null>(null);
  clientForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadProfessionals();
    this.loadClients();
  }

  private initForm(): void {
    this.clientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(80)]],
      lastName: ['', [Validators.required, Validators.maxLength(80)]],
      phone: ['', [Validators.required, Validators.maxLength(32)]],
      email: ['', [Validators.email, Validators.maxLength(255)]],
    });
  }

  private loadProfessionals(): void {
    this.onboardingService.getState().subscribe({
      next: (state) => {
        this.professionals.set(state.professionals || []);
      },
    });
  }

  loadClients(): void {
    this.loading.set(true);
    const query = this.searchTerm();
    const proId = this.selectedProId();

    this.clientsService.getAll(query || undefined, proId || undefined).subscribe({
      next: (res) => {
        this.clients.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.loadClients();
  }

  onProChange(): void {
    this.loadClients();
  }

  openNewClientModal(): void {
    this.editingClient.set(null);
    this.clientForm.reset({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    });
    this.isEditModalOpen.set(true);
  }

  openEditClientModal(client: Client, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.editingClient.set(client);
    this.clientForm.reset({
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email || '',
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingClient.set(null);
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const payload = this.clientForm.value;
    const clientToEdit = this.editingClient();

    const request$ = clientToEdit
      ? this.clientsService.update(clientToEdit.id, payload)
      : this.clientsService.create(payload);

    request$.subscribe({
      next: () => {
        this.closeEditModal();
        this.loadClients();
      },
      error: (err) => {
        alert(err.error?.message || 'Ocurrió un error al guardar el cliente');
      },
    });
  }

  openDetailModal(client: Client): void {
    this.clientsService.getById(client.id).subscribe({
      next: (res) => {
        this.selectedClient.set(res);
        this.clientNotes.set(res.notes || '');
        this.activeTab.set('history');
        this.isDetailModalOpen.set(true);
      },
      error: () => {
        alert('No se pudo cargar la información del cliente.');
      },
    });
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedClient.set(null);
  }

  setTab(tab: 'history' | 'notes'): void {
    this.activeTab.set(tab);
  }

  saveClientNotes(): void {
    const client = this.selectedClient();
    if (!client) return;

    const payload = {
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
      email: client.email,
      notes: this.clientNotes(),
    };

    this.clientsService.update(client.id, payload).subscribe({
      next: (updatedClient) => {
        const currentDetail = this.selectedClient();
        if (currentDetail) {
          this.selectedClient.set({
            ...currentDetail,
            notes: updatedClient.notes,
          });
        }
        this.loadClients();
        alert('Notas del cliente guardadas correctamente.');
      },
      error: () => {
        alert('Error al guardar las notas del cliente.');
      },
    });
  }

  deleteClient(client: Client, event: Event): void {
    event.stopPropagation();
    const confirmed = confirm(`¿Estás seguro de que deseas eliminar al cliente "${client.firstName} ${client.lastName}"?`);
    if (!confirmed) return;

    this.clientsService.delete(client.id).subscribe({
      next: () => {
        this.loadClients();
      },
      error: () => {
        alert('No se pudo eliminar el cliente.');
      },
    });
  }

  addAppointmentNote(appointment: Appointment, event: Event): void {
    event.stopPropagation();
    const currentNote = appointment.notes || '';
    const newNote = prompt('Anotación para el turno:', currentNote);

    if (newNote === null) return;

    this.appointmentsService.update(appointment.id, { notes: newNote.trim() }).subscribe({
      next: () => {
        const client = this.selectedClient();
        if (client) {
          this.openDetailModal(client);
        }
      },
      error: () => {
        alert('Error al guardar la anotación.');
      },
    });
  }

  formatAppointmentDate(startsAtStr: string): string {
    const startsAt = new Date(startsAtStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    const dateStr = new Intl.DateTimeFormat('es-AR', options).format(startsAt);
    return dateStr.replace('.', '');
  }

  formatAppointmentRange(startsAtStr: string, endsAtStr: string): string {
    const startsAt = new Date(startsAtStr);
    const endsAt = new Date(endsAtStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(startsAt.getHours())}:${pad(startsAt.getMinutes())} - ${pad(endsAt.getHours())}:${pad(endsAt.getMinutes())}`;
  }

  formatStatus(status: AppointmentStatus): string {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'COMPLETED': return 'Completado';
      case 'NO_SHOW': return 'Ausente';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  }

  getProName(proId: number): string {
    const pro = this.professionals().find(p => p.id === proId);
    return pro ? `${pro.firstName} ${pro.lastName}` : '';
  }
}
