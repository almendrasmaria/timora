package com.timora.publicbooking.dto;

import java.math.BigDecimal;

public record PublicServiceResponse(
        Long id,
        String name,
        int durationMinutes,
        BigDecimal price,
        BigDecimal depositAmount
) {
}
