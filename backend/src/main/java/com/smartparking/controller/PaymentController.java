package com.smartparking.controller;

import com.smartparking.dto.common.ApiResponse;
import com.smartparking.dto.payment.CreatePaymentOrderRequest;
import com.smartparking.dto.payment.PaymentConfirmRequest;
import com.smartparking.dto.payment.PaymentResponse;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments & Transactions", description = "Endpoints for initiating and confirming demo/live payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order")
    @Operation(summary = "Create a payment order for a booking")
    public ResponseEntity<ApiResponse<PaymentResponse>> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreatePaymentOrderRequest request) {
        PaymentResponse response = paymentService.createPaymentOrder(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Payment order created", response));
    }

    @PostMapping("/confirm")
    @Operation(summary = "Confirm payment (Simulated Gateway Demo Mode)")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PaymentConfirmRequest request) {
        PaymentResponse response = paymentService.confirmSimulatedPayment(request, userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Payment confirmed", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get user payment transaction history")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<PaymentResponse> list = paymentService.getUserPayments(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
}
