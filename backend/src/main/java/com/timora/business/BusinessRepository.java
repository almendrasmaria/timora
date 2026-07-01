package com.timora.business;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BusinessRepository extends JpaRepository<Business, Long> {

    boolean existsBySlug(String slug);

    Optional<Business> findBySlug(String slug);

    Optional<Business> findBySlugAndOnboardingCompletedTrue(String slug);
}
