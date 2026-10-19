package com.smartparking;

import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.dto.booking.CreateBookingRequest;
import com.smartparking.entity.*;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.LocationCategory;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ParkingLocationRepository locationRepository;
    @Mock
    private ParkingSlotRepository slotRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private QrCodeService qrCodeService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private BookingService bookingService;

    private User testUser;
    private ParkingLocation testLocation;
    private ParkingSlot testSlot;

    @BeforeEach
    void setUp() {
        testUser = new User(1L, "Test User", "test@example.com", "hash", "1234567890", Role.ROLE_USER);

        testLocation = new ParkingLocation();
        testLocation.setId(10L);
        testLocation.setName("Apollo Hospital Parking");
        testLocation.setAddress("Bannerghatta Rd");
        testLocation.setCity("Bangalore");
        testLocation.setLatitude(12.92);
        testLocation.setLongitude(77.59);
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

    @Test
    void testCreateBooking_Success() {
        LocalDateTime start = LocalDateTime.now().plusHours(1);
        LocalDateTime end = start.plusHours(2);

        CreateBookingRequest req = new CreateBookingRequest();
        req.setLocationId(10L);
        req.setSlotId(100L);
        req.setVehicleNumber("KA-01-AB-1234");
        req.setVehicleType(SlotType.CAR);
        req.setStartTime(start);
        req.setEndTime(end);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(locationRepository.findById(10L)).thenReturn(Optional.of(testLocation));
        when(slotRepository.findById(100L)).thenReturn(Optional.of(testSlot));
        when(bookingRepository.findOverlappingBookings(100L, start, end)).thenReturn(Collections.emptyList());
        when(qrCodeService.generateQrToken()).thenReturn("SP-TOKEN-123");
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(500L);
            return b;
        });

        BookingResponse response = bookingService.createBooking(req, 1L);

        assertNotNull(response);
        assertEquals("KA-01-AB-1234", response.getVehicleNumber());
        assertEquals(2.0, response.getTotalHours());
        assertEquals(new BigDecimal("80.00"), response.getTotalAmount());
        assertEquals(BookingStatus.CONFIRMED, response.getStatus());
        verify(notificationService, times(1)).sendNotification(any(), any(), any(), any());
    }

    @Test
    void testCreateBooking_SlotAlreadyBooked_ThrowsConflict() {
        LocalDateTime start = LocalDateTime.now().plusHours(1);
        LocalDateTime end = start.plusHours(2);

        CreateBookingRequest req = new CreateBookingRequest();
        req.setLocationId(10L);
        req.setSlotId(100L);
        req.setVehicleNumber("KA-01-AB-1234");
        req.setStartTime(start);
        req.setEndTime(end);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(locationRepository.findById(10L)).thenReturn(Optional.of(testLocation));
        when(slotRepository.findById(100L)).thenReturn(Optional.of(testSlot));
        when(bookingRepository.findOverlappingBookings(100L, start, end)).thenReturn(List.of(new Booking()));

        assertThrows(SlotAlreadyBookedException.class, () -> bookingService.createBooking(req, 1L));
    }

    @Test
    void testCreateBooking_InvalidTimeInterval_ThrowsBadRequest() {
        LocalDateTime start = LocalDateTime.now().plusHours(2);
        LocalDateTime end = start.minusHours(1); // end before start

        CreateBookingRequest req = new CreateBookingRequest();
        req.setLocationId(10L);
        req.setSlotId(100L);
        req.setVehicleNumber("KA-01-AB-1234");
        req.setStartTime(start);
        req.setEndTime(end);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(locationRepository.findById(10L)).thenReturn(Optional.of(testLocation));
        when(slotRepository.findById(100L)).thenReturn(Optional.of(testSlot));

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(req, 1L));
    }
}
