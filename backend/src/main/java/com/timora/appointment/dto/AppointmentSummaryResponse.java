package com.timora.appointment.dto;

import java.math.BigDecimal;

public record AppointmentSummaryResponse(
        long appointmentsCount,
        BigDecimal incomeTotal,
        long noShowCount,
        long attendanceMarkedCount
) {
}
