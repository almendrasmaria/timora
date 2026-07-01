package com.timora.publicbooking;

import com.timora.business.Business;
import com.timora.business.BusinessRepository;
import com.timora.business.PaymentMethodRepository;
import com.timora.business.ServiceOfferingRepository;
import com.timora.publicbooking.dto.PublicBusinessResponse;
import com.timora.publicbooking.dto.PublicServiceResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PublicBookingService {

    private final BusinessRepository businessRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final PaymentMethodRepository paymentMethodRepository;

    public PublicBookingService(
            BusinessRepository businessRepository,
            ServiceOfferingRepository serviceOfferingRepository,
            PaymentMethodRepository paymentMethodRepository
    ) {
        this.businessRepository = businessRepository;
        this.serviceOfferingRepository = serviceOfferingRepository;
        this.paymentMethodRepository = paymentMethodRepository;
    }

    @Transactional(readOnly = true)
    public PublicBusinessResponse getBySlug(String slug) {
        Business business = businessRepository.findBySlugAndOnboardingCompletedTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado"));

        if (business.getSlug().startsWith("tmp-")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no encontrado");
        }

        Long businessId = business.getId();

        var services = serviceOfferingRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                .map(service -> new PublicServiceResponse(
                        service.getId(),
                        service.getName(),
                        service.getDurationMinutes(),
                        service.getPrice(),
                        service.getDepositAmount()))
                .toList();

        var paymentMethods = paymentMethodRepository.findByBusinessIdOrderByIdAsc(businessId).stream()
                .map(method -> method.getType())
                .toList();

        return new PublicBusinessResponse(
                business.getName(),
                business.getSlug(),
                business.getBrandColor(),
                services,
                paymentMethods
        );
    }
}
