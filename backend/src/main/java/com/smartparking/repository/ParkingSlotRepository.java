package com.smartparking.repository;

import com.smartparking.entity.ParkingSlot;
import com.smartparking.enums.SlotStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {

    List<ParkingSlot> findByParkingLocationId(Long parkingLocationId);

    Optional<ParkingSlot> findByParkingLocationIdAndSlotNumberIgnoreCase(Long parkingLocationId, String slotNumber);

    long countByParkingLocationId(Long parkingLocationId);

    long countByParkingLocationIdAndStatus(Long parkingLocationId, SlotStatus status);

    long countByStatus(SlotStatus status);

    /** Per facility: [locationId, total slots, out-of-service slots]. */
    @Query("SELECT s.parkingLocation.id, COUNT(s), " +
           "COALESCE(SUM(CASE WHEN s.status = com.smartparking.enums.SlotStatus.OUT_OF_SERVICE THEN 1 ELSE 0 END), 0) " +
           "FROM ParkingSlot s GROUP BY s.parkingLocation.id")
    List<Object[]> slotCountsByLocation();

    /** Row lock used to serialise concurrent bookings of the same slot (SELECT ... FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ParkingSlot s WHERE s.id = :id")
    Optional<ParkingSlot> findByIdForUpdate(@Param("id") Long id);
}
