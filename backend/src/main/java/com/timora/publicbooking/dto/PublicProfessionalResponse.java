package com.timora.publicbooking.dto;

import java.util.List;

public record PublicProfessionalResponse(
        Long id,
        String name,
        String availabilityJson,
        List<Long> branchIds
) {
}
