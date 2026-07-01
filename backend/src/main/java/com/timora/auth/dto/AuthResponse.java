package com.timora.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        String email,
        Long businessId,
        String businessSlug,
        boolean onboardingCompleted,
        int onboardingStep
) {
    public static AuthResponse of(
            String accessToken,
            String email,
            Long businessId,
            String businessSlug,
            boolean onboardingCompleted,
            int onboardingStep
    ) {
        return new AuthResponse(
                accessToken,
                "Bearer",
                email,
                businessId,
                businessSlug,
                onboardingCompleted,
                onboardingStep
        );
    }
}
