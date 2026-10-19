package com.smartparking.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.smartparking.enums.SessionStatus;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "parking_sessions", indexes = {
    @Index(name = "idx_session_status", columnList = "session_status"),
    @Index(name = "idx_session_entry", columnList = "entry_time")
})
public class ParkingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    @JsonIgnore
    private Booking booking;

    @Column(name = "entry_time")
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    @Column(name = "entry_gate", length = 50)
    private String entryGate = "Gate 1 (Main Entrance)";

    @Column(name = "exit_gate", length = 50)
    private String exitGate = "Gate 2 (Main Exit)";

    @Enumerated(EnumType.STRING)
    @Column(name = "session_status", nullable = false, length = 30)
    private SessionStatus sessionStatus = SessionStatus.ACTIVE;

    @Column(name = "overtime_minutes")
    private Long overtimeMinutes = 0L;

    @Column(name = "additional_fee", precision = 10, scale = 2)
    private BigDecimal additionalFee = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ParkingSession() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
