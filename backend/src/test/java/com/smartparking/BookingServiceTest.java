package com.smartparking;

import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.dto.booking.CreateBookingRequest;
import com.smartparking.entity.Booking;
import com.smartparking.entity.ParkingLocation;
import com.smartparking.entity.ParkingSession;
import com.smartparking.entity.ParkingSlot;
import com.smartparking.entity.Payment;
import com.smartparking.entity.User;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.LocationCategory;
import com.smartparking.enums.PaymentStatus;
import com.smartparking.enums.Role;
import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.SlotAlreadyBookedException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.ParkingLocationRepository;
import com.smartparking.repository.ParkingSlotRepository;
import com.smartparking.repository.UserRepository;
import com.smartparking.service.AuditService;
import com.smartparking.service.BookingService;
import com.smartparking.service.NotificationService;
import com.smartparking.service.QrCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 6, 1, 10, 0);
    private static final Clock CLOCK = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);

    @Mock private BookingRepository bookingRepository;
    @Mock private ParkingLocationRepository locationRepository;
    @Mock private ParkingSlotRepository slotRepository;
    @Mock private UserRepository userRepository;
    @Mock private QrCodeService qrCodeService;
    @Mock private NotificationService notificationService;
    @Mock private AuditService auditService;

    private BookingService bookingService;
    private User testUser;
    private ParkingLocation testLocation;
    private ParkingSlot testSlot;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(bookingRepository, locationRepository, slotRepository, userRepository,
                qrCodeService, notificationService, auditService, CLOCK, 15);

        testUser = new User(1L, "Test User", "test@example.com", "hash", "1234567890", Role.ROLE_USER);

        testLocation = new ParkingLocation();
        testLocation.setId(10L);
        testLocation.setName("Apollo Hospital Parking");
        testLocation.setCategory(LocationCategory.HOSPITAL);
        testLocation.setHourlyRate(new BigDecimal("40.00"));
        testLocation.setActive(true);

        testSlot = new ParkingSlot();
        testSlot.setId(100L);
        testSlot.setSlotNumber("A01");
        testSlot.setParkingLocation(testLocation);
        testSlot.setSlotType(SlotType.CAR);
        testSlot.setStatus(SlotStatus.AVAILABLE);
    }

    private CreateBookingRequest request(SlotType vehicleType, LocalDateTime start, LocalDateTime end) {
        CreateBookingRequest req = new CreateBookingRequest();
        req.setLocationId(10L);
        req.setSlotId(100L);
        req.setVehicleNumber("KA-01-AB-1234");
        req.setVehicleType(vehicleType);
        req.setStartTime(start);
        req.setEndTime(end);
        return req;
    }

    private void stubHappyPathLookups() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(locationRepository.findById(10L)).thenReturn(Optional.of(testLocation));
        when(slotRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(testSlot));
    }

    @Test
    void createBooking_holdsSlotAsPendingPaymentWithServerSidePrice() {
        LocalDateTime start = NOW.plusHours(1);
        LocalDateTime end = start.plusHours(2);
        stubHappyPathLookups();
        when(bookingRepository.countByUserIdAndStatusAndCreatedAtAfter(anyLong(), any(), any())).thenReturn(0L);
        when(bookingRepository.findOverlapping(eq(100L), eq(start), eq(end), any())).thenReturn(Collections.emptyList());
        when(qrCodeService.generateQrToken()).thenReturn("SP-TOKEN-123");
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b.setId(500L);
            return b;
        });

        BookingResponse response = bookingService.createBooking(request(SlotType.CAR, start, end), 1L);

        assertEquals("KA-01-AB-1234", response.getVehicleNumber());
        assertEquals(2.0, response.getTotalHours());
        assertEquals(new BigDecimal("80.00"), response.getTotalAmount());
        assertEquals(BookingStatus.PENDING_PAYMENT, response.getStatus(), "a booking is only confirmed by payment");
        assertNull(response.getQrToken(), "no ticket is issued before payment");
        verify(notificationService).sendNotification(any(), any(), any(), any());
    }

    @Test
    void createBooking_overlappingBooking_throwsConflict() {
        LocalDateTime start = NOW.plusHours(1);
        LocalDateTime end = start.plusHours(2);
        stubHappyPathLookups();
        when(bookingRepository.countByUserIdAndStatusAndCreatedAtAfter(anyLong(), any(), any())).thenReturn(0L);
        when(bookingRepository.findOverlapping(eq(100L), eq(start), eq(end), any())).thenReturn(List.of(new Booking()));

        assertThrows(SlotAlreadyBookedException.class,
                () -> bookingService.createBooking(request(SlotType.CAR, start, end), 1L));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_endBeforeStart_throwsBadRequest() {
        LocalDateTime start = NOW.plusHours(2);
        stubHappyPathLookups();

        assertThrows(BadRequestException.class,
                () -> bookingService.createBooking(request(SlotType.CAR, start, start.minusHours(1)), 1L));
    }

    @Test
    void createBooking_rejectsPastStartTooLongAndTooFarAhead() {
        stubHappyPathLookups();

        assertThrows(BadRequestException.class,
                () -> bookingService.createBooking(request(SlotType.CAR, NOW.minusHours(2), NOW.plusHours(1)), 1L));
        assertThrows(BadRequestException.class,
                () -> bookingService.createBooking(request(SlotType.CAR, NOW.plusHours(1), NOW.plusHours(30)), 1L));
        assertThrows(BadRequestException.class,
                () -> bookingService.createBooking(request(SlotType.CAR, NOW.plusDays(40), NOW.plusDays(40).plusHours(2)), 1L));
    }

    @Test
    void createBooking_bikeCannotUseCarSlot() {
        stubHappyPathLookups();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> bookingService.createBooking(request(SlotType.BIKE, NOW.plusHours(1), NOW.plusHours(3)), 1L));
        assertTrue(ex.getMessage().contains("cannot use"));
    }

    @Test
    void createBooking_userWithTooManyUnpaidHolds_isRejected() {
        stubHappyPathLookups();
        when(bookingRepository.countByUserIdAndStatusAndCreatedAtAfter(anyLong(), any(), any())).thenReturn(3L);

        assertThrows(BadRequestException.class,
                () -> bookingService.createBooking(request(SlotType.CAR, NOW.plusHours(1), NOW.plusHours(3)), 1L));
    }

    private Booking paidBooking(LocalDateTime start) {
        Booking booking = new Booking();
        booking.setId(7L);
        booking.setUser(testUser);
        booking.setParkingLocation(testLocation);
        booking.setParkingSlot(testSlot);
        booking.setBookingReference("SP-2026-ABC123");
        booking.setStartTime(start);
        booking.setEndTime(start.plusHours(2));
        booking.setStatus(BookingStatus.CONFIRMED);
        Payment payment = new Payment();
        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        booking.setPayment(payment);
        return booking;
    }

    @Test
    void cancelBooking_wellBeforeStart_refundsPayment() {
        Booking booking = paidBooking(NOW.plusHours(5));
        when(bookingRepository.findDetailedById(7L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        BookingResponse res = bookingService.cancelBooking(7L, 1L, "test@example.com", false, "plans changed");

        assertEquals(BookingStatus.CANCELLED, res.getStatus());
        assertEquals(PaymentStatus.REFUNDED, booking.getPayment().getPaymentStatus());
    }

    @Test
    void cancelBooking_lessThanAnHourBeforeStart_isNotRefunded() {
        Booking booking = paidBooking(NOW.plusMinutes(20));
        when(bookingRepository.findDetailedById(7L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        bookingService.cancelBooking(7L, 1L, "test@example.com", false, null);

        assertEquals(PaymentStatus.COMPLETED, booking.getPayment().getPaymentStatus());
    }

    @Test
    void cancelBooking_byAnotherUser_isForbidden() {
        when(bookingRepository.findDetailedById(7L)).thenReturn(Optional.of(paidBooking(NOW.plusHours(5))));

        assertThrows(AccessDeniedException.class,
                () -> bookingService.cancelBooking(7L, 99L, "evil@example.com", false, null));
    }

    @Test
    void cancelBooking_afterVehicleEntered_isRejected() {
        Booking booking = paidBooking(NOW.minusMinutes(30));
        ParkingSession session = new ParkingSession();
        session.setEntryTime(NOW.minusMinutes(20));
        booking.setParkingSession(session);
        when(bookingRepository.findDetailedById(7L)).thenReturn(Optional.of(booking));

        assertThrows(BadRequestException.class,
                () -> bookingService.cancelBooking(7L, 1L, "test@example.com", false, null));
    }

    @Test
    void cancelBooking_alreadyCompleted_isRejected() {
        Booking booking = paidBooking(NOW.minusDays(1));
        booking.setStatus(BookingStatus.COMPLETED);
        when(bookingRepository.findDetailedById(7L)).thenReturn(Optional.of(booking));

        assertThrows(BadRequestException.class,
                () -> bookingService.cancelBooking(7L, 1L, "test@example.com", false, null));
    }

    @Test
    void expireUnpaidBookings_releasesOverdueHolds() {
        Booking overdue = paidBooking(NOW.plusHours(2));
        overdue.setStatus(BookingStatus.PENDING_PAYMENT);
        when(bookingRepository.findExpiredPending(NOW.minusMinutes(15))).thenReturn(List.of(overdue));

        int expired = bookingService.expireUnpaidBookings();

        assertEquals(1, expired);
        assertEquals(BookingStatus.EXPIRED, overdue.getStatus());
        verify(bookingRepository).saveAll(List.of(overdue));
    }

    @Test
    void vehicleSlotCompatibilityMatrix() {
        assertTrue(BookingService.isCompatible(SlotType.EV, SlotType.EV));
        assertTrue(BookingService.isCompatible(SlotType.EV, SlotType.CAR));
        assertTrue(BookingService.isCompatible(SlotType.CAR, SlotType.ACCESSIBLE));
        assertFalse(BookingService.isCompatible(SlotType.CAR, SlotType.EV));
        assertFalse(BookingService.isCompatible(SlotType.CAR, SlotType.BIKE));
        assertFalse(BookingService.isCompatible(SlotType.BIKE, SlotType.CAR));
        assertTrue(BookingService.isCompatible(SlotType.BIKE, SlotType.BIKE));
    }
}
