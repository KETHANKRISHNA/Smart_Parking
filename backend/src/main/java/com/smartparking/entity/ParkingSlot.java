package com.smartparking.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "parking_slots", indexes = {
    @Index(name = "idx_slot_location", columnList = "parking_location_id"),
    @Index(name = "idx_slot_status", columnList = "status"),
    @Index(name = "idx_slot_type", columnList = "slot_type")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_location_slot_number", columnNames = {"parking_location_id", "slot_number"})
})
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slot_number", nullable = false, length = 20)
    private String slotNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parking_location_id", nullable = false)
    @JsonIgnore
    private ParkingLocation parkingLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "slot_type", nullable = false, length = 30)
    private SlotType slotType = SlotType.CAR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SlotStatus status = SlotStatus.AVAILABLE;

    @Column(name = "custom_hourly_rate", precision = 10, scale = 2)
    private BigDecimal customHourlyRate;

    @Column(name = "floor_level", length = 20)
    private String floorLevel = "Ground";

    @Column(name = "has_ev_charger")
    private boolean hasEvCharger = false;

    public ParkingSlot() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }

    public ParkingLocation getParkingLocation() { return parkingLocation; }
    public void setParkingLocation(ParkingLocation parkingLocation) { this.parkingLocation = parkingLocation; }

    public SlotType getSlotType() { return slotType; }
    public void setSlotType(SlotType slotType) { this.slotType = slotType; }

    public SlotStatus getStatus() { return status; }
    public void setStatus(SlotStatus status) { this.status = status; }

    public BigDecimal getCustomHourlyRate() { return customHourlyRate; }
    public void setCustomHourlyRate(BigDecimal customHourlyRate) { this.customHourlyRate = customHourlyRate; }

    public String getFloorLevel() { return floorLevel; }
    public void setFloorLevel(String floorLevel) { this.floorLevel = floorLevel; }

    public boolean isHasEvCharger() { return hasEvCharger; }
    public void setHasEvCharger(boolean hasEvCharger) { this.hasEvCharger = hasEvCharger; }

    public BigDecimal getEffectiveHourlyRate() {
        if (customHourlyRate != null && customHourlyRate.compareTo(BigDecimal.ZERO) > 0) {
            return customHourlyRate;
        }
        return parkingLocation != null ? parkingLocation.getHourlyRate() : new BigDecimal("40.00");
    }
}
