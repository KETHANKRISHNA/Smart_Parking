package com.smartparking.controller;

import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.dto.common.ApiResponse;
import com.smartparking.dto.parking.ParkingLocationDto;
import com.smartparking.dto.parking.ParkingSlotDto;
import com.smartparking.dto.parking.UpdateSlotStatusRequest;
import com.smartparking.dto.session.QrVerificationRequest;
import com.smartparking.dto.session.SessionResponse;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.service.BookingService;
import com.smartparking.service.FacilityAccessService;
import com.smartparking.service.ParkingLocationService;
import com.smartparking.service.ParkingSessionService;
import com.smartparking.service.ParkingSlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Operator portal. Role access (manager or admin) is enforced in SecurityConfig; every endpoint is further
 * scoped to a facility the caller operates (admins: any). Pass {@code locationId} to pick one; without it the
 * caller's first facility is used.
 */
@RestController
@RequestMapping("/api/v1/manager")
@Tag(name = "Parking Manager Portal", description = "Endpoints for facility operators to manage live bay statuses and gate entry/exit")
public class ParkingManagerController {

    private final FacilityAccessService facilityAccess;
    private final ParkingLocationService locationService;
    private final ParkingSlotService slotService;
    private final BookingService bookingService;
    private final ParkingSessionService sessionService;

    public ParkingManagerController(FacilityAccessService facilityAccess,
                                    ParkingLocationService locationService,
                                    ParkingSlotService slotService,
                                    BookingService bookingService,
                                    ParkingSessionService sessionService) {
        this.facilityAccess = facilityAccess;
        this.locationService = locationService;
        this.slotService = slotService;
        this.bookingService = bookingService;
        this.sessionService = sessionService;
    }

    @GetMapping("/facilities")
    @Operation(summary = "List the facilities this operator can manage")
    public ResponseEntity<ApiResponse<List<ParkingLocationDto>>> getFacilities(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(locationService.getManagedFacilities(user)));
    }

    @GetMapping("/facility")
    @Operation(summary = "Get a managed parking facility with live availability")
    public ResponseEntity<ApiResponse<ParkingLocationDto>> getFacility(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) Long locationId) {
        return ResponseEntity.ok(ApiResponse.ok(locationService.getManagedFacility(user, locationId)));
    }

    @GetMapping("/facility/slots")
    @Operation(summary = "Get the live bay inventory of a managed facility")
    public ResponseEntity<ApiResponse<List<ParkingSlotDto>>> getFacilitySlots(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) Long locationId) {
        Long id = facilityAccess.resolveFacilityId(user, locationId);
        return ResponseEntity.ok(ApiResponse.ok(slotService.getSlotsForLocation(id, null, null)));
    }

    @PatchMapping("/slots/{slotId}/status")
    @Operation(summary = "Mark a bay available or out of service")
    public ResponseEntity<ApiResponse<ParkingSlotDto>> updateSlotStatus(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long slotId,
            @Valid @RequestBody UpdateSlotStatusRequest body) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated",
                slotService.updateSlotStatus(slotId, body.getStatus(), user)));
    }

    @GetMapping("/today-bookings")
    @Operation(summary = "Today's reservations (by reserved time) for a managed facility")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getTodayFacilityBookings(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) Long locationId) {
        Long id = facilityAccess.resolveFacilityId(user, locationId);
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getTodayBookingsForLocation(id)));
    }

    @PostMapping("/verify-ticket")
    @Operation(summary = "Verify a ticket QR code from the scanner")
    public ResponseEntity<ApiResponse<SessionResponse>> verifyTicket(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody QrVerificationRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.verifyQrToken(body.getQrToken(), user)));
    }

    @PostMapping("/gate-entry")
    @Operation(summary = "Process gate check-in")
    public ResponseEntity<ApiResponse<SessionResponse>> processEntry(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody QrVerificationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.processVehicleEntry(request, user)));
    }

    @PostMapping("/gate-exit")
    @Operation(summary = "Process gate check-out")
    public ResponseEntity<ApiResponse<SessionResponse>> processExit(
            @AuthenticationPrincipal CustomUserDetails user,
            @Valid @RequestBody QrVerificationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.processVehicleExit(request, user)));
    }
}
