package com.timora.business;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSettingsRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 32) String whatsapp,
        @Size(max = 80) String instagram,
        @Size(max = 32) String brandColor,
        boolean showWhatsappToClients,
        @Size(max = 500) String reminderTemplate,
        @Size(max = 280) String bioLinkText,
        boolean bioShowBooking,
        boolean bioShowLocation,
        boolean bioShowWhatsapp
) {
}
