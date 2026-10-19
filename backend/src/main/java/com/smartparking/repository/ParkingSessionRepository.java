package com.smartparking.repository;

import com.smartparking.entity.ParkingSession;
import com.smartparking.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSessionRepository extends JpaRepository<ParkingSession, Long> {
    Optional<ParkingSession> findByBookingId(Long bookingId);

    Optional<ParkingSession> findByBookingQrToken(String qrToken);

    List<ParkingSession> findBySessionStatus(SessionStatus sessionStatus);

    @Query("SELECT s FROM ParkingSession s WHERE s.booking.parkingLocation.id = :locationId AND s.sessionStatus = :status")
    List<ParkingSession> findByLocationIdAndStatus(@Param("locationId") Long locationId, @Param("status") SessionStatus status);
}
