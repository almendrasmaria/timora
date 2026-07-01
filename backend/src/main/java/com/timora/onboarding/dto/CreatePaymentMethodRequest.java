package com.timora.onboarding.dto;

import com.timora.business.PaymentMethodType;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentMethodRequest(@NotNull PaymentMethodType type) {
}
