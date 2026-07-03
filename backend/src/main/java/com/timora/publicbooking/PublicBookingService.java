package com.timora.publicbooking;

import com.timora.business.BranchRepository;
import com.timora.business.Business;
import com.timora.business.BusinessRepository;
import com.timora.business.PaymentMethodRepository;
import com.timora.business.ProfessionalRepository;
import com.timora.business.ServiceOfferingRepository;
import com.timora.publicbooking.dto.PublicBranchResponse;
import com.timora.publicbooking.dto.PublicBusinessResponse;
import com.timora.publicbooking.dto.PublicProfessionalResponse;
import com.timora.publicbooking.dto.PublicServiceResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PublicBookingService {

    private final BusinessRepository businessRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ProfessionalRepository professionalRepository;
    private final BranchRepository branchRepository;
    private final PaymentMethodRepository paymentMethodRepository;

    public PublicBookingService(
            BusinessRepository businessRepository,
            ServiceOfferingRepository serviceOfferingRepository,
            ProfessionalRepository professionalRepository,
            BranchRepository branchRepository,
            PaymentMethodRepository paymentMethodRepository
    ) {
        this.businessRepository = businessRepository;
        this.serviceOfferingRepository = serviceOfferingRepository;
        this.professionalRepository = professionalRepository;
        this.branchRepository = branchRepository;
        this.paymentMethodRepository = paymentMethodRepository;
    }

    @Transactional(readOnly = true)
    public PublicBusinessResponse getBySlug(String slug) {
        Business business = requirePublishedBusiness(slug);
        Long businessId = business.getId();

        var services = serviceOfferingRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                .map(service -> new PublicServiceResponse(
                        service.getId(),
                        service.getName(),
                        service.getDurationMinutes(),
                        service.getPrice(),
                        service.getDepositAmount()))
                .toList();

        var professionals = professionalRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                .map(professional -> new PublicProfessionalResponse(
                        professional.getId(),
                        formatProfessionalName(professional.getFirstName(), professional.getLastName()),
                        professional.getAvailabilityJson(),
                        professional.getBranches().stream().map(com.timora.business.Branch::getId).toList()))
                .toList();

        var branches = branchRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                .map(branch -> new PublicBranchResponse(
                        branch.getId(),
                        branch.getName(),
                        branch.getAddress()))
                .toList();

        var paymentMethods = paymentMethodRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                .map(method -> method.getType())
                .toList();

        return new PublicBusinessResponse(
                business.getName(),
                business.getSlug(),
                business.getBrandColor(),
                business.getWhatsapp(),
                business.getLogoUrl(),
                business.getCategory() != null ? business.getCategory().name() : null,
                business.getBioLinkText(),
                business.isBioShowBooking(),
                business.isBioShowLocation(),
                business.isBioShowWhatsapp(),
                services,
                professionals,
                branches,
                paymentMethods
        );
    }

    @Transactional(readOnly = true)
    public Business requirePublishedBusiness(String slug) {
        Business business = businessRepository.findBySlugAndOnboardingCompletedTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado"));

        if (business.getSlug().startsWith("tmp-")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado");
        }

        return business;
    }

    private String formatProfessionalName(String firstName, String lastName) {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();

        if (first.isEmpty()) {
            return last;
        }

        if (last.isEmpty() || first.equalsIgnoreCase(last)) {
            return first;
        }

        return first + " " + last;
    }
}
