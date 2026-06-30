package com.timora.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        String email,
        Long businessId,
        String businessSlug
) {
    public static AuthResponse of(String accessToken, String email, Long businessId, String businessSlug) {
        return new AuthResponse(accessToken, "Bearer", email, businessId, businessSlug);
    }
}
