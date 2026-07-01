package com.timora.onboarding.dto;

import com.timora.business.BusinessCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateBusinessRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull BusinessCategory category,
        @Size(max = 80) String specialty
) {
}
