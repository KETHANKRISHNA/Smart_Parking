package com.smartparking.service;

import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.dto.booking.CreateBookingRequest;
import com.smartparking.entity.Booking;
import com.smartparking.entity.ParkingLocation;
import com.smartparking.entity.ParkingSlot;
import com.smartparking.entity.User;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.NotificationType;
import com.smartparking.enums.PaymentStatus;
import com.smartparking.enums.Role;
import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.exception.SlotAlreadyBookedException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.ParkingLocationRepository;
import com.smartparking.repository.ParkingSlotRepository;
import com.smartparking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BookingService {

    static final int MIN_MINUTES = 30;
    static final int MAX_MINUTES = 24 * 60;
    static final int MAX_DAYS_AHEAD = 30;
    static final int MAX_OPEN_HOLDS_PER_USER = 3;
    static final int REFUND_WINDOW_MINUTES = 60;
    private static final int LIST_LIMIT = 200;

    private final BookingRepository bookingRepository;
    private final ParkingLocationRepository locationRepository;
    private final ParkingSlotRepository slotRepository;
    private final UserRepository userRepository;
    private final QrCodeService qrCodeService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final Clock clock;
    private final long paymentWindowMinutes;

    public BookingService(BookingRepository bookingRepository,
                          ParkingLocationRepository locationRepository,
                          ParkingSlotRepository slotRepository,
                          UserRepository userRepository,
                          QrCodeService qrCodeService,
                          NotificationService notificationService,
                          AuditService auditService,
                          Clock clock,
                          @Value("${app.booking.payment-window-minutes:15}") long paymentWindowMinutes) {
        this.bookingRepository = bookingRepository;
        this.locationRepository = locationRepository;
        this.slotRepository = slotRepository;
        this.userRepository = userRepository;
        this.qrCodeService = qrCodeService;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.clock = clock;
        this.paymentWindowMinutes = paymentWindowMinutes;
    }

    /**
     * Creates a PENDING_PAYMENT booking that holds the slot for the payment window. The slot row is
     * locked ({@code SELECT ... FOR UPDATE}) before the overlap check, so two concurrent requests for
     * the same slot are serialised and the loser gets a 409 instead of a double booking.
     */
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ParkingLocation location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking location not found"));
        if (!location.isActive()) {
            throw new BadRequestException("Parking location is currently closed or inactive");
        }

        // Row lock: from here on nobody else can book this slot until we commit
        ParkingSlot slot = slotRepository.findByIdForUpdate(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found"));
        if (!slot.getParkingLocation().getId().equals(location.getId())) {
            throw new BadRequestException("Slot does not belong to specified location");
        }
        if (slot.getStatus() == SlotStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("This slot is currently out of service");
        }
        if (!isCompatible(request.getVehicleType(), slot.getSlotType())) {
            throw new BadRequestException(request.getVehicleType() + " vehicles cannot use a " + slot.getSlotType() + " slot");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = request.getEndTime();
        validateWindow(startTime, endTime, now);

        LocalDateTime holdCutoff = now.minusMinutes(paymentWindowMinutes);
        if (bookingRepository.countByUserIdAndStatusAndCreatedAtAfter(userId, BookingStatus.PENDING_PAYMENT, holdCutoff)
                >= MAX_OPEN_HOLDS_PER_USER) {
            throw new BadRequestException("You already have " + MAX_OPEN_HOLDS_PER_USER
                    + " unpaid bookings. Pay for or cancel one before booking again.");
        }

        if (!bookingRepository.findOverlapping(slot.getId(), startTime, endTime, holdCutoff).isEmpty()) {
            throw new SlotAlreadyBookedException("Slot " + slot.getSlotNumber()
                    + " is already reserved for the selected time window. Please select another slot or time.");
        }

        long minutes = Duration.between(startTime, endTime).toMinutes();
        double totalHours = Math.max(1.0, Math.ceil((minutes / 60.0) * 2.0) / 2.0); // half-hour steps, 1h minimum
        BigDecimal hourlyRate = slot.getEffectiveHourlyRate();
        BigDecimal totalAmount = hourlyRate.multiply(BigDecimal.valueOf(totalHours)).setScale(2, RoundingMode.HALF_UP);

        String ref = generateBookingReference(now);

        Booking booking = new Booking();
        booking.setBookingReference(ref);
        booking.setUser(user);
        booking.setParkingLocation(location);
        booking.setParkingSlot(slot);
        booking.setVehicleNumber(request.getVehicleNumber().trim().toUpperCase().replaceAll("\\s+", ""));
        booking.setVehicleType(request.getVehicleType());
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setTotalHours(totalHours);
        booking.setHourlyRate(hourlyRate);
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
        booking.setQrToken(qrCodeService.generateQrToken());

        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(user,
                "Slot held: " + ref,
                "Slot " + slot.getSlotNumber() + " at " + location.getName() + " is held for you. Complete payment within "
                        + paymentWindowMinutes + " minutes to confirm.",
                NotificationType.BOOKING);
        auditService.log("BOOKING_CREATED", user.getEmail(), "Booking", saved.getId(),
                "Reference: " + ref + ", Amount: ₹" + totalAmount, null);

        return mapToResponse(saved, true);
    }

    private void validateWindow(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
        if (start == null || end == null) {
            throw new BadRequestException("Start time and end time are required");
        }
        if (start.isBefore(now.minusMinutes(5))) {
            throw new BadRequestException("Start time cannot be in the past");
        }
        if (start.isAfter(now.plusDays(MAX_DAYS_AHEAD))) {
            throw new BadRequestException("Bookings can be made at most " + MAX_DAYS_AHEAD + " days ahead");
        }
        if (!end.isAfter(start)) {
            throw new BadRequestException("End time must be after start time");
        }
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes < MIN_MINUTES) {
            throw new BadRequestException("Minimum parking reservation duration is " + MIN_MINUTES + " minutes");
        }
        if (minutes > MAX_MINUTES) {
            throw new BadRequestException("Maximum parking reservation duration is 24 hours");
        }
    }

    /** Which slot kinds a vehicle may use: bikes only bike bays; cars/EVs may share regular and EV bays. */
    public static boolean isCompatible(SlotType vehicle, SlotType slot) {
        return switch (vehicle) {
            case BIKE -> slot == SlotType.BIKE;
            case CAR -> slot == SlotType.CAR || slot == SlotType.ACCESSIBLE;
            case EV -> slot == SlotType.EV || slot == SlotType.CAR;
            case ACCESSIBLE -> slot == SlotType.ACCESSIBLE || slot == SlotType.CAR;
        };
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(Long userId) {
        return bookingRepository.findByUser(userId, PageRequest.of(0, LIST_LIMIT, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(b -> mapToResponse(b, false))
                .getContent();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingDetails(Long bookingId, Long viewerId, Role viewerRole) {
        Booking booking = bookingRepository.findDetailedById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
        requireCanView(booking, viewerId, viewerRole);
        return mapToResponse(booking, true);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingByReference(String reference, Long viewerId, Role viewerRole) {
        Booking booking = bookingRepository.findByBookingReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + reference));
        requireCanView(booking, viewerId, viewerRole);
        return mapToResponse(booking, true);
    }

    /** Owner, an admin, or the manager of the booking's own facility. */
    private void requireCanView(Booking booking, Long viewerId, Role viewerRole) {
        boolean owner = booking.getUser().getId().equals(viewerId);
        boolean admin = viewerRole == Role.ROLE_ADMIN;
        boolean facilityManager = viewerRole == Role.ROLE_PARKING_MANAGER
                && booking.getParkingLocation().getManager() != null
                && booking.getParkingLocation().getManager().getId().equals(viewerId);
        if (!owner && !admin && !facilityManager) {
            throw new AccessDeniedException("You do not have permission to view this booking");
        }
    }

    /**
     * Cancels a booking that has not been used yet. Refund policy: customers get a full refund when they
     * cancel at least {@value #REFUND_WINDOW_MINUTES} minutes before the start; admins can always refund.
     */
    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long actorId, String actorEmail, boolean isAdmin, String reason) {
        Booking booking = bookingRepository.findDetailedById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!isAdmin && !booking.getUser().getId().equals(actorId)) {
            throw new AccessDeniedException("You do not have permission to cancel this booking");
        }
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("A " + booking.getStatus() + " booking cannot be cancelled");
        }
        if (booking.getParkingSession() != null && booking.getParkingSession().getEntryTime() != null) {
            throw new BadRequestException("The vehicle has already entered. Please exit through the gate instead.");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(reason != null && !reason.isBlank() ? reason.trim() : "Cancelled by user");

        String refundNote = "";
        if (booking.getPayment() != null && booking.getPayment().getPaymentStatus() == PaymentStatus.COMPLETED) {
            boolean refundable = isAdmin || !now.isAfter(booking.getStartTime().minusMinutes(REFUND_WINDOW_MINUTES));
            if (refundable) {
                booking.getPayment().setPaymentStatus(PaymentStatus.REFUNDED);
                refundNote = " A full refund has been issued.";
            } else {
                refundNote = " No refund applies because it was cancelled less than " + REFUND_WINDOW_MINUTES
                        + " minutes before the start time.";
            }
        }

        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(booking.getUser(),
                "Booking Cancelled: " + booking.getBookingReference(),
                "Your reservation at " + booking.getParkingLocation().getName() + " has been cancelled." + refundNote,
                NotificationType.BOOKING);
        auditService.log("BOOKING_CANCELLED", actorEmail, "Booking", saved.getId(),
                "Owner: " + booking.getUser().getEmail() + ". Reason: " + booking.getCancellationReason() + refundNote, null);

        return mapToResponse(saved, false);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookingsForAdmin() {
        return bookingRepository.findAllDetailed(PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(b -> mapToResponse(b, false))
                .getContent();
    }

    /** Reservations of a facility whose window touches today, ordered by start time. */
    @Transactional(readOnly = true)
    public List<BookingResponse> getTodayBookingsForLocation(Long locationId) {
        LocalDateTime startOfDay = LocalDateTime.now(clock).toLocalDate().atStartOfDay();
        return bookingRepository.findForLocationInWindow(locationId, startOfDay, startOfDay.plusDays(1)).stream()
                .map(b -> mapToResponse(b, false))
                .toList();
    }

    /** Releases slot holds whose payment window has lapsed. Returns how many were expired. */
    @Transactional
    public int expireUnpaidBookings() {
        LocalDateTime cutoff = LocalDateTime.now(clock).minusMinutes(paymentWindowMinutes);
        List<Booking> overdue = bookingRepository.findExpiredPending(cutoff);
        for (Booking b : overdue) {
            b.setStatus(BookingStatus.EXPIRED);
            b.setCancellationReason("Payment not completed in time");
            notificationService.sendNotification(b.getUser(), "Booking expired: " + b.getBookingReference(),
                    "Payment was not completed within " + paymentWindowMinutes + " minutes, so the slot was released.",
                    NotificationType.BOOKING);
        }
        bookingRepository.saveAll(overdue);
        return overdue.size();
    }

    /** Marks confirmed bookings whose whole window passed without the vehicle ever entering. */
    @Transactional
    public int markNoShows(int graceMinutes) {
        List<Booking> missed = bookingRepository.findNoShows(LocalDateTime.now(clock).minusMinutes(graceMinutes));
        for (Booking b : missed) {
            b.setStatus(BookingStatus.EXPIRED);
            b.setCancellationReason("No-show");
        }
        bookingRepository.saveAll(missed);
        return missed.size();
    }

    private String generateBookingReference(LocalDateTime now) {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "SP-" + now.getYear() + "-" + suffix;
    }

    private static final Set<BookingStatus> TICKET_STATUSES = EnumSet.of(BookingStatus.CONFIRMED, BookingStatus.COMPLETED);

    /**
     * Maps a booking to its API form. The QR token and image are only included when asked for
     * (single-booking views) and only once the booking is paid; list views stay light and token-free.
     */
    public BookingResponse mapToResponse(Booking b, boolean includeQr) {
        BookingResponse res = new BookingResponse();
        res.setId(b.getId());
        res.setBookingReference(b.getBookingReference());

        if (b.getUser() != null) {
            res.setUserId(b.getUser().getId());
            res.setUserName(b.getUser().getName());
            res.setUserEmail(b.getUser().getEmail());
            res.setUserPhone(b.getUser().getPhone());
        }

        if (b.getParkingLocation() != null) {
            ParkingLocation loc = b.getParkingLocation();
            res.setLocationId(loc.getId());
            res.setLocationName(loc.getName());
            res.setLocationAddress(loc.getAddress());
            res.setLocationCity(loc.getCity());
            res.setLocationCategory(loc.getCategory() != null ? loc.getCategory().name() : null);
            res.setLocationImageUrl(loc.getImageUrl());
            res.setLatitude(loc.getLatitude());
            res.setLongitude(loc.getLongitude());
        }

        if (b.getParkingSlot() != null) {
            res.setSlotId(b.getParkingSlot().getId());
            res.setSlotNumber(b.getParkingSlot().getSlotNumber());
            res.setSlotType(b.getParkingSlot().getSlotType());
            res.setFloorLevel(b.getParkingSlot().getFloorLevel());
        }

        res.setVehicleNumber(b.getVehicleNumber());
        res.setVehicleType(b.getVehicleType());
        res.setStartTime(b.getStartTime());
        res.setEndTime(b.getEndTime());
        res.setTotalHours(b.getTotalHours());
        res.setHourlyRate(b.getHourlyRate());
        res.setTotalAmount(b.getTotalAmount());
        res.setStatus(b.getStatus());

        if (includeQr && b.getQrToken() != null && TICKET_STATUSES.contains(b.getStatus())) {
            res.setQrToken(b.getQrToken());
            res.setQrCodeBase64(qrCodeService.generateQrCodeBase64(b.getQrToken(), 300, 300));
        }

        if (b.getPayment() != null) {
            res.setPaymentStatus(b.getPayment().getPaymentStatus());
            res.setPaymentMethod(b.getPayment().getPaymentMethod());
            res.setTransactionId(b.getPayment().getTransactionId());
        }
        if (b.getStatus() == BookingStatus.PENDING_PAYMENT && b.getCreatedAt() != null) {
            res.setHoldExpiresAt(b.getCreatedAt().plusMinutes(paymentWindowMinutes));
        }

        if (b.getParkingSession() != null) {
            res.setSessionStatus(b.getParkingSession().getSessionStatus());
            res.setEntryTime(b.getParkingSession().getEntryTime());
            res.setExitTime(b.getParkingSession().getExitTime());
            res.setEntryGate(b.getParkingSession().getEntryGate());
            res.setExitGate(b.getParkingSession().getExitGate());
        }

        res.setCancellationReason(b.getCancellationReason());
        res.setCreatedAt(b.getCreatedAt());
        return res;
    }

    /** Convenience for list-style callers that never need the QR. */
    public BookingResponse mapToResponse(Booking b) {
        return mapToResponse(b, false);
    }
}
