package com.smartparking.dto.parking;

import com.smartparking.enums.SlotStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateSlotStatusRequest {

    @NotNull(message = "Status is required")
    private SlotStatus status;

    public UpdateSlotStatusRequest() {}

    public SlotStatus getStatus() { return status; }
    public void setStatus(SlotStatus status) { this.status = status; }
}
