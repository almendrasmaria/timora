package com.timora.appointment.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record UpdateAppointmentRequest(
        Long serviceId,
        Long professionalId,
        Instant startsAt,
        Instant endsAt,
        BigDecimal price,
        BigDecimal depositAmount,
        String status
) {
}
