package com.timora.onboarding.dto;

import com.timora.business.BusinessCategory;
import com.timora.business.PaymentMethodType;

import java.math.BigDecimal;
import java.util.List;

public record OnboardingStateResponse(
        boolean completed,
        int currentStep,
        BusinessState business,
        List<BranchState> branches,
        List<ProfessionalState> professionals,
        List<ServiceState> services,
        List<PaymentMethodState> paymentMethods
) {
    public record BusinessState(
            String name,
            BusinessCategory category,
            String specialty,
            String whatsapp,
            String instagram,
            String slug,
            String brandColor,
            String logoUrl,
            boolean showWhatsappToClients,
            String reminderTemplate,
            String bioLinkText,
            boolean bioShowBooking,
            boolean bioShowLocation,
            boolean bioShowWhatsapp
    ) {
    }

    public record BranchState(Long id, String name, String address) {
    }

    public record ProfessionalState(
            Long id,
            String firstName,
            String lastName,
            String availabilityJson,
            List<Long> branchIds
    ) {
    }

    public record ServiceState(
            Long id,
            String name,
            int durationMinutes,
            BigDecimal price,
            BigDecimal depositAmount
    ) {
    }

    public record PaymentMethodState(Long id, PaymentMethodType type) {
    }
}
