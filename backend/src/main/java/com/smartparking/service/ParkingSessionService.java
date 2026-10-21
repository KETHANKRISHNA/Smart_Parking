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
import com.smartparking.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;

/** Gate operations. Every call is scoped: staff can only process tickets for facilities they operate. */
@Service
public class ParkingSessionService {

    private static final String DEFAULT_ENTRY_GATE = "Main Entrance";
    private static final String DEFAULT_EXIT_GATE = "Main Exit";

    private final BookingRepository bookingRepository;
    private final ParkingSessionRepository sessionRepository;
    private final ParkingSlotRepository slotRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final FacilityAccessService facilityAccess;
    private final Clock clock;
    private final long entryGraceMinutes;

    public ParkingSessionService(BookingRepository bookingRepository,
                                 ParkingSessionRepository sessionRepository,
                                 ParkingSlotRepository slotRepository,
                                 NotificationService notificationService,
                                 AuditService auditService,
                                 FacilityAccessService facilityAccess,
                                 Clock clock,
                                 @Value("${app.booking.entry-grace-minutes:15}") long entryGraceMinutes) {
        this.bookingRepository = bookingRepository;
        this.sessionRepository = sessionRepository;
        this.slotRepository = slotRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.facilityAccess = facilityAccess;
        this.clock = clock;
        this.entryGraceMinutes = entryGraceMinutes;
    }

    @Transactional(readOnly = true)
    public SessionResponse verifyQrToken(String qrToken, CustomUserDetails staff) {
        Booking booking = findScopedBooking(qrToken, staff);
        ParkingSession session = booking.getParkingSession();
        LocalDateTime now = LocalDateTime.now(clock);

        SessionResponse res = mapToSessionResponse(booking, session);
        boolean entered = session != null && session.getEntryTime() != null;
        boolean exited = session != null && session.getExitTime() != null;

        String problem = switch (booking.getStatus()) {
            case PENDING_PAYMENT -> "Not payable yet: this booking is still waiting for payment";
            case CANCELLED -> "Invalid Ticket: this booking was cancelled";
            case COMPLETED -> "Already Used: this parking session is complete";
            case EXPIRED -> "Expired Ticket: the booking lapsed";
            case CONFIRMED -> null;
        };
        if (problem == null && !entered) {
            problem = entryWindowProblem(booking, now);
        }

        res.setValid(problem == null);
        if (problem != null) {
            res.setMessage(problem);
        } else if (entered && !exited) {
            res.setMessage("Vehicle is inside. Ready for exit.");
        } else {
            res.setMessage("Valid ticket: ready for gate entry");
        }
        return res;
    }

    @Transactional
    public SessionResponse processVehicleEntry(QrVerificationRequest request, CustomUserDetails staff) {
        Booking booking = findScopedBooking(request.getQrToken(), staff);
        LocalDateTime now = LocalDateTime.now(clock);

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Cannot enter: booking status is " + booking.getStatus());
        }
        ParkingSession session = booking.getParkingSession();
        if (session != null && session.getEntryTime() != null) {
            throw new BadRequestException("Duplicate scan: vehicle already entered at " + session.getEntryTime());
        }
        String problem = entryWindowProblem(booking, now);
        if (problem != null) {
            throw new BadRequestException(problem);
        }

        ParkingSlot slot = slotRepository.findByIdForUpdate(booking.getParkingSlot().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found"));
        if (slot.getStatus() == SlotStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("Bay " + slot.getSlotNumber() + " is out of service. Redirect the driver to the manager.");
        }
        if (slot.getStatus() == SlotStatus.OCCUPIED) {
            throw new BadRequestException("Bay " + slot.getSlotNumber() + " is still occupied by another vehicle.");
        }

        if (session == null) {
            session = new ParkingSession();
            session.setBooking(booking);
            booking.setParkingSession(session);
        }
        session.setEntryTime(now);
        session.setEntryGate(gateOrDefault(request.getGateName(), DEFAULT_ENTRY_GATE));
        session.setSessionStatus(SessionStatus.ACTIVE);

        slot.setStatus(SlotStatus.OCCUPIED);
        slotRepository.save(slot);
        ParkingSession saved = sessionRepository.save(session);

        notificationService.sendNotification(booking.getUser(), "Vehicle Entered Parking",
                "Your vehicle " + booking.getVehicleNumber() + " checked in at " + session.getEntryGate()
                        + " (Slot: " + slot.getSlotNumber() + ")",
                NotificationType.ENTRY_EXIT);
        auditService.log("GATE_ENTRY", staff.getEmail(), "ParkingSession", saved.getId(),
                "Vehicle " + booking.getVehicleNumber() + " entered slot " + slot.getSlotNumber(), null);

        SessionResponse res = mapToSessionResponse(booking, saved);
        res.setValid(true);
        res.setMessage("Vehicle entry approved! Gate opened.");
        return res;
    }

