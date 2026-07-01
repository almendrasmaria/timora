package com.timora.onboarding.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateServiceRequest(
        @NotBlank @Size(max = 120) String name,
        @Min(5) int durationMinutes,
        BigDecimal price,
        BigDecimal depositAmount
) {
}
