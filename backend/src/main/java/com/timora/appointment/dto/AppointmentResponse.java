package com.timora.appointment.dto;

import com.timora.appointment.AppointmentStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record AppointmentResponse(
        Long id,
        String clientFirstName,
        String clientLastName,
        String clientPhone,
        String clientEmail,
        String notes,
        Long serviceId,
        String serviceName,
        int durationMinutes,
        Long professionalId,
        String professionalName,
        Long branchId,
        String branchName,
        String branchAddress,
        Instant startsAt,
        Instant endsAt,
        BigDecimal price,
        BigDecimal depositAmount,
        AppointmentStatus status,
        Instant createdAt
) {
}
