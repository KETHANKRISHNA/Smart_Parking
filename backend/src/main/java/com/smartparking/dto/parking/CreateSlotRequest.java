package com.smartparking.dto.parking;

import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CreateSlotRequest {

    @NotBlank(message = "Slot number is required")
    private String slotNumber;

    @NotNull(message = "Parking location ID is required")
    private Long locationId;

    private SlotType slotType = SlotType.CAR;

    private SlotStatus status = SlotStatus.AVAILABLE;

    private BigDecimal customHourlyRate;

    private String floorLevel = "Ground";

    private boolean hasEvCharger = false;

    public CreateSlotRequest() {}

    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }

    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }

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
}
