package com.timora.client;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    Optional<Client> findByBusinessIdAndPhone(Long businessId, String phone);

    @Query("SELECT DISTINCT c FROM Client c " +
           "LEFT JOIN Appointment a ON a.client = c " +
           "LEFT JOIN a.professional p " +
           "WHERE c.business.id = :businessId " +
           "AND (:query IS NULL OR " +
           "     LOWER(c.firstName) LIKE :query OR " +
           "     LOWER(c.lastName) LIKE :query OR " +
           "     c.phone LIKE :query OR " +
           "     LOWER(c.email) LIKE :query) " +
           "AND (:professionalId IS NULL OR p.id = :professionalId) " +
           "ORDER BY c.firstName ASC, c.lastName ASC")
    List<Client> searchClients(
            @Param("businessId") Long businessId,
            @Param("query") String query,
            @Param("professionalId") Long professionalId
    );
}
