package com.timora.client.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClientRequest(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 80, message = "El nombre no puede superar los 80 caracteres")
    String firstName,

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 80, message = "El apellido no puede superar los 80 caracteres")
    String lastName,

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(max = 32, message = "El teléfono no puede superar los 32 caracteres")
    String phone,

    @Size(max = 255, message = "El email no puede superar los 255 caracteres")
    String email,

    String notes
) {}
