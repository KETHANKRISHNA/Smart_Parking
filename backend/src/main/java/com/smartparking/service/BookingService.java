package com.smartparking.service;

import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.dto.booking.CreateBookingRequest;
import com.smartparking.entity.*;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.NotificationType;
import com.smartparking.enums.PaymentMethod;
import com.smartparking.enums.PaymentStatus;
import com.smartparking.enums.SlotStatus;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.exception.SlotAlreadyBookedException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.ParkingLocationRepository;
import com.smartparking.repository.ParkingSlotRepository;
import com.smartparking.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ParkingLocationRepository locationRepository;
    private final ParkingSlotRepository slotRepository;
    private final UserRepository userRepository;
    private final QrCodeService qrCodeService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public BookingService(BookingRepository bookingRepository,
                          ParkingLocationRepository locationRepository,
                          ParkingSlotRepository slotRepository,
                          UserRepository userRepository,
                          QrCodeService qrCodeService,
                          NotificationService notificationService,
                          AuditService auditService) {
        this.bookingRepository = bookingRepository;
        this.locationRepository = locationRepository;
        this.slotRepository = slotRepository;
        this.userRepository = userRepository;
        this.qrCodeService = qrCodeService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResponse createBooking(CreateBookingRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ParkingLocation location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking location not found"));

        if (!location.isActive()) {
            throw new BadRequestException("Parking location is currently closed or inactive");
        }

        ParkingSlot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found"));

        if (!slot.getParkingLocation().getId().equals(location.getId())) {
            throw new BadRequestException("Slot does not belong to specified location");
        }

        if (slot.getStatus() == SlotStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("This slot is currently out of service");
        }

        // Validate time intervals
        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = request.getEndTime();

        if (startTime == null || endTime == null) {
            throw new BadRequestException("Start time and end time are required");
        }

        if (startTime.isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new BadRequestException("Start time cannot be in the past");
        }

        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("End time must be after start time");
        }

        long minutes = Duration.between(startTime, endTime).toMinutes();
        if (minutes < 30) {
            throw new BadRequestException("Minimum parking reservation duration is 30 minutes");
        }

        // Check for conflicting/overlapping reservations in the requested window
        List<Booking> overlapping = bookingRepository.findOverlappingBookings(slot.getId(), startTime, endTime);
        if (!overlapping.isEmpty()) {
            throw new SlotAlreadyBookedException("Slot " + slot.getSlotNumber() + " is already reserved for the selected time window. Please select another slot or time.");
        }

        // Server-side calculation of duration and price
        double totalHours = Math.ceil((minutes / 60.0) * 2.0) / 2.0; // round up to nearest half hour
        if (totalHours < 1.0) totalHours = 1.0;

        BigDecimal hourlyRate = slot.getEffectiveHourlyRate();
        BigDecimal totalAmount = hourlyRate.multiply(BigDecimal.valueOf(totalHours)).setScale(2, RoundingMode.HALF_UP);

        // Generate booking reference & opaque QR token
        String ref = generateBookingReference();
        String qrToken = qrCodeService.generateQrToken();

        Booking booking = new Booking();
        booking.setBookingReference(ref);
        booking.setUser(user);
        booking.setParkingLocation(location);
        booking.setParkingSlot(slot);
        booking.setVehicleNumber(request.getVehicleNumber().trim().toUpperCase());
        booking.setVehicleType(request.getVehicleType());
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setTotalHours(totalHours);
        booking.setHourlyRate(hourlyRate);
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.CONFIRMED); // Direct confirmed with instant simulation or pending payment
        booking.setQrToken(qrToken);

        Booking saved = bookingRepository.save(booking);

        // Send confirmation notification
        notificationService.sendNotification(
                user,
                "Booking Confirmed: " + ref,
                "Your slot " + slot.getSlotNumber() + " at " + location.getName() + " is confirmed for " +
                        startTime.format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm")),
                NotificationType.BOOKING
        );

        auditService.log("BOOKING_CREATED", user.getEmail(), "Booking", saved.getId(),
                "Reference: " + ref + ", Amount: ₹" + totalAmount, null);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> getUserBookingsPaged(Long userId, Pageable pageable) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingDetails(Long bookingId, Long currentUserId, boolean isAdminOrManager) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!isAdminOrManager && !booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to view this booking");
        }

        return mapToResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingByReference(String reference, Long currentUserId, boolean isAdminOrManager) {
        Booking booking = bookingRepository.findByBookingReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + reference));

        if (!isAdminOrManager && !booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to view this booking");
        }

        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long currentUserId, boolean isAdmin, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (!isAdmin && !booking.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to cancel this booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Completed bookings cannot be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Cancelled by user");

        // Handle refund status if payment exists
        if (booking.getPayment() != null && booking.getPayment().getPaymentStatus() == PaymentStatus.COMPLETED) {
            booking.getPayment().setPaymentStatus(PaymentStatus.REFUNDED);
        }

        Booking saved = bookingRepository.save(booking);

        notificationService.sendNotification(
                booking.getUser(),
                "Booking Cancelled: " + booking.getBookingReference(),
                "Your reservation at " + booking.getParkingLocation().getName() + " has been cancelled. Refund will be processed.",
                NotificationType.BOOKING
        );

        auditService.log("BOOKING_CANCELLED", booking.getUser().getEmail(), "Booking", saved.getId(),
                "Cancelled. Reason: " + booking.getCancellationReason(), null);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookingsForAdmin() {
        return bookingRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    private String generateBookingReference() {
        int year = LocalDateTime.now().getYear();
        String randomSuffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "SP-" + year + "-" + randomSuffix;
    }

    public BookingResponse mapToResponse(Booking b) {
        BookingResponse res = new BookingResponse();
        res.setId(b.getId());
        res.setBookingReference(b.getBookingReference());

        // User
        if (b.getUser() != null) {
            res.setUserId(b.getUser().getId());
            res.setUserName(b.getUser().getName());
            res.setUserEmail(b.getUser().getEmail());
            res.setUserPhone(b.getUser().getPhone());
        }

        // Location
        if (b.getParkingLocation() != null) {
            res.setLocationId(b.getParkingLocation().getId());
            res.setLocationName(b.getParkingLocation().getName());
            res.setLocationAddress(b.getParkingLocation().getAddress());
            res.setLocationCity(b.getParkingLocation().getCity());
            res.setLocationCategory(b.getParkingLocation().getCategory().name());
            res.setLocationImageUrl(b.getParkingLocation().getImageUrl());
            res.setLatitude(b.getParkingLocation().getLatitude());
            res.setLongitude(b.getParkingLocation().getLongitude());
        }

        // Slot
        if (b.getParkingSlot() != null) {
            res.setSlotId(b.getParkingSlot().getId());
            res.setSlotNumber(b.getParkingSlot().getSlotNumber());
            res.setSlotType(b.getParkingSlot().getSlotType());
            res.setFloorLevel(b.getParkingSlot().getFloorLevel());
        }

        // Specs
        res.setVehicleNumber(b.getVehicleNumber());
        res.setVehicleType(b.getVehicleType());
        res.setStartTime(b.getStartTime());
        res.setEndTime(b.getEndTime());
        res.setTotalHours(b.getTotalHours());
        res.setHourlyRate(b.getHourlyRate());
        res.setTotalAmount(b.getTotalAmount());
        res.setStatus(b.getStatus());

        // QR Code
        res.setQrToken(b.getQrToken());
        if (b.getQrToken() != null) {
            res.setQrCodeBase64(qrCodeService.generateQrCodeBase64(b.getQrToken(), 300, 300));
        }

        // Payment
        if (b.getPayment() != null) {
            res.setPaymentStatus(b.getPayment().getPaymentStatus());
            res.setPaymentMethod(b.getPayment().getPaymentMethod());
            res.setTransactionId(b.getPayment().getTransactionId());
        } else {
            res.setPaymentStatus(PaymentStatus.COMPLETED); // default simulated
            res.setPaymentMethod(PaymentMethod.UPI);
            res.setTransactionId("TXN-" + b.getBookingReference());
        }

        // Session
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
}
