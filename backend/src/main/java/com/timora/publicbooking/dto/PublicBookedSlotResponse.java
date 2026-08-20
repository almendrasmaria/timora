package com.timora.publicbooking.dto;

public record PublicBookedSlotResponse(
        String date,
        String start,
        String end
) {
}
