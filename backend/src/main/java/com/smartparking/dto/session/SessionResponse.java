package com.smartparking.dto.session;

import com.smartparking.enums.SessionStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SessionResponse {
    private Long sessionId;
    private String bookingReference;
    private String userName;
    private String vehicleNumber;
    private String locationName;
    private String slotNumber;
    private LocalDateTime bookingStartTime;
    private LocalDateTime bookingEndTime;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String entryGate;
    private String exitGate;
    private SessionStatus sessionStatus;
    private Long overtimeMinutes;
    private BigDecimal additionalFee;
    private String message;
    private boolean valid;

    public SessionResponse() {}

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }

    public LocalDateTime getBookingStartTime() { return bookingStartTime; }
    public void setBookingStartTime(LocalDateTime bookingStartTime) { this.bookingStartTime = bookingStartTime; }

    public LocalDateTime getBookingEndTime() { return bookingEndTime; }
    public void setBookingEndTime(LocalDateTime bookingEndTime) { this.bookingEndTime = bookingEndTime; }

    public LocalDateTime getEntryTime() { return entryTime; }
    public void setEntryTime(LocalDateTime entryTime) { this.entryTime = entryTime; }

    public LocalDateTime getExitTime() { return exitTime; }
    public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }

    public String getEntryGate() { return entryGate; }
    public void setEntryGate(String entryGate) { this.entryGate = entryGate; }

    public String getExitGate() { return exitGate; }
    public void setExitGate(String exitGate) { this.exitGate = exitGate; }

    public SessionStatus getSessionStatus() { return sessionStatus; }
    public void setSessionStatus(SessionStatus sessionStatus) { this.sessionStatus = sessionStatus; }

    public Long getOvertimeMinutes() { return overtimeMinutes; }
    public void setOvertimeMinutes(Long overtimeMinutes) { this.overtimeMinutes = overtimeMinutes; }

    public BigDecimal getAdditionalFee() { return additionalFee; }
    public void setAdditionalFee(BigDecimal additionalFee) { this.additionalFee = additionalFee; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
}
