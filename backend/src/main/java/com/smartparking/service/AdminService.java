package com.smartparking.service;

import com.smartparking.dto.admin.AdminDashboardStats;
import com.smartparking.dto.auth.UserProfileResponse;
import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.entity.*;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.Role;
import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final ParkingLocationRepository locationRepository;
    private final ParkingSlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final BookingService bookingService;

    public AdminService(ParkingLocationRepository locationRepository,
                        ParkingSlotRepository slotRepository,
                        BookingRepository bookingRepository,
                        UserRepository userRepository,
                        AuditLogRepository auditLogRepository,
                        BookingService bookingService) {
        this.locationRepository = locationRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.bookingService = bookingService;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStats getDashboardStats() {
        AdminDashboardStats stats = new AdminDashboardStats();

        long totalLocations = locationRepository.count();
        long totalSlots = slotRepository.count();
        long activeBookings = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long outOfServiceSlots = slotRepository.findAll().stream()
                .filter(s -> s.getStatus() == SlotStatus.OUT_OF_SERVICE)
                .count();

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        List<Booking> todaysBookings = bookingRepository.findTodaysBookings(startOfToday);
        BigDecimal totalRevenue = bookingRepository.calculateTotalRevenue();

        long availableSlots = Math.max(0, totalSlots - activeBookings - outOfServiceSlots);
        double occupancy = totalSlots > 0 ? ((double) activeBookings / totalSlots) * 100.0 : 0.0;

        stats.setTotalLocations(totalLocations);
        stats.setTotalSlots(totalSlots);
        stats.setAvailableSlots(availableSlots);
        stats.setActiveReservations(activeBookings);
        stats.setTodaysBookings(todaysBookings.size());
        stats.setTotalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        stats.setOccupancyPercentage(Math.round(occupancy * 10.0) / 10.0);

        // Vehicle Distribution
        Map<String, Long> vehicleDist = new LinkedHashMap<>();
        for (SlotType st : SlotType.values()) {
            vehicleDist.put(st.name(), 0L);
        }
        List<Booking> allBookings = bookingRepository.findAll();
        for (Booking b : allBookings) {
            String vType = b.getVehicleType() != null ? b.getVehicleType().name() : SlotType.CAR.name();
            vehicleDist.put(vType, vehicleDist.getOrDefault(vType, 0L) + 1);
        }
        stats.setVehicleDistribution(vehicleDist);

        // Category Distribution
        Map<String, Long> categoryDist = new LinkedHashMap<>();
        List<ParkingLocation> locations = locationRepository.findAll();
        for (ParkingLocation loc : locations) {
            String cat = loc.getCategory() != null ? loc.getCategory().name() : "OTHER";
            categoryDist.put(cat, categoryDist.getOrDefault(cat, 0L) + 1);
        }
        stats.setCategoryDistribution(categoryDist);

        // 7-day Revenue & Booking Trend
        List<Map<String, Object>> trend = new ArrayList<>();
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("MMM dd");
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

            List<Booking> dayBookings = allBookings.stream()
                    .filter(b -> b.getCreatedAt() != null && !b.getCreatedAt().isBefore(dayStart) && b.getCreatedAt().isBefore(dayEnd))
                    .toList();

            BigDecimal dayRev = dayBookings.stream()
                    .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                    .map(Booking::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> point = new HashMap<>();
            point.put("date", date.format(dayFormatter));
            point.put("revenue", dayRev);
            point.put("bookings", dayBookings.size());
            trend.add(point);
        }
        stats.setRevenueTrend(trend);

        // Top Locations
        Map<Long, List<Booking>> bookingsByLoc = allBookings.stream()
                .filter(b -> b.getParkingLocation() != null)
                .collect(Collectors.groupingBy(b -> b.getParkingLocation().getId()));

        List<Map<String, Object>> topLocs = new ArrayList<>();
        for (ParkingLocation loc : locations) {
            List<Booking> locBookings = bookingsByLoc.getOrDefault(loc.getId(), Collections.emptyList());
            BigDecimal locRevenue = locBookings.stream()
                    .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                    .map(Booking::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> map = new HashMap<>();
            map.put("id", loc.getId());
            map.put("name", loc.getName());
            map.put("city", loc.getCity());
            map.put("bookingsCount", locBookings.size());
            map.put("revenue", locRevenue);
            topLocs.add(map);
        }
        topLocs.sort((a, b) -> Integer.compare((Integer) b.get("bookingsCount"), (Integer) a.get("bookingsCount")));
        stats.setTopLocations(topLocs.stream().limit(5).toList());

        // Recent Bookings (top 10)
        List<BookingResponse> recent = bookingRepository.findRecentBookings(PageRequest.of(0, 10)).stream()
                .map(bookingService::mapToResponse)
                .toList();
        stats.setRecentBookings(recent);

        return stats;
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserProfileResponse(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getPhone(),
                        u.getRole(),
                        u.isEnabled(),
                        u.getCreatedAt()))
                .toList();
    }

    @Transactional
    public UserProfileResponse updateUserRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setRole(newRole);
        User saved = userRepository.save(user);
        return new UserProfileResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getPhone(), saved.getRole(), saved.isEnabled(), saved.getCreatedAt());
    }

    @Transactional
    public UserProfileResponse toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setEnabled(!user.isEnabled());
        User saved = userRepository.save(user);
        return new UserProfileResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getPhone(), saved.getRole(), saved.isEnabled(), saved.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }
}
