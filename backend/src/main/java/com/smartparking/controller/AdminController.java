package com.smartparking.controller;

import com.smartparking.dto.admin.AdminCreateUserRequest;
import com.smartparking.dto.admin.AdminDashboardStats;
import com.smartparking.dto.admin.UpdateRoleRequest;
import com.smartparking.dto.auth.UserProfileResponse;
import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.dto.common.ApiResponse;
import com.smartparking.dto.parking.CreateLocationRequest;
import com.smartparking.dto.parking.CreateSlotRequest;
import com.smartparking.dto.parking.ParkingLocationDto;
import com.smartparking.dto.parking.ParkingSlotDto;
import com.smartparking.dto.parking.UpdateSlotStatusRequest;
import com.smartparking.entity.AuditLog;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.service.AuthService;
import com.smartparking.service.AdminService;
import com.smartparking.service.BookingService;
import com.smartparking.service.ParkingLocationService;
import com.smartparking.service.ParkingSlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Operations", description = "Endpoints for administrators to manage locations, slots, bookings, users, and view analytics")
public class AdminController {

    private final AdminService adminService;
    private final ParkingLocationService locationService;
    private final ParkingSlotService slotService;
    private final BookingService bookingService;
    private final AuthService authService;

    public AdminController(AdminService adminService,
                           ParkingLocationService locationService,
                           ParkingSlotService slotService,
                           BookingService bookingService,
                           AuthService authService) {
        this.adminService = adminService;
        this.locationService = locationService;
        this.slotService = slotService;
        this.bookingService = bookingService;
        this.authService = authService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard analytics and aggregated metrics")
    public ResponseEntity<ApiResponse<AdminDashboardStats>> getDashboardStats() {
        AdminDashboardStats stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/locations")
    @Operation(summary = "Get all locations including inactive for admin management")
    public ResponseEntity<ApiResponse<List<ParkingLocationDto>>> getAllLocations() {
        List<ParkingLocationDto> list = locationService.getAllLocationsForAdmin();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/locations")
    @Operation(summary = "Create a new parking location")
    public ResponseEntity<ApiResponse<ParkingLocationDto>> createLocation(
            @AuthenticationPrincipal CustomUserDetails admin,
            @Valid @RequestBody CreateLocationRequest request) {
        ParkingLocationDto created = locationService.createLocation(request, admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Parking location created", created));
    }

    @PutMapping("/locations/{id}")
    @Operation(summary = "Update an existing parking location")
    public ResponseEntity<ApiResponse<ParkingLocationDto>> updateLocation(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails admin,
            @Valid @RequestBody CreateLocationRequest request) {
        ParkingLocationDto updated = locationService.updateLocation(id, request, admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Parking location updated", updated));
    }

    @DeleteMapping("/locations/{id}")
    @Operation(summary = "Delete a parking location")
    public ResponseEntity<ApiResponse<Void>> deleteLocation(@PathVariable Long id,
                                                            @AuthenticationPrincipal CustomUserDetails admin) {
        locationService.deleteLocation(id, admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Parking location deleted", null));
    }

    @PatchMapping("/locations/{id}/toggle-status")
    @Operation(summary = "Toggle active/inactive status of a location")
    public ResponseEntity<ApiResponse<ParkingLocationDto>> toggleLocationStatus(@PathVariable Long id,
                                                                                @AuthenticationPrincipal CustomUserDetails admin) {
        ParkingLocationDto updated = locationService.toggleActiveStatus(id, admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Status updated", updated));
    }

    @PostMapping("/locations/{id}/assign-manager/{managerId}")
    @Operation(summary = "Assign a manager to a parking facility")
    public ResponseEntity<ApiResponse<ParkingLocationDto>> assignManager(
            @PathVariable Long id,
            @PathVariable Long managerId,
            @AuthenticationPrincipal CustomUserDetails admin) {
        ParkingLocationDto updated = locationService.assignManager(id, managerId, admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Manager assigned", updated));
    }

    @PostMapping("/slots")
    @Operation(summary = "Create a new parking slot")
    public ResponseEntity<ApiResponse<ParkingSlotDto>> createSlot(@Valid @RequestBody CreateSlotRequest request) {
        ParkingSlotDto slot = slotService.createSlot(request);
        return ResponseEntity.ok(ApiResponse.ok("Slot created", slot));
    }

    @PutMapping("/slots/{id}")
    @Operation(summary = "Update slot properties")
    public ResponseEntity<ApiResponse<ParkingSlotDto>> updateSlot(
            @PathVariable Long id,
            @Valid @RequestBody CreateSlotRequest request) {
        ParkingSlotDto slot = slotService.updateSlot(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Slot updated", slot));
    }

    @PatchMapping("/slots/{id}/status")
    @Operation(summary = "Change slot status")
    public ResponseEntity<ApiResponse<ParkingSlotDto>> updateSlotStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails admin,
            @Valid @RequestBody UpdateSlotStatusRequest body) {
        ParkingSlotDto slot = slotService.updateSlotStatus(id, body.getStatus(), admin);
        return ResponseEntity.ok(ApiResponse.ok("Slot status updated", slot));
    }

    @DeleteMapping("/slots/{id}")
    @Operation(summary = "Delete a parking slot")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(@PathVariable Long id,
                                                         @AuthenticationPrincipal CustomUserDetails admin) {
        slotService.deleteSlot(id, admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Slot deleted", null));
    }

    @GetMapping("/bookings")
    @Operation(summary = "Get all system bookings")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        List<BookingResponse> list = bookingService.getAllBookingsForAdmin();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/users")
    @Operation(summary = "Get all registered users")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        List<UserProfileResponse> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping("/users")
    @Operation(summary = "Create a user (customer, parking manager or admin) with an explicit role")
    public ResponseEntity<ApiResponse<UserProfileResponse>> createUser(
            @AuthenticationPrincipal CustomUserDetails admin,
            @Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("User created", authService.createUserByAdmin(request, admin.getEmail())));
    }

    @PatchMapping("/users/{id}/role")
    @Operation(summary = "Update user role")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUserRole(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails admin,
            @Valid @RequestBody UpdateRoleRequest body) {
        UserProfileResponse updated = adminService.updateUserRole(id, body.getRole(), admin.getId(), admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Role updated", updated));
    }

    @PatchMapping("/users/{id}/toggle-status")
    @Operation(summary = "Toggle user enabled/disabled status")
    public ResponseEntity<ApiResponse<UserProfileResponse>> toggleUserStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails admin) {
        UserProfileResponse updated = adminService.toggleUserStatus(id, admin.getId(), admin.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Status updated", updated));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get system audit logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs() {
        List<AuditLog> logs = adminService.getAuditLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
