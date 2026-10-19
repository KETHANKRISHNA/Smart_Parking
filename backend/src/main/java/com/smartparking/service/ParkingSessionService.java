package com.smartparking.service;

import com.smartparking.dto.session.QrVerificationRequest;
import com.smartparking.dto.session.SessionResponse;
import com.smartparking.entity.Booking;
import com.smartparking.entity.ParkingSession;
import com.smartparking.entity.ParkingSlot;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.NotificationType;
import com.smartparking.enums.SessionStatus;
import com.smartparking.enums.SlotStatus;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.ParkingSessionRepository;
import com.smartparking.repository.ParkingSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class ParkingSessionService {

    private final BookingRepository bookingRepository;
    private final ParkingSessionRepository sessionRepository;
    private final ParkingSlotRepository slotRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public ParkingSessionService(BookingRepository bookingRepository,
                                 ParkingSessionRepository sessionRepository,
                                 ParkingSlotRepository slotRepository,
                                 NotificationService notificationService,
                                 AuditService auditService) {
        this.bookingRepository = bookingRepository;
        this.sessionRepository = sessionRepository;
        this.slotRepository = slotRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public SessionResponse verifyQrToken(String qrToken) {
        Booking booking = bookingRepository.findByQrToken(qrToken)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized parking QR token"));

        SessionResponse res = mapToSessionResponse(booking, booking.getParkingSession());
        res.setValid(booking.getStatus() == BookingStatus.CONFIRMED);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            res.setMessage("Invalid Ticket: This booking was cancelled");
        } else if (booking.getStatus() == BookingStatus.COMPLETED) {
            res.setMessage("Already Used: This booking has already completed its parking session");
        } else if (booking.getStatus() == BookingStatus.EXPIRED) {
            res.setMessage("Expired Ticket: Booking time window has passed");
        } else {
            res.setMessage("Valid Ticket: Ready for gate entry/exit");
        }

        return res;
    }

    @Transactional
    public SessionResponse processVehicleEntry(QrVerificationRequest request, String managerEmail) {
        Booking booking = bookingRepository.findByQrToken(request.getQrToken())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid parking QR ticket"));

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Cannot enter: Booking status is " + booking.getStatus());
        }

        ParkingSession session = booking.getParkingSession();
        if (session != null && session.getEntryTime() != null) {
            throw new BadRequestException("Duplicate scan: Vehicle has already entered at " + session.getEntryTime());
        }

        if (session == null) {
            session = new ParkingSession();
            session.setBooking(booking);
            booking.setParkingSession(session);
        }

        session.setEntryTime(LocalDateTime.now());
        session.setEntryGate(request.getGateName() != null ? request.getGateName() : "Gate 1 (Main Entrance)");
        session.setSessionStatus(SessionStatus.ACTIVE);

        // Mark the parking slot as OCCUPIED
        ParkingSlot slot = booking.getParkingSlot();
        if (slot != null) {
            slot.setStatus(SlotStatus.OCCUPIED);
            slotRepository.save(slot);
        }

        ParkingSession saved = sessionRepository.save(session);

        notificationService.sendNotification(
                booking.getUser(),
                "Vehicle Entered Parking",
                "Your vehicle " + booking.getVehicleNumber() + " checked in at " + session.getEntryGate() +
                        " (Slot: " + slot.getSlotNumber() + ")",
                NotificationType.ENTRY_EXIT
        );

        auditService.log("GATE_ENTRY", managerEmail, "ParkingSession", saved.getId(),
                "Vehicle " + booking.getVehicleNumber() + " entered slot " + slot.getSlotNumber(), null);

        SessionResponse res = mapToSessionResponse(booking, saved);
        res.setValid(true);
        res.setMessage("Vehicle entry approved! Gate opened.");
        return res;
    }

    @Transactional
    public SessionResponse processVehicleExit(QrVerificationRequest request, String managerEmail) {
        Booking booking = bookingRepository.findByQrToken(request.getQrToken())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid parking QR ticket"));

        ParkingSession session = booking.getParkingSession();
        if (session == null || session.getEntryTime() == null) {
            throw new BadRequestException("Cannot exit: No active entry record found for this vehicle ticket");
        }

        if (session.getExitTime() != null) {
            throw new BadRequestException("Duplicate scan: Vehicle has already exited at " + session.getExitTime());
        }

        LocalDateTime now = LocalDateTime.now();
        session.setExitTime(now);
        session.setExitGate(request.getGateName() != null ? request.getGateName() : "Gate 2 (Main Exit)");

        // Calculate overtime if exit is past booking end time
        if (now.isAfter(booking.getEndTime())) {
            long overtimeMin = Duration.between(booking.getEndTime(), now).toMinutes();
            session.setOvertimeMinutes(overtimeMin);
            session.setSessionStatus(SessionStatus.OVERSTAY);

            double extraHours = Math.ceil(overtimeMin / 60.0);
            BigDecimal overtimeFee = booking.getHourlyRate().multiply(BigDecimal.valueOf(extraHours))
                    .setScale(2, RoundingMode.HALF_UP);
            session.setAdditionalFee(overtimeFee);
        } else {
            session.setSessionStatus(SessionStatus.COMPLETED);
        }

        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        // Free up the slot back to AVAILABLE
        ParkingSlot slot = booking.getParkingSlot();
        if (slot != null) {
            slot.setStatus(SlotStatus.AVAILABLE);
            slotRepository.save(slot);
        }

        ParkingSession saved = sessionRepository.save(session);

        notificationService.sendNotification(
                booking.getUser(),
                "Vehicle Exited Parking",
                "Your vehicle " + booking.getVehicleNumber() + " successfully exited at " + session.getExitGate() +
                        ". Session completed.",
                NotificationType.ENTRY_EXIT
        );

        auditService.log("GATE_EXIT", managerEmail, "ParkingSession", saved.getId(),
                "Vehicle " + booking.getVehicleNumber() + " exited. Overtime: " + session.getOvertimeMinutes() + " mins", null);

        SessionResponse res = mapToSessionResponse(booking, saved);
        res.setValid(true);
        res.setMessage("Vehicle exit approved! Gate opened. Session completed.");
        return res;
    }

    private SessionResponse mapToSessionResponse(Booking b, ParkingSession s) {
        SessionResponse res = new SessionResponse();
        res.setBookingReference(b.getBookingReference());
        res.setUserName(b.getUser() != null ? b.getUser().getName() : "Guest");
        res.setVehicleNumber(b.getVehicleNumber());
        res.setLocationName(b.getParkingLocation() != null ? b.getParkingLocation().getName() : "N/A");
        res.setSlotNumber(b.getParkingSlot() != null ? b.getParkingSlot().getSlotNumber() : "N/A");
        res.setBookingStartTime(b.getStartTime());
        res.setBookingEndTime(b.getEndTime());

        if (s != null) {
            res.setSessionId(s.getId());
            res.setEntryTime(s.getEntryTime());
            res.setExitTime(s.getExitTime());
            res.setEntryGate(s.getEntryGate());
            res.setExitGate(s.getExitGate());
            res.setSessionStatus(s.getSessionStatus());
            res.setOvertimeMinutes(s.getOvertimeMinutes());
            res.setAdditionalFee(s.getAdditionalFee());
        }

        return res;
    }
}