    @Transactional
    public SessionResponse processVehicleExit(QrVerificationRequest request, CustomUserDetails staff) {
        Booking booking = findScopedBooking(request.getQrToken(), staff);

        ParkingSession session = booking.getParkingSession();
        if (session == null || session.getEntryTime() == null) {
            throw new BadRequestException("Cannot exit: no entry record found for this ticket");
        }
        if (session.getExitTime() != null) {
            throw new BadRequestException("Duplicate scan: vehicle already exited at " + session.getExitTime());
        }

        LocalDateTime now = LocalDateTime.now(clock);
        session.setExitTime(now);
        session.setExitGate(gateOrDefault(request.getGateName(), DEFAULT_EXIT_GATE));

        String message = "Vehicle exit approved! Gate opened. Session completed.";
        if (now.isAfter(booking.getEndTime())) {
            long overtimeMin = Duration.between(booking.getEndTime(), now).toMinutes();
            BigDecimal fee = booking.getHourlyRate()
                    .multiply(BigDecimal.valueOf(Math.ceil(overtimeMin / 60.0)))
                    .setScale(2, RoundingMode.HALF_UP);
            session.setOvertimeMinutes(overtimeMin);
            session.setAdditionalFee(fee);
            session.setSessionStatus(SessionStatus.OVERSTAY);
            message = "Exit approved. Overstay of " + overtimeMin + " min: collect ₹" + fee + " at the gate.";
        } else {
            session.setSessionStatus(SessionStatus.COMPLETED);
        }

        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        // Free the bay, unless staff took it out of service while the vehicle was inside
        ParkingSlot slot = slotRepository.findByIdForUpdate(booking.getParkingSlot().getId()).orElse(null);
        if (slot != null && slot.getStatus() == SlotStatus.OCCUPIED) {
            slot.setStatus(SlotStatus.AVAILABLE);
            slotRepository.save(slot);
        }

        ParkingSession saved = sessionRepository.save(session);

        notificationService.sendNotification(booking.getUser(), "Vehicle Exited Parking",
                "Your vehicle " + booking.getVehicleNumber() + " exited at " + session.getExitGate()
                        + (session.getAdditionalFee() != null ? ". Overstay fee: ₹" + session.getAdditionalFee() : ". Session completed."),
                NotificationType.ENTRY_EXIT);
        auditService.log("GATE_EXIT", staff.getEmail(), "ParkingSession", saved.getId(),
                "Vehicle " + booking.getVehicleNumber() + " exited. Overtime: " + session.getOvertimeMinutes() + " min", null);

        SessionResponse res = mapToSessionResponse(booking, saved);
        res.setValid(true);
        res.setMessage(message);
        return res;
    }

    private Booking findScopedBooking(String qrToken, CustomUserDetails staff) {
        Booking booking = bookingRepository.findByQrToken(qrToken == null ? "" : qrToken.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or unrecognized parking QR ticket"));
        facilityAccess.requireAccess(staff, booking.getParkingLocation().getId());
        return booking;
    }

    /** Entry is allowed from {@code entryGraceMinutes} before the start until the booked window ends. */
    private String entryWindowProblem(Booking booking, LocalDateTime now) {
        if (now.isBefore(booking.getStartTime().minusMinutes(entryGraceMinutes))) {
            return "Too early: this ticket becomes valid at "
                    + booking.getStartTime().minusMinutes(entryGraceMinutes).toLocalTime();
        }
        if (now.isAfter(booking.getEndTime())) {
            return "Expired Ticket: the booked window ended at " + booking.getEndTime().toLocalTime();
        }
        return null;
    }

    private static String gateOrDefault(String gate, String fallback) {
        return gate == null || gate.isBlank() ? fallback : gate.trim();
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
