package com.smartparking.repository;

import com.smartparking.entity.ParkingSlot;
import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    List<ParkingSlot> findByParkingLocationId(Long parkingLocationId);

    List<ParkingSlot> findByParkingLocationIdAndStatus(Long parkingLocationId, SlotStatus status);

    List<ParkingSlot> findByParkingLocationIdAndSlotType(Long parkingLocationId, SlotType slotType);

    Optional<ParkingSlot> findByParkingLocationIdAndSlotNumber(Long parkingLocationId, String slotNumber);

    long countByParkingLocationId(Long parkingLocationId);

    long countByParkingLocationIdAndStatus(Long parkingLocationId, SlotStatus status);
}
