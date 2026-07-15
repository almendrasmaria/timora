package com.timora.client;

import com.timora.appointment.Appointment;
import com.timora.appointment.AppointmentRepository;
import com.timora.appointment.dto.AppointmentResponse;
import com.timora.business.Branch;
import com.timora.business.Business;
import com.timora.business.Professional;
import com.timora.business.ServiceOffering;
import com.timora.client.dto.ClientDetailResponse;
import com.timora.client.dto.ClientRequest;
import com.timora.client.dto.ClientResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.List;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final AppointmentRepository appointmentRepository;

    public ClientService(ClientRepository clientRepository, AppointmentRepository appointmentRepository) {
        this.clientRepository = clientRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> listClients(Business business, String query, Long professionalId) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? "%" + query.trim().toLowerCase() + "%" : null;
        List<Client> clients = clientRepository.searchClients(business.getId(), cleanQuery, professionalId);
        return clients.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientDetailResponse getClientDetail(Business business, Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));

        if (!client.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso no autorizado");
        }

        List<Appointment> appointments = appointmentRepository.findByClientIdOrderByStartsAtDesc(client.getId());
        List<AppointmentResponse> appointmentResponses = appointments.stream()
                .map(this::toAppointmentResponse)
                .toList();

        return new ClientDetailResponse(
                client.getId(),
                client.getFirstName(),
                client.getLastName(),
                client.getPhone(),
                client.getEmail(),
                client.getNotes(),
                client.getCreatedAt(),
                appointmentResponses
        );
    }

    @Transactional
    public ClientResponse createClient(Business business, ClientRequest request) {
        clientRepository.findByBusinessIdAndPhone(business.getId(), request.phone().trim())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya existe un cliente con ese teléfono");
                });

        Client client = new Client();
        client.setBusiness(business);
        client.setFirstName(request.firstName().trim());
        client.setLastName(request.lastName().trim());
        client.setPhone(request.phone().trim());
        client.setEmail(request.email() != null ? request.email().trim() : null);
        client.setNotes(request.notes());
        client.setCreatedAt(Instant.now());

        return toResponse(clientRepository.save(client));
    }

    @Transactional
    public ClientResponse updateClient(Business business, Long id, ClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));

        if (!client.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso no autorizado");
        }

        String newPhone = request.phone().trim();
        if (!client.getPhone().equals(newPhone)) {
            clientRepository.findByBusinessIdAndPhone(business.getId(), newPhone)
                    .ifPresent(existing -> {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya existe otro cliente con ese teléfono");
                    });
        }

        client.setFirstName(request.firstName().trim());
        client.setLastName(request.lastName().trim());
        client.setPhone(newPhone);
        client.setEmail(request.email() != null ? request.email().trim() : null);
        if (request.notes() != null) {
            client.setNotes(request.notes());
        }

        return toResponse(clientRepository.save(client));
    }

    @Transactional
    public void deleteClient(Business business, Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));

        if (!client.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso no autorizado");
        }

        clientRepository.delete(client);
    }

    @Transactional
    public Client getOrCreateClient(Business business, String firstName, String lastName, String phone, String email) {
        String cleanPhone = phone.trim();
        return clientRepository.findByBusinessIdAndPhone(business.getId(), cleanPhone)
                .map(client -> {
                    if (firstName != null && !firstName.trim().isEmpty()) {
                        client.setFirstName(firstName.trim());
                    }
                    if (lastName != null && !lastName.trim().isEmpty()) {
                        client.setLastName(lastName.trim());
                    }
                    if (email != null) {
                        client.setEmail(email.trim().isEmpty() ? null : email.trim());
                    }
                    return clientRepository.save(client);
                })
                .orElseGet(() -> {
                    Client newClient = new Client();
                    newClient.setBusiness(business);
                    newClient.setFirstName(firstName != null ? firstName.trim() : "");
                    newClient.setLastName(lastName != null ? lastName.trim() : "");
                    newClient.setPhone(cleanPhone);
                    newClient.setEmail(email != null && !email.trim().isEmpty() ? email.trim() : null);
                    newClient.setCreatedAt(Instant.now());
                    return clientRepository.save(newClient);
                });
    }

    private ClientResponse toResponse(Client client) {
        return new ClientResponse(
                client.getId(),
                client.getFirstName(),
                client.getLastName(),
                client.getPhone(),
                client.getEmail(),
                client.getNotes(),
                client.getCreatedAt()
        );
    }

    private AppointmentResponse toAppointmentResponse(Appointment appointment) {
        Branch branch = appointment.getBranch();
        Professional professional = appointment.getProfessional();
        ServiceOffering service = appointment.getService();

        return new AppointmentResponse(
                appointment.getId(),
                appointment.getClientFirstName(),
                appointment.getClientLastName(),
                appointment.getClientPhone(),
                appointment.getClientEmail(),
                appointment.getNotes(),
                service.getId(),
                service.getName(),
                service.getDurationMinutes(),
                professional.getId(),
                formatProfessionalName(professional),
                branch != null ? branch.getId() : null,
                branch != null ? branch.getName() : null,
                branch != null ? branch.getAddress() : null,
                appointment.getStartsAt(),
                appointment.getEndsAt(),
                appointment.getPrice(),
                appointment.getDepositAmount(),
                appointment.getStatus(),
                appointment.getCreatedAt()
        );
    }

    private String formatProfessionalName(Professional professional) {
        String first = professional.getFirstName() == null ? "" : professional.getFirstName().trim();
        String last = professional.getLastName() == null ? "" : professional.getLastName().trim();
        if (first.isEmpty()) {
            return last;
        }
        if (last.isEmpty()) {
            return first;
        }
        return first + " " + last;
    }
}
