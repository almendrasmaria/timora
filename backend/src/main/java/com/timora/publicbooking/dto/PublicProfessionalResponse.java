package com.timora.publicbooking.dto;

public record PublicProfessionalResponse(
        Long id,
        String name,
        String availabilityJson
) {
}
