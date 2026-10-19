package com.smartparking.controller;

import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.dto.common.ApiResponse;
import com.smartparking.dto.parking.ParkingLocationDto;
import com.smartparking.dto.parking.ParkingSlotDto;
import com.smartparking.dto.session.QrVerificationRequest;
import com.smartparking.dto.session.SessionResponse;
import com.smartparking.entity.ParkingLocation;
import com.smartparking.entity.User;
import com.smartparking.enums.SlotStatus;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.ParkingLocationRepository;
import com.smartparking.repository.UserRepository;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.service.BookingService;
import com.smartparking.service.ParkingLocationService;
import com.smartparking.service.ParkingSessionService;
import com.smartparking.service.ParkingSlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/manager")
@PreAuthorize("hasAnyRole('PARKING_MANAGER', 'ADMIN')")
@Tag(name = "Parking Manager Portal", description = "Endpoints for assigned facility operators to manage live slot statuses and gate entry/exit")
public class ParkingManagerController {

    private final ParkingLocationRepository locationRepository;
    private final ParkingLocationService locationService;
    private final ParkingSlotService slotService;
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final ParkingSessionService sessionService;
    private final UserRepository userRepository;

    public ParkingManagerController(ParkingLocationRepository locationRepository,
                                    ParkingLocationService locationService,
                                    ParkingSlotService slotService,
                                    BookingRepository bookingRepository,
                                    BookingService bookingService,
                                    ParkingSessionService sessionService,
                                    UserRepository userRepository) {
        this.locationRepository = locationRepository;
        this.locationService = locationService;
        this.slotService = slotService;
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.sessionService = sessionService;
        this.userRepository = userRepository;
    }

    private ParkingLocation getAssignedLocation(CustomUserDetails userDetails) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Manager user not found"));

        List<ParkingLocation> managed = locationRepository.findByManager(user);
        if (managed.isEmpty()) {
            // Fallback: if admin or unassigned manager, default to first location so portal is fully functional
            return locationRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No parking facilities found in system"));
        }
        return managed.get(0);
    }

    @GetMapping("/facility")
    @Operation(summary = "Get assigned parking facility details")
    public ResponseEntity<ApiResponse<ParkingLocationDto>> getAssignedFacility(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ParkingLocation loc = getAssignedLocation(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(locationService.mapToDtoWithCurrentAvailability(loc)));
    }

    @GetMapping("/facility/slots")
    @Operation(summary = "Get live slot inventory for assigned facility")
    public ResponseEntity<ApiResponse<List<ParkingSlotDto>>> getFacilitySlots(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ParkingLocation loc = getAssignedLocation(userDetails);
        List<ParkingSlotDto> slots = slotService.getSlotsForLocation(loc.getId(), null, null);
        return ResponseEntity.ok(ApiResponse.ok(slots));
    }

    @PatchMapping("/slots/{slotId}/status")
    @Operation(summary = "Update slot status (e.g. mark out of service or available)")
    public ResponseEntity<ApiResponse<ParkingSlotDto>> updateSlotStatus(
            @PathVariable Long slotId,
            @RequestBody Map<String, String> body) {
        SlotStatus status = SlotStatus.valueOf(body.get("status"));
        ParkingSlotDto slot = slotService.updateSlotStatus(slotId, status);
        return ResponseEntity.ok(ApiResponse.ok("Status updated", slot));
    }

    @GetMapping("/today-bookings")
    @Operation(summary = "Get today's arrivals and reservations for assigned facility")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getTodayFacilityBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ParkingLocation loc = getAssignedLocation(userDetails);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        List<BookingResponse> list = bookingRepository.findByParkingLocationIdOrderByCreatedAtDesc(loc.getId()).stream()
                .filter(b -> b.getCreatedAt() != null && !b.getCreatedAt().isBefore(startOfDay))
                .map(bookingService::mapToResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/verify-ticket")
    @Operation(summary = "Verify ticket QR code from scanner")
    public ResponseEntity<ApiResponse<SessionResponse>> verifyTicket(@RequestBody Map<String, String> body) {
        String token = body.get("qrToken");
        if (token == null || token.trim().isEmpty()) {
            throw new BadRequestException("qrToken is required");
        }
        SessionResponse res = sessionService.verifyQrToken(token.trim());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PostMapping("/gate-entry")
    @Operation(summary = "Process gate check-in entry")
    public ResponseEntity<ApiResponse<SessionResponse>> processEntry(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody QrVerificationRequest request) {
        SessionResponse res = sessionService.processVehicleEntry(request, userDetails.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }

    @PostMapping("/gate-exit")
    @Operation(summary = "Process gate check-out exit")
    public ResponseEntity<ApiResponse<SessionResponse>> processExit(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody QrVerificationRequest request) {
        SessionResponse res = sessionService.processVehicleExit(request, userDetails.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(res));
    }
}
