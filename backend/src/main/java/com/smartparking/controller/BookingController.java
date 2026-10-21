package com.smartparking.controller;

import com.smartparking.dto.booking.BookingResponse;
import com.smartparking.dto.booking.CancelBookingRequest;
import com.smartparking.dto.booking.CreateBookingRequest;
import com.smartparking.dto.common.ApiResponse;
import com.smartparking.enums.Role;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@Tag(name = "Bookings & Reservations", description = "Endpoints for creating, managing, and cancelling parking bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @Operation(summary = "Create a new parking reservation")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateBookingRequest request) {
        BookingResponse response = bookingService.createBooking(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Booking created successfully", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get bookings for the authenticated user")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<BookingResponse> list = bookingService.getUserBookings(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get booking details by ID")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        BookingResponse response = bookingService.getBookingDetails(id, userDetails.getId(), userDetails.getRole());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/ref/{reference}")
    @Operation(summary = "Get booking details by unique reference code")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingByReference(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String reference) {
        BookingResponse response = bookingService.getBookingByReference(reference, userDetails.getId(), userDetails.getRole());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an active booking")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody(required = false) CancelBookingRequest request) {
        boolean isAdmin = userDetails.getRole() == Role.ROLE_ADMIN;
        String reason = request != null ? request.getReason() : "Cancelled by user";
        BookingResponse response = bookingService.cancelBooking(id, userDetails.getId(), userDetails.getEmail(), isAdmin, reason);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled successfully", response));
    }
}
