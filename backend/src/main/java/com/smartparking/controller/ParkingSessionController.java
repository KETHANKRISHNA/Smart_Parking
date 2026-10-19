package com.smartparking.controller;

import com.smartparking.dto.common.ApiResponse;
import com.smartparking.dto.session.QrVerificationRequest;
import com.smartparking.dto.session.SessionResponse;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.service.ParkingSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/parking-sessions")
@Tag(name = "Gate Entry & Exit QR Verification", description = "Endpoints for scanning QR tickets and recording gate entry/exit timestamps")
public class ParkingSessionController {

    private final ParkingSessionService sessionService;

    public ParkingSessionController(ParkingSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/verify/{qrToken}")
    @Operation(summary = "Verify a parking QR token without checking in")
    public ResponseEntity<ApiResponse<SessionResponse>> verifyTicket(@PathVariable String qrToken) {
        SessionResponse response = sessionService.verifyQrToken(qrToken);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/entry")
    @Operation(summary = "Record vehicle entry using QR token")
    public ResponseEntity<ApiResponse<SessionResponse>> processEntry(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody QrVerificationRequest request) {
        String managerEmail = userDetails != null ? userDetails.getEmail() : "system";
        SessionResponse response = sessionService.processVehicleEntry(request, managerEmail);
        return ResponseEntity.ok(ApiResponse.ok("Vehicle entered successfully", response));
    }

    @PostMapping("/exit")
    @Operation(summary = "Record vehicle exit using QR token")
    public ResponseEntity<ApiResponse<SessionResponse>> processExit(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody QrVerificationRequest request) {
        String managerEmail = userDetails != null ? userDetails.getEmail() : "system";
        SessionResponse response = sessionService.processVehicleExit(request, managerEmail);
        return ResponseEntity.ok(ApiResponse.ok("Vehicle exited successfully", response));
    }
}
