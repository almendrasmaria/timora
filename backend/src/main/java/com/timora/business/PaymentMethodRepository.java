package com.timora.business;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    List<PaymentMethod> findByBusinessIdOrderByIdAsc(Long businessId);

    long countByBusinessId(Long businessId);

    boolean existsByIdAndBusinessId(Long id, Long businessId);
}
