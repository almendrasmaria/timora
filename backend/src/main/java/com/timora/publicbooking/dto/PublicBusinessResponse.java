package com.timora.publicbooking.dto;

import com.timora.business.PaymentMethodType;

import java.util.List;

public record PublicBusinessResponse(
        String name,
        String slug,
        String brandColor,
        String whatsapp,
        List<PublicServiceResponse> services,
        List<PublicProfessionalResponse> professionals,
        List<PublicBranchResponse> branches,
        List<PaymentMethodType> paymentMethods
) {
}
