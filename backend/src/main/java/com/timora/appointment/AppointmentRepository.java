package com.timora.appointment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByIdAndBusinessId(Long id, Long businessId);

    List<Appointment> findByBusinessIdAndStartsAtBetweenOrderByStartsAtAsc(
            Long businessId,
            Instant from,
            Instant to
    );

    List<Appointment> findByBusinessIdAndStatusOrderByStartsAtDesc(
            Long businessId,
            AppointmentStatus status
    );

    List<Appointment> findTop5ByBusinessIdOrderByCreatedAtDesc(Long businessId);

    @Query("""
            SELECT COUNT(a) FROM Appointment a
            WHERE a.business.id = :businessId
              AND a.startsAt >= :from AND a.startsAt < :to
              AND a.status <> com.timora.appointment.AppointmentStatus.CANCELLED
            """)
    long countActiveInRange(
            @Param("businessId") Long businessId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT COUNT(a) FROM Appointment a
            WHERE a.business.id = :businessId
              AND a.startsAt >= :from AND a.startsAt < :to
              AND a.status = com.timora.appointment.AppointmentStatus.NO_SHOW
            """)
    long countNoShowsInRange(
            @Param("businessId") Long businessId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT COUNT(a) FROM Appointment a
            WHERE a.business.id = :businessId
              AND a.startsAt >= :from AND a.startsAt < :to
              AND a.status IN (
                com.timora.appointment.AppointmentStatus.COMPLETED,
                com.timora.appointment.AppointmentStatus.NO_SHOW
              )
            """)
    long countAttendanceMarkedInRange(
            @Param("businessId") Long businessId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT COALESCE(SUM(a.price), 0) FROM Appointment a
            WHERE a.business.id = :businessId
              AND a.startsAt >= :from AND a.startsAt < :to
              AND a.status IN (
                com.timora.appointment.AppointmentStatus.CONFIRMED,
                com.timora.appointment.AppointmentStatus.COMPLETED
              )
            """)
    java.math.BigDecimal sumIncomeInRange(
            @Param("businessId") Long businessId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT COUNT(a) > 0 FROM Appointment a
            WHERE a.business.id = :businessId
              AND a.professional.id = :professionalId
              AND a.status = com.timora.appointment.AppointmentStatus.CONFIRMED
              AND a.startsAt < :endsAt AND a.endsAt > :startsAt
            """)
    boolean existsOverlapping(
            @Param("businessId") Long businessId,
            @Param("professionalId") Long professionalId,
            @Param("startsAt") Instant startsAt,
            @Param("endsAt") Instant endsAt
    );

    @Query("""
            SELECT a FROM Appointment a
            WHERE a.professional.id = :professionalId
              AND a.startsAt >= :from AND a.startsAt < :to
              AND a.status <> com.timora.appointment.AppointmentStatus.CANCELLED
            ORDER BY a.startsAt ASC
            """)
    List<Appointment> findActiveByProfessionalInRange(
            @Param("professionalId") Long professionalId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );
    List<Appointment> findByClientIdOrderByStartsAtDesc(Long clientId);
    long countByClientId(Long clientId);
}
