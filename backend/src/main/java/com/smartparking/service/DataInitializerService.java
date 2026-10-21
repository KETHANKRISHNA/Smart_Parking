package com.smartparking.service;

import com.smartparking.entity.*;
import com.smartparking.enums.*;
import com.smartparking.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Seeds demo accounts and facilities. Only runs when app.seed.enabled=true (the dev profile). */
@Service
@Order(1)
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataInitializerService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializerService.class);

    private final UserRepository userRepository;
    private final ParkingLocationRepository locationRepository;
    private final ParkingSlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ParkingSessionRepository sessionRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final QrCodeService qrCodeService;

    public DataInitializerService(UserRepository userRepository,
                                  ParkingLocationRepository locationRepository,
                                  ParkingSlotRepository slotRepository,
                                  BookingRepository bookingRepository,
                                  PaymentRepository paymentRepository,
                                  ParkingSessionRepository sessionRepository,
                                  NotificationRepository notificationRepository,
                                  PasswordEncoder passwordEncoder,
                                  QrCodeService qrCodeService) {
        this.userRepository = userRepository;
        this.locationRepository = locationRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.sessionRepository = sessionRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.qrCodeService = qrCodeService;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            logger.info("Database already seeded. Skipping initial data generation.");
            return;
        }

        logger.info("Seeding initial demonstration data for Smart Parking Management System...");

        // 1. Create Users
        User admin = createUser("System Administrator", "admin@smartparking.com", "Admin@123", "+91 9876543210", Role.ROLE_ADMIN);
        User manager1 = createUser("Rajesh Kumar (City Center Manager)", "manager@smartparking.com", "Manager@123", "+91 9876543211", Role.ROLE_PARKING_MANAGER);
        User manager2 = createUser("Priya Sharma (Airport Terminal Manager)", "manager2@smartparking.com", "Manager@123", "+91 9876543212", Role.ROLE_PARKING_MANAGER);
        User user1 = createUser("Alex Morgan", "user@smartparking.com", "User@123", "+91 9876543213", Role.ROLE_USER);
        User user2 = createUser("Kethan Krishna", "kethan@smartparking.com", "Kethan@123", "+91 9876543214", Role.ROLE_USER);

        // 2. Create Locations across the 6 categories from the reference poster
        ParkingLocation loc1 = createLocation(
                "Apollo Multi-Specialty Hospital Parking",
                "154/11 Bannerghatta Road, Opp IIMB",
                "Bangalore",
                12.9249, 77.5996,
                "24/7 dedicated hospital parking with emergency EV bays, wheel-chair accessible ramps, and direct corridor access to main triage.",
                "00:00", "23:59",
                LocationCategory.HOSPITAL,
                new BigDecimal("40.00"),
                "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
                manager1
        );

        ParkingLocation loc2 = createLocation(
                "Phoenix Marketcity Mega Parking",
                "Whitefield Main Rd, Mahadevapura",
                "Bangalore",
                12.9977, 77.6974,
                "Four-level smart basement parking equipped with automated guidance, fast DC EV chargers, and valet assistance.",
                "09:00", "23:30",
                LocationCategory.MALL,
                new BigDecimal("60.00"),
                "https://images.unsplash.com/photo-1567449303078-57ad995bd301?auto=format&fit=crop&w=800&q=80",
                manager1
        );

        ParkingLocation loc3 = createLocation(
                "Central Railway Station Multi-Level Hub",
                "Station Road, Majestic",
                "Bangalore",
                12.9784, 77.5694,
                "Direct platform access parking with long-stay security surveillance, bike lockers, and 24-hour manned entry booths.",
                "00:00", "23:59",
                LocationCategory.RAILWAY_STATION,
                new BigDecimal("30.00"),
                "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
                manager1
        );

        ParkingLocation loc4 = createLocation(
                "Kempegowda International Airport Terminal 1 Parking",
                "KIAL Road, Devanahalli",
                "Bangalore",
                13.1986, 77.7066,
                "Premium airport terminal parking featuring express shuttle service, covered canopies, fast luggage bays, and fastag automated checkout.",
                "00:00", "23:59",
                LocationCategory.AIRPORT,
                new BigDecimal("100.00"),
                "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
                manager2
        );

        ParkingLocation loc5 = createLocation(
                "Manyata Tech Park Silicon Wing",
                "Outer Ring Road, Hebbal",
                "Bangalore",
                13.0489, 77.6200,
                "State-of-the-art corporate campus parking with reserved tech-park employee lanes, corporate visitor passes, and solar EV chargers.",
                "06:00", "22:00",
                LocationCategory.IT_PARK,
                new BigDecimal("35.00"),
                "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
                manager2
        );

        ParkingLocation loc6 = createLocation(
                "Cubbon Park Heritage Gardens Parking",
                "Kasturba Road, Near High Court",
                "Bangalore",
                12.9763, 77.5929,
                "Eco-friendly shaded parking surrounded by lush heritage trees, bike stands, and direct access to morning walking trails.",
                "06:00", "20:00",
                LocationCategory.TOURIST_SPOT,
                new BigDecimal("25.00"),
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
                manager1
        );

        // 3. Populate Slots for Each Location
        List<ParkingLocation> allLocations = List.of(loc1, loc2, loc3, loc4, loc5, loc6);
        for (ParkingLocation loc : allLocations) {
            seedSlotsForLocation(loc);
        }

        // 4. Seed Demonstrative Active & Past Bookings
        seedDemonstrationBookings(loc1, loc2, user1, user2);

        logger.info("Demo data seeding completed successfully! Ready to accept reservations.");
    }

    private User createUser(String name, String email, String password, String phone, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setPhone(phone);
        user.setRole(role);
        user.setEnabled(true);
        return userRepository.save(user);
    }

    private ParkingLocation createLocation(String name, String address, String city,
                                          Double lat, Double lng, String desc,
                                          String open, String close, LocationCategory cat,
                                          BigDecimal rate, String image, User manager) {
        ParkingLocation loc = new ParkingLocation();
        loc.setName(name);
        loc.setAddress(address);
        loc.setCity(city);
        loc.setLatitude(lat);
        loc.setLongitude(lng);
        loc.setDescription(desc);
        loc.setOpeningTime(open);
        loc.setClosingTime(close);
        loc.setCategory(cat);
        loc.setHourlyRate(rate);
        loc.setImageUrl(image);
        loc.setActive(true);
        loc.setManager(manager);
        loc.setTotalSlots(16);
        return locationRepository.save(loc);
    }

    private void seedSlotsForLocation(ParkingLocation loc) {
        // Floor 1: Standard Cars (Slots A01 - A06)
        for (int i = 1; i <= 6; i++) {
            createSlot(loc, "A" + String.format("%02d", i), SlotType.CAR, SlotStatus.AVAILABLE, "Ground Floor", false, null);
        }
        // EV Charger bays (Slots E01 - E03)
        for (int i = 1; i <= 3; i++) {
            createSlot(loc, "E" + String.format("%02d", i), SlotType.EV, SlotStatus.AVAILABLE, "Ground Floor", true, loc.getHourlyRate().add(new BigDecimal("15.00")));
        }
        // Accessible Priority bays (Slots D01 - D02)
        for (int i = 1; i <= 2; i++) {
            createSlot(loc, "D" + String.format("%02d", i), SlotType.ACCESSIBLE, SlotStatus.AVAILABLE, "Ground Floor", false, loc.getHourlyRate());
        }
        // Two-Wheeler / Bike bays (Slots B01 - B05)
        for (int i = 1; i <= 5; i++) {
            createSlot(loc, "B" + String.format("%02d", i), SlotType.BIKE, SlotStatus.AVAILABLE, "Basement 1", false, loc.getHourlyRate().multiply(new BigDecimal("0.5")));
        }
    }

    private void createSlot(ParkingLocation loc, String number, SlotType type, SlotStatus status,
                            String floor, boolean isEv, BigDecimal customRate) {
        ParkingSlot slot = new ParkingSlot();
        slot.setParkingLocation(loc);
        slot.setSlotNumber(number);
        slot.setSlotType(type);
        slot.setStatus(status);
        slot.setFloorLevel(floor);
        slot.setHasEvCharger(isEv);
        slot.setCustomHourlyRate(customRate);
        slotRepository.save(slot);
    }

    private void seedDemonstrationBookings(ParkingLocation loc1, ParkingLocation loc2, User user1, User user2) {
        List<ParkingSlot> slots1 = slotRepository.findByParkingLocationId(loc1.getId());
        List<ParkingSlot> slots2 = slotRepository.findByParkingLocationId(loc2.getId());

        if (slots1.isEmpty() || slots2.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();

        // 1. Active Confirmed Booking for user1 (Upcoming / Live)
        ParkingSlot slot1 = slots1.get(0);
        Booking b1 = new Booking();
        b1.setBookingReference("SP-2026-A101");
        b1.setUser(user1);
        b1.setParkingLocation(loc1);
        b1.setParkingSlot(slot1);
        b1.setVehicleNumber("KA-05-MJ-4040");
        b1.setVehicleType(SlotType.CAR);
        b1.setStartTime(now.minusMinutes(30));
        b1.setEndTime(now.plusHours(2));
        b1.setTotalHours(2.5);
        b1.setHourlyRate(loc1.getHourlyRate());
        b1.setTotalAmount(new BigDecimal("100.00"));
        b1.setStatus(BookingStatus.CONFIRMED);
        b1.setQrToken(qrCodeService.generateQrToken());
        bookingRepository.save(b1);

        // Payment for b1
        Payment p1 = new Payment();
        p1.setBooking(b1);
        p1.setAmount(b1.getTotalAmount());
        p1.setPaymentMethod(PaymentMethod.UPI);
        p1.setPaymentStatus(PaymentStatus.COMPLETED);
        p1.setTransactionId("TXN-DEMO-9821381");
        p1.setPaymentGatewayReference("MOCK-SEED-1");
        p1.setPaidAt(now.minusMinutes(35));
        paymentRepository.save(p1);

        // Active Session for b1
        ParkingSession s1 = new ParkingSession();
        s1.setBooking(b1);
        s1.setEntryTime(now.minusMinutes(20));
        s1.setEntryGate("Gate 1 (North Entrance)");
        s1.setSessionStatus(SessionStatus.ACTIVE);
        sessionRepository.save(s1);
        slot1.setStatus(SlotStatus.OCCUPIED);
        slotRepository.save(slot1);

        // Notification for user1
        Notification n1 = new Notification(user1, "Booking Confirmed: SP-2026-A101",
                "Your slot A01 at Apollo Hospital is confirmed. You entered at Gate 1.", NotificationType.BOOKING);
        notificationRepository.save(n1);

        // 2. EV Booking for user2 at Phoenix Mall
        ParkingSlot evSlot = slots2.stream().filter(ParkingSlot::isHasEvCharger).findFirst().orElse(slots2.get(1));
        Booking b2 = new Booking();
        b2.setBookingReference("SP-2026-E202");
        b2.setUser(user2);
        b2.setParkingLocation(loc2);
        b2.setParkingSlot(evSlot);
        b2.setVehicleNumber("KA-03-EV-2026");
        b2.setVehicleType(SlotType.EV);
        b2.setStartTime(now.plusHours(1));
        b2.setEndTime(now.plusHours(4));
        b2.setTotalHours(3.0);
        b2.setHourlyRate(evSlot.getEffectiveHourlyRate());
        b2.setTotalAmount(new BigDecimal("225.00"));
        b2.setStatus(BookingStatus.CONFIRMED);
        b2.setQrToken(qrCodeService.generateQrToken());
        bookingRepository.save(b2);

        Payment p2 = new Payment();
        p2.setBooking(b2);
        p2.setAmount(b2.getTotalAmount());
        p2.setPaymentMethod(PaymentMethod.CARD);
        p2.setPaymentStatus(PaymentStatus.COMPLETED);
        p2.setTransactionId("TXN-DEMO-7712399");
        p2.setPaymentGatewayReference("MOCK-SEED-2");
        p2.setPaidAt(now.minusHours(1));
        paymentRepository.save(p2);

        // 3. Past Completed Booking for analytics
        ParkingSlot bikeSlot = slots1.stream().filter(s -> s.getSlotType() == SlotType.BIKE).findFirst().orElse(slots1.get(2));
        Booking b3 = new Booking();
        b3.setBookingReference("SP-2026-C303");
        b3.setUser(user1);
        b3.setParkingLocation(loc1);
        b3.setParkingSlot(bikeSlot);
        b3.setVehicleNumber("KA-01-BK-8822");
        b3.setVehicleType(SlotType.BIKE);
        b3.setStartTime(now.minusDays(1).withHour(10).withMinute(0));
        b3.setEndTime(now.minusDays(1).withHour(13).withMinute(0));
        b3.setTotalHours(3.0);
        b3.setHourlyRate(new BigDecimal("20.00"));
        b3.setTotalAmount(new BigDecimal("60.00"));
        b3.setStatus(BookingStatus.COMPLETED);
        b3.setQrToken(qrCodeService.generateQrToken());
        bookingRepository.save(b3);

        Payment p3 = new Payment();
        p3.setBooking(b3);
        p3.setAmount(b3.getTotalAmount());
        p3.setPaymentMethod(PaymentMethod.UPI);
        p3.setPaymentStatus(PaymentStatus.COMPLETED);
        p3.setTransactionId("TXN-DEMO-6612344");
        p3.setPaymentGatewayReference("MOCK-SEED-3");
        p3.setPaidAt(b3.getStartTime().minusMinutes(10));
        paymentRepository.save(p3);

        ParkingSession s3 = new ParkingSession();
        s3.setBooking(b3);
        s3.setEntryTime(b3.getStartTime());
        s3.setExitTime(b3.getEndTime());
        s3.setEntryGate("Gate 1");
        s3.setExitGate("Gate 2");
        s3.setSessionStatus(SessionStatus.COMPLETED);
        sessionRepository.save(s3);
    }
}
