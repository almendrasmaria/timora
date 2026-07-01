package com.timora.business;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {

    List<ServiceOffering> findByBusinessIdOrderByIdAsc(Long businessId);

    long countByBusinessId(Long businessId);

    boolean existsByIdAndBusinessId(Long id, Long businessId);
}
