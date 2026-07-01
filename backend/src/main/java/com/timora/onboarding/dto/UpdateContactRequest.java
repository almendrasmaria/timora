package com.timora.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateContactRequest(
        @NotBlank @Size(max = 32) String whatsapp,
        @Size(max = 80) String instagram
) {
}
