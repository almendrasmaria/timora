package com.timora.client.dto;

import com.timora.appointment.dto.AppointmentResponse;
import java.time.Instant;
import java.util.List;

public record ClientDetailResponse(
    Long id,
    String firstName,
    String lastName,
    String phone,
    String email,
    String notes,
    Instant createdAt,
    List<AppointmentResponse> appointments
) {}
