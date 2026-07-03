package com.timora.onboarding.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateBrandRequest(
        @NotBlank
        @Size(min = 3, max = 80)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$")
        String slug,
        @Size(max = 300) String brandColor
) {
}
