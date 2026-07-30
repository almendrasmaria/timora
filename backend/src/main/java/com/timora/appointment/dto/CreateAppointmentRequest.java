package com.timora.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAppointmentRequest(
        @NotNull Long serviceId,
        @NotNull Long professionalId,
        Long branchId,
        @NotBlank @Size(max = 10) String date,
        @NotBlank @Size(max = 5) String time,
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @NotBlank @Size(max = 32) String phone,
        @Size(max = 255) String email,
        @Size(max = 2000) String notes
) {
}
