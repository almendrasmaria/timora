package com.timora.business;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchRepository extends JpaRepository<Branch, Long> {

    List<Branch> findByBusinessIdOrderByIdAsc(Long businessId);

    long countByBusinessId(Long businessId);

    boolean existsByIdAndBusinessId(Long id, Long businessId);
}
