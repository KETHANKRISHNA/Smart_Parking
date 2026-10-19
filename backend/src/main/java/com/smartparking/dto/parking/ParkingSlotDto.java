package com.smartparking.dto.parking;

import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import java.math.BigDecimal;

public class ParkingSlotDto {
    private Long id;
    private String slotNumber;
    private Long locationId;
    private String locationName;
    private SlotType slotType;
    private SlotStatus status;
    private BigDecimal customHourlyRate;
    private BigDecimal effectiveHourlyRate;
    private String floorLevel;
    private boolean hasEvCharger;
    private boolean isBookedForWindow;

    public ParkingSlotDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public SlotType getSlotType() { return slotType; }
    public void setSlotType(SlotType slotType) { this.slotType = slotType; }

    public SlotStatus getStatus() { return status; }
    public void setStatus(SlotStatus status) { this.status = status; }

    public BigDecimal getCustomHourlyRate() { return customHourlyRate; }
    public void setCustomHourlyRate(BigDecimal customHourlyRate) { this.customHourlyRate = customHourlyRate; }

    public BigDecimal getEffectiveHourlyRate() { return effectiveHourlyRate; }
    public void setEffectiveHourlyRate(BigDecimal effectiveHourlyRate) { this.effectiveHourlyRate = effectiveHourlyRate; }

    public String getFloorLevel() { return floorLevel; }
    public void setFloorLevel(String floorLevel) { this.floorLevel = floorLevel; }

    public boolean isHasEvCharger() { return hasEvCharger; }
    public void setHasEvCharger(boolean hasEvCharger) { this.hasEvCharger = hasEvCharger; }

    public boolean isBookedForWindow() { return isBookedForWindow; }
    public void setBookedForWindow(boolean bookedForWindow) { isBookedForWindow = bookedForWindow; }
}
