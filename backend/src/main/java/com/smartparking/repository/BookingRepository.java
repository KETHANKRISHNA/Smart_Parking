package com.smartparking.repository;

import com.smartparking.entity.Booking;
import com.smartparking.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    String DETAILS = "user,parkingLocation,parkingSlot,payment,parkingSession";

    /**
     * A booking occupies its slot while CONFIRMED, or while PENDING_PAYMENT and still inside the
     * payment window (created after {@code :cutoff}). Expired holds do not block anyone.
     */
    String BLOCKING = "(b.status = com.smartparking.enums.BookingStatus.CONFIRMED OR " +
            "(b.status = com.smartparking.enums.BookingStatus.PENDING_PAYMENT AND b.createdAt > :cutoff))";

    @EntityGraph(attributePaths = {"user", "parkingLocation", "parkingSlot", "payment", "parkingSession"})
    Optional<Booking> findByBookingReference(String bookingReference);

    @EntityGraph(attributePaths = {"user", "parkingLocation", "parkingSlot", "payment", "parkingSession"})
    Optional<Booking> findByQrToken(String qrToken);

    @EntityGraph(attributePaths = {"user", "parkingLocation", "parkingSlot", "payment", "parkingSession"})
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"user", "parkingLocation", "parkingSlot", "payment", "parkingSession"})
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId")
    Page<Booking> findByUser(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "parkingLocation", "parkingSlot", "payment", "parkingSession"})
    @Query("SELECT b FROM Booking b")
    Page<Booking> findAllDetailed(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "parkingLocation", "parkingSlot", "payment", "parkingSession"})
    @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC")
    List<Booking> findRecent(Pageable pageable);

    /** Bookings of a facility whose reserved window touches [from, to) — the manager's "today" view. */
    @EntityGraph(attributePaths = {"user", "parkingLocation", "parkingSlot", "payment", "parkingSession"})
    @Query("SELECT b FROM Booking b WHERE b.parkingLocation.id = :locationId " +
           "AND b.startTime < :to AND b.endTime > :from " +
           "AND b.status IN (com.smartparking.enums.BookingStatus.CONFIRMED, com.smartparking.enums.BookingStatus.COMPLETED) " +
           "ORDER BY b.startTime")
    List<Booking> findForLocationInWindow(@Param("locationId") Long locationId,
                                          @Param("from") LocalDateTime from,
                                          @Param("to") LocalDateTime to);

    @Query("SELECT b FROM Booking b WHERE b.parkingSlot.id = :slotId AND " + BLOCKING +
           " AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Booking> findOverlapping(@Param("slotId") Long slotId,
                                  @Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime,
                                  @Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT DISTINCT b.parkingSlot.id FROM Booking b WHERE b.parkingLocation.id = :locationId AND " + BLOCKING +
           " AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Long> findBookedSlotIdsInWindow(@Param("locationId") Long locationId,
                                         @Param("startTime") LocalDateTime startTime,
                                         @Param("endTime") LocalDateTime endTime,
                                         @Param("cutoff") LocalDateTime cutoff);

    /** Per facility: [locationId, number of distinct slots held or booked inside the window]. */
    @Query("SELECT b.parkingLocation.id, COUNT(DISTINCT b.parkingSlot.id) FROM Booking b WHERE " + BLOCKING +
           " AND b.startTime < :endTime AND b.endTime > :startTime GROUP BY b.parkingLocation.id")
    List<Object[]> bookedSlotCountsByLocation(@Param("startTime") LocalDateTime startTime,
                                              @Param("endTime") LocalDateTime endTime,
                                              @Param("cutoff") LocalDateTime cutoff);

    boolean existsByParkingSlotId(Long slotId);

    boolean existsByParkingLocationId(Long locationId);

    @Query("SELECT b FROM Booking b WHERE b.status = com.smartparking.enums.BookingStatus.PENDING_PAYMENT " +
           "AND b.createdAt <= :cutoff")
    List<Booking> findExpiredPending(@Param("cutoff") LocalDateTime cutoff);

    /** CONFIRMED bookings that were never used and whose window has fully passed (no-shows). */
    @Query("SELECT b FROM Booking b WHERE b.status = com.smartparking.enums.BookingStatus.CONFIRMED " +
           "AND b.endTime < :threshold AND b.parkingSession IS NULL")
    List<Booking> findNoShows(@Param("threshold") LocalDateTime threshold);

    long countByStatus(BookingStatus status);

    long countByUserIdAndStatusAndCreatedAtAfter(Long userId, BookingStatus status, LocalDateTime after);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt >= :from")
    long countCreatedSince(@Param("from") LocalDateTime from);

    @Query("SELECT b.parkingLocation.id, b.parkingLocation.name, COUNT(b), COALESCE(SUM(b.totalAmount), 0) " +
           "FROM Booking b WHERE b.status IN (com.smartparking.enums.BookingStatus.CONFIRMED, com.smartparking.enums.BookingStatus.COMPLETED) " +
           "GROUP BY b.parkingLocation.id, b.parkingLocation.name ORDER BY COUNT(b) DESC")
    List<Object[]> bookingStatsByLocation();

    @Query("SELECT b.vehicleType, COUNT(b) FROM Booking b " +
           "WHERE b.status <> com.smartparking.enums.BookingStatus.CANCELLED GROUP BY b.vehicleType")
    List<Object[]> countByVehicleType();

    /** Per calendar day since {@code from}: [date, paid revenue, non-cancelled bookings created]. */
    @Query("SELECT CAST(b.createdAt AS date), " +
           "COALESCE(SUM(CASE WHEN b.status IN (com.smartparking.enums.BookingStatus.CONFIRMED, com.smartparking.enums.BookingStatus.COMPLETED) " +
           "THEN b.totalAmount ELSE 0 END), 0), COUNT(b) FROM Booking b " +
           "WHERE b.createdAt >= :from AND b.status <> com.smartparking.enums.BookingStatus.CANCELLED " +
           "AND b.status <> com.smartparking.enums.BookingStatus.EXPIRED " +
           "GROUP BY CAST(b.createdAt AS date) ORDER BY CAST(b.createdAt AS date)")
    List<Object[]> dailyTrend(@Param("from") LocalDateTime from);

    /** Slots that are free right now but already promised to a booking whose window covers {@code now}. */
    @Query("SELECT COUNT(DISTINCT b.parkingSlot.id) FROM Booking b WHERE b.parkingSlot.status = com.smartparking.enums.SlotStatus.AVAILABLE " +
           "AND " + BLOCKING + " AND b.startTime <= :now AND b.endTime > :now")
    long countAvailableSlotsReservedAt(@Param("now") LocalDateTime now, @Param("cutoff") LocalDateTime cutoff);
}
