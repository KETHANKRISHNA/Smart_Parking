package com.smartparking.service;

import com.smartparking.dto.admin.AdminDashboardStats;
import com.smartparking.dto.auth.UserProfileResponse;
import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.entity.AuditLog;
import com.smartparking.entity.User;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.Role;
import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AdminService {

    private final ParkingLocationRepository locationRepository;
    private final ParkingSlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final BookingService bookingService;
    private final AuditService auditService;
    private final Clock clock;
    private final long paymentWindowMinutes;

    public AdminService(ParkingLocationRepository locationRepository,
                        ParkingSlotRepository slotRepository,
                        BookingRepository bookingRepository,
                        PaymentRepository paymentRepository,
                        UserRepository userRepository,
                        AuditLogRepository auditLogRepository,
                        BookingService bookingService,
                        AuditService auditService,
                        Clock clock,
                        @Value("${app.booking.payment-window-minutes:15}") long paymentWindowMinutes) {
        this.locationRepository = locationRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
        this.bookingService = bookingService;
        this.auditService = auditService;
        this.clock = clock;
        this.paymentWindowMinutes = paymentWindowMinutes;
    }

    /** All figures come from aggregate queries; nothing is loaded into memory and summed in Java. */
    @Transactional(readOnly = true)
    public AdminDashboardStats getDashboardStats() {
        AdminDashboardStats stats = new AdminDashboardStats();
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime cutoff = now.minusMinutes(paymentWindowMinutes);

        long totalSlots = slotRepository.count();
        long outOfService = slotRepository.countByStatus(SlotStatus.OUT_OF_SERVICE);
        long freeNow = slotRepository.countByStatus(SlotStatus.AVAILABLE)
                - bookingRepository.countAvailableSlotsReservedAt(now, cutoff);
        long availableSlots = Math.max(0, freeNow);
        long operational = Math.max(0, totalSlots - outOfService);
        double occupancy = operational > 0 ? ((double) (operational - availableSlots) / operational) * 100.0 : 0.0;

        BigDecimal revenue = paymentRepository.sumCompletedPayments();

        stats.setTotalLocations(locationRepository.count());
        stats.setTotalSlots(totalSlots);
        stats.setAvailableSlots(availableSlots);
        stats.setActiveReservations(bookingRepository.countByStatus(BookingStatus.CONFIRMED));
        stats.setTodaysBookings(bookingRepository.countCreatedSince(LocalDate.now(clock).atStartOfDay()));
        stats.setTotalRevenue(revenue != null ? revenue : BigDecimal.ZERO);
        stats.setOccupancyPercentage(Math.round(occupancy * 10.0) / 10.0);

        Map<String, Long> vehicleDist = new LinkedHashMap<>();
        for (SlotType type : SlotType.values()) {
            vehicleDist.put(type.name(), 0L);
        }
        for (Object[] row : bookingRepository.countByVehicleType()) {
            vehicleDist.put(((SlotType) row[0]).name(), (Long) row[1]);
        }
        stats.setVehicleDistribution(vehicleDist);

        Map<String, Long> categoryDist = new LinkedHashMap<>();
        for (Object[] row : locationRepository.countByCategory()) {
            categoryDist.put(String.valueOf(row[0]), (Long) row[1]);
        }
        stats.setCategoryDistribution(categoryDist);

        stats.setRevenueTrend(buildSevenDayTrend());
        stats.setTopLocations(buildTopLocations());

        stats.setRecentBookings(bookingRepository.findRecent(PageRequest.of(0, 10)).stream()
                .map(bookingService::mapToResponse)
                .toList());

        return stats;
    }

    private List<Map<String, Object>> buildSevenDayTrend() {
        LocalDate today = LocalDate.now(clock);
        Map<LocalDate, Object[]> byDay = new HashMap<>();
        for (Object[] row : bookingRepository.dailyTrend(today.minusDays(6).atStartOfDay())) {
            LocalDate day = row[0] instanceof Date sql ? sql.toLocalDate() : (LocalDate) row[0];
            byDay.put(day, row);
        }
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");
        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            Object[] row = byDay.get(day);
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", day.format(fmt));
            point.put("revenue", row != null ? row[1] : BigDecimal.ZERO);
            point.put("bookings", row != null ? row[2] : 0L);
            trend.add(point);
        }
        return trend;
    }

    private List<Map<String, Object>> buildTopLocations() {
        List<Map<String, Object>> top = new ArrayList<>();
        for (Object[] row : bookingRepository.bookingStatsByLocation()) {
            if (top.size() == 5) {
                break;
            }
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", row[0]);
            map.put("name", row[1]);
            map.put("bookingsCount", row[2]);
            map.put("revenue", row[3]);
            top.add(map);
        }
        return top;
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toProfile).toList();
    }

    @Transactional
    public UserProfileResponse updateUserRole(Long userId, Role newRole, Long actorId, String actorEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.getId().equals(actorId) && newRole != Role.ROLE_ADMIN) {
            throw new BadRequestException("You cannot remove your own admin role");
        }
        Role previous = user.getRole();
        user.setRole(newRole);
        User saved = userRepository.save(user);
        auditService.log("USER_ROLE_CHANGED", actorEmail, "User", saved.getId(),
                saved.getEmail() + ": " + previous + " -> " + newRole, null);
        return toProfile(saved);
    }

    @Transactional
    public UserProfileResponse toggleUserStatus(Long userId, Long actorId, String actorEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (user.getId().equals(actorId)) {
            throw new BadRequestException("You cannot disable your own account");
        }
        user.setEnabled(!user.isEnabled());
        User saved = userRepository.save(user);
        auditService.log(saved.isEnabled() ? "USER_ENABLED" : "USER_DISABLED", actorEmail, "User", saved.getId(),
                saved.getEmail(), null);
        return toProfile(saved);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findTop200ByOrderByTimestampDesc();
    }

    private UserProfileResponse toProfile(User u) {
        return new UserProfileResponse(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole(), u.isEnabled(), u.getCreatedAt());
    }
}
