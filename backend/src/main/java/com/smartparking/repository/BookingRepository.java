package com.smartparking.repository;

import com.smartparking.entity.Booking;
import com.smartparking.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingReference(String bookingReference);

    Optional<Booking> findByQrToken(String qrToken);

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Booking> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Booking> findByParkingLocationIdOrderByCreatedAtDesc(Long locationId);

    long countByStatus(BookingStatus status);

    long countByParkingLocationIdAndStatus(Long locationId, BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.parkingSlot.id = :slotId " +
           "AND b.status IN (com.smartparking.enums.BookingStatus.CONFIRMED, com.smartparking.enums.BookingStatus.PENDING_PAYMENT) " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlappingBookings(@Param("slotId") Long slotId,
                                         @Param("startTime") LocalDateTime startTime,
                                         @Param("endTime") LocalDateTime endTime);

    @Query("SELECT DISTINCT b.parkingSlot.id FROM Booking b WHERE b.parkingLocation.id = :locationId " +
           "AND b.status IN (com.smartparking.enums.BookingStatus.CONFIRMED, com.smartparking.enums.BookingStatus.PENDING_PAYMENT) " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Long> findBookedSlotIdsInWindow(@Param("locationId") Long locationId,
                                        @Param("startTime") LocalDateTime startTime,
                                        @Param("endTime") LocalDateTime endTime);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b " +
           "WHERE b.status IN (com.smartparking.enums.BookingStatus.CONFIRMED, com.smartparking.enums.BookingStatus.COMPLETED)")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT b FROM Booking b WHERE b.createdAt >= :startOfDay ORDER BY b.createdAt DESC")
    List<Booking> findTodaysBookings(@Param("startOfDay") LocalDateTime startOfDay);

    @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC")
    List<Booking> findRecentBookings(Pageable pageable);
}
