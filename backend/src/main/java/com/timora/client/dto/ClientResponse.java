package com.timora.client.dto;

import java.time.Instant;

public record ClientResponse(
    Long id,
    String firstName,
    String lastName,
    String phone,
    String email,
    String notes,
    Instant createdAt
) {}
