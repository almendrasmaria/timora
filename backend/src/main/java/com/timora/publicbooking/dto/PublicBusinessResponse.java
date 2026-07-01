package com.timora.publicbooking.dto;

import com.timora.business.PaymentMethodType;

import java.util.List;

public record PublicBusinessResponse(
        String name,
        String slug,
        String brandColor,
        List<PublicServiceResponse> services,
        List<PaymentMethodType> paymentMethods
) {
}
