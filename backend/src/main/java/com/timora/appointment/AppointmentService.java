package com.timora.appointment;

import com.timora.appointment.dto.AppointmentResponse;
import com.timora.appointment.dto.AppointmentSummaryResponse;
import com.timora.appointment.dto.CreateAppointmentRequest;
import com.timora.business.Branch;
import com.timora.business.BranchRepository;
import com.timora.business.Business;
import com.timora.business.Professional;
import com.timora.business.ProfessionalRepository;
import com.timora.business.ServiceOffering;
import com.timora.business.ServiceOfferingRepository;
import com.timora.publicbooking.dto.PublicCreateAppointmentRequest;
import com.timora.user.AppUser;
import com.timora.user.CurrentUserService;
import com.timora.client.Client;
import com.timora.client.ClientService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class AppointmentService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("America/Argentina/Buenos_Aires");

    private final AppointmentRepository appointmentRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ProfessionalRepository professionalRepository;
    private final BranchRepository branchRepository;
    private final CurrentUserService currentUserService;
    private final ClientService clientService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            ServiceOfferingRepository serviceOfferingRepository,
            ProfessionalRepository professionalRepository,
            BranchRepository branchRepository,
            CurrentUserService currentUserService,
            ClientService clientService
    ) {
        this.appointmentRepository = appointmentRepository;
        this.serviceOfferingRepository = serviceOfferingRepository;
        this.professionalRepository = professionalRepository;
        this.branchRepository = branchRepository;
        this.currentUserService = currentUserService;
        this.clientService = clientService;
    }

    @Transactional(readOnly = true)
    public AppointmentSummaryResponse getSummary(String period) {
        Business business = requireBusiness();
        DateRange range = resolvePeriodRange(period);

        return new AppointmentSummaryResponse(
                appointmentRepository.countActiveInRange(business.getId(), range.from(), range.to()),
                appointmentRepository.sumIncomeInRange(business.getId(), range.from(), range.to()),
                appointmentRepository.countNoShowsInRange(business.getId(), range.from(), range.to())
        );
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listForRange(Instant from, Instant to, AppointmentStatus status) {
        Business business = requireBusiness();
        List<Appointment> appointments = appointmentRepository.findByBusinessIdAndStartsAtBetweenOrderByStartsAtAsc(
                business.getId(),
                from,
                to
        );

        if (status != null) {
            appointments = appointments.stream()
                    .filter(appointment -> appointment.getStatus() == status)
                    .toList();
        }

        return appointments.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listToday() {
        DateRange today = resolvePeriodRange("today");
        return listForRange(today.from(), today.to(), null);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> listRecent() {
        Business business = requireBusiness();
        return appointmentRepository.findTop5ByBusinessIdOrderByCreatedAtDesc(business.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(Long id) {
        Business business = requireBusiness();
        Appointment appointment = appointmentRepository.findByIdAndBusinessId(id, business.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno no encontrado"));
        return toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse markNoShow(Long appointmentId) {
        Business business = requireBusiness();
        Appointment appointment = appointmentRepository.findByIdAndBusinessId(appointmentId, business.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno no encontrado"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se puede marcar no-show en un turno cancelado");
        }

        appointment.setStatus(AppointmentStatus.NO_SHOW);
        return toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse createPublic(Business business, PublicCreateAppointmentRequest request) {
        ServiceOffering service = serviceOfferingRepository.findById(request.serviceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Servicio inválido"));

        if (!service.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Servicio inválido");
        }

        Professional professional = professionalRepository.findById(request.professionalId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profesional inválido"));

        if (!professional.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profesional inválido");
        }

        Branch branch = resolveBranch(business.getId(), request.branchId());

        Instant startsAt = parseStartInstant(request.date(), request.time());
        Instant endsAt = startsAt.plusSeconds(service.getDurationMinutes() * 60L);

        if (startsAt.isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No podés reservar un horario pasado");
        }

        if (appointmentRepository.existsOverlapping(
                business.getId(),
                professional.getId(),
                startsAt,
                endsAt
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese horario ya no está disponible");
        }

        Appointment appointment = new Appointment();
        appointment.setBusiness(business);
        appointment.setService(service);
        appointment.setProfessional(professional);
        appointment.setBranch(branch);
        appointment.setClientFirstName(request.firstName().trim());
        appointment.setClientLastName(request.lastName().trim());
        appointment.setClientPhone(request.phone().trim());
        appointment.setClientEmail(normalizeOptional(request.email()));
        appointment.setNotes(normalizeOptional(request.notes()));
        appointment.setStartsAt(startsAt);
        appointment.setEndsAt(endsAt);
        appointment.setPrice(service.getPrice());
        appointment.setDepositAmount(computeDeposit(business, service.getPrice()));
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        Client client = clientService.getOrCreateClient(
                business,
                request.firstName(),
                request.lastName(),
                request.phone(),
                request.email()
        );
        appointment.setClient(client);

        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse createAdmin(CreateAppointmentRequest request) {
        Business business = requireBusiness();
        ServiceOffering service = serviceOfferingRepository.findById(request.serviceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Servicio inválido"));

        if (!service.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Servicio inválido");
        }

        Professional professional = professionalRepository.findById(request.professionalId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profesional inválido"));

        if (!professional.getBusiness().getId().equals(business.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profesional inválido");
        }

        Branch branch = resolveBranch(business.getId(), request.branchId());

        Instant startsAt = parseStartInstant(request.date(), request.time());
        Instant endsAt = startsAt.plusSeconds(service.getDurationMinutes() * 60L);

        if (appointmentRepository.existsOverlapping(
                business.getId(),
                professional.getId(),
                startsAt,
                endsAt
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese horario ya no está disponible");
        }

        Appointment appointment = new Appointment();
        appointment.setBusiness(business);
        appointment.setService(service);
        appointment.setProfessional(professional);
        appointment.setBranch(branch);
        appointment.setClientFirstName(request.firstName().trim());
        appointment.setClientLastName(request.lastName().trim());
        appointment.setClientPhone(request.phone().trim());
        appointment.setClientEmail(normalizeOptional(request.email()));
        appointment.setNotes(normalizeOptional(request.notes()));
        appointment.setStartsAt(startsAt);
        appointment.setEndsAt(endsAt);
        appointment.setPrice(service.getPrice());
        appointment.setDepositAmount(computeDeposit(business, service.getPrice()));
        appointment.setStatus(AppointmentStatus.CONFIRMED);

        Client client = clientService.getOrCreateClient(
                business,
                request.firstName(),
                request.lastName(),
                request.phone(),
                request.email()
        );
        appointment.setClient(client);

        return toResponse(appointmentRepository.save(appointment));
    }

    private BigDecimal computeDeposit(Business business, BigDecimal servicePrice) {
        if (!business.isDepositEnabled() || business.getDepositAmount() == null) {
            return null;
        }

        if (business.getDepositType() == com.timora.business.DepositType.PERCENTAGE) {
            if (servicePrice == null) {
                return null;
            }
            return servicePrice
                    .multiply(business.getDepositAmount())
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        }

        return business.getDepositAmount();
    }

    private Branch resolveBranch(Long businessId, Long branchId) {
        if (branchId == null) {
            List<Branch> branches = branchRepository.findByBusinessIdOrderByIdAsc(businessId);
            return branches.isEmpty() ? null : branches.get(0);
        }

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sucursal inválida"));

        if (!branch.getBusiness().getId().equals(businessId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sucursal inválida");
        }

        return branch;
    }

    private Instant parseStartInstant(String date, String time) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            LocalTime localTime = LocalTime.parse(time);
            return ZonedDateTime.of(localDate, localTime, BUSINESS_ZONE).toInstant();
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fecha u horario inválidos");
        }
    }

    private Business requireBusiness() {
        AppUser user = currentUserService.requireCurrentUser();
        return user.getBusiness();
    }

    private AppointmentResponse toResponse(Appointment appointment) {
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

        if (last.isEmpty() || first.equalsIgnoreCase(last)) {
            return first;
        }

        return first + " " + last;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private DateRange resolvePeriodRange(String period) {
        LocalDate today = LocalDate.now(BUSINESS_ZONE);

        return switch (period == null ? "today" : period.toLowerCase()) {
            case "week" -> {
                LocalDate start = today.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                yield new DateRange(
                        start.atStartOfDay(BUSINESS_ZONE).toInstant(),
                        start.plusDays(7).atStartOfDay(BUSINESS_ZONE).toInstant()
                );
            }
            case "month" -> {
                LocalDate start = today.withDayOfMonth(1);
                yield new DateRange(
                        start.atStartOfDay(BUSINESS_ZONE).toInstant(),
                        start.plusMonths(1).atStartOfDay(BUSINESS_ZONE).toInstant()
                );
            }
            default -> new DateRange(
                    today.atStartOfDay(BUSINESS_ZONE).toInstant(),
                    today.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant()
            );
        };
    }

    public DateRange resolveViewRange(String view, LocalDate anchorDate) {
        LocalDate date = anchorDate != null ? anchorDate : LocalDate.now(BUSINESS_ZONE);

        return switch (view == null ? "week" : view.toLowerCase()) {
            case "day" -> new DateRange(
                    date.atStartOfDay(BUSINESS_ZONE).toInstant(),
                    date.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant()
            );
            case "month" -> {
                LocalDate start = date.withDayOfMonth(1);
                yield new DateRange(
                        start.atStartOfDay(BUSINESS_ZONE).toInstant(),
                        start.plusMonths(1).atStartOfDay(BUSINESS_ZONE).toInstant()
                );
            }
            default -> {
                LocalDate start = date.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                yield new DateRange(
                        start.atStartOfDay(BUSINESS_ZONE).toInstant(),
                        start.plusDays(7).atStartOfDay(BUSINESS_ZONE).toInstant()
                );
            }
        };
    }

    public DateRange resolveExplicitRange(LocalDate from, LocalDate to) {
        LocalDate start = from.isAfter(to) ? to : from;
        LocalDate end = from.isAfter(to) ? from : to;

        return new DateRange(
                start.atStartOfDay(BUSINESS_ZONE).toInstant(),
                end.plusDays(1).atStartOfDay(BUSINESS_ZONE).toInstant()
        );
    }

    public record DateRange(Instant from, Instant to) {
    }

    @Transactional
    public AppointmentResponse update(Long id, com.timora.appointment.dto.UpdateAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno no encontrado"));

        if (request.serviceId() != null) {
            var service = serviceOfferingRepository.findById(request.serviceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Servicio inválido"));
            appointment.setService(service);
        }

        if (request.professionalId() != null) {
            var professional = professionalRepository.findById(request.professionalId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profesional inválido"));
            appointment.setProfessional(professional);
        }

        if (request.startsAt() != null) {
            Instant prevStart = appointment.getStartsAt();
            appointment.setStartsAt(request.startsAt());
            if (request.endsAt() != null) {
                appointment.setEndsAt(request.endsAt());
            } else {
                long durationSecs = Duration.between(prevStart, appointment.getEndsAt()).getSeconds();
                appointment.setEndsAt(request.startsAt().plusSeconds(durationSecs));
            }
        } else if (request.endsAt() != null) {
            appointment.setEndsAt(request.endsAt());
        }

        if (request.price() != null) {
            appointment.setPrice(request.price());
        }

        if (request.depositAmount() != null) {
            appointment.setDepositAmount(request.depositAmount());
        }

        if (request.status() != null) {
            try {
                appointment.setStatus(AppointmentStatus.valueOf(request.status()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido");
            }
        }

        return toResponse(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse cancel(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turno no encontrado"));
        appointment.setStatus(AppointmentStatus.CANCELLED);
        return toResponse(appointmentRepository.save(appointment));
    }
}
