package com.smartparking.service;

import com.smartparking.dto.payment.CreatePaymentOrderRequest;
import com.smartparking.dto.payment.PaymentConfirmRequest;
import com.smartparking.dto.payment.PaymentResponse;
import com.smartparking.entity.Booking;
import com.smartparking.entity.Payment;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.NotificationType;
import com.smartparking.enums.PaymentStatus;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.payment.PaymentGateway;
import com.smartparking.payment.PaymentGateway.GatewayResult;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Payment lifecycle: PENDING -> COMPLETED | FAILED (retry allowed while the booking hold is alive).
 * A booking becomes CONFIRMED only here, and only after the gateway approved the charge on the server.
 */
@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final PaymentGateway gateway;
    private final Clock clock;
    private final long paymentWindowMinutes;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          NotificationService notificationService,
                          AuditService auditService,
                          PaymentGateway gateway,
                          Clock clock,
                          @Value("${app.booking.payment-window-minutes:15}") long paymentWindowMinutes) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        this.gateway = gateway;
        this.clock = clock;
        this.paymentWindowMinutes = paymentWindowMinutes;
    }

    @Transactional
    public PaymentResponse createPaymentOrder(CreatePaymentOrderRequest request, Long userId) {
        Booking booking = bookingRepository.findDetailedById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + request.getBookingId()));
        requireOwner(booking, userId);

        Payment payment = booking.getPayment();
        if (payment != null && payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
            return mapToResponse(payment);
        }
        requirePayable(booking);

        if (payment == null) {
            payment = new Payment();
            payment.setBooking(booking);
            payment.setAmount(booking.getTotalAmount());
            booking.setPayment(payment);
        }
        // New order, or a retry after a failed attempt: always a fresh transaction id
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment.setFailureReason(null);
        payment.setTransactionId("TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
        payment.setPaymentGatewayReference(null);

        return mapToResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse confirmPayment(PaymentConfirmRequest request, Long userId) {
        Payment payment = paymentRepository.findByTransactionId(request.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found: " + request.getTransactionId()));
        Booking booking = payment.getBooking();
        requireOwner(booking, userId);

        if (payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
            return mapToResponse(payment); // idempotent
        }
        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException("This payment can no longer be confirmed. Please start a new payment.");
        }
        requirePayable(booking);

        GatewayResult result = gateway.charge(payment, request.getInstrument());
        payment.setPaymentGatewayReference(result.reference());

        if (result.success()) {
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now(clock));
            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            notificationService.sendNotification(booking.getUser(), "Payment Successful",
                    "Payment of ₹" + payment.getAmount() + " received. Booking " + booking.getBookingReference() + " is confirmed.",
                    NotificationType.PAYMENT);
            auditService.log("PAYMENT_SUCCESS", booking.getUser().getEmail(), "Payment", payment.getId(),
                    "Amount: ₹" + payment.getAmount() + ", Txn: " + payment.getTransactionId(), null);
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setFailureReason(result.failureReason());

            notificationService.sendNotification(booking.getUser(), "Payment Failed",
                    "Payment of ₹" + payment.getAmount() + " could not be processed for booking " + booking.getBookingReference()
                            + ". You can retry before the hold expires.",
                    NotificationType.PAYMENT);
            auditService.log("PAYMENT_FAILED", booking.getUser().getEmail(), "Payment", payment.getId(),
                    result.failureReason(), null);
        }

        return mapToResponse(paymentRepository.save(payment));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getUserPayments(Long userId) {
        return paymentRepository.findByBookingUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void requireOwner(Booking booking, Long userId) {
        if (!booking.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You do not have access to this booking's payment");
        }
    }

    /** Only a booking still inside its payment window can be paid (the expiry job releases overdue holds). */
    private void requirePayable(Booking booking) {
        if (booking.getStatus() != BookingStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Booking is " + booking.getStatus() + " and cannot be paid");
        }
        if (booking.getCreatedAt().plusMinutes(paymentWindowMinutes).isBefore(LocalDateTime.now(clock))) {
            throw new BadRequestException("The payment window for this booking has expired. Please book again.");
        }
    }

    public PaymentResponse mapToResponse(Payment p) {
        PaymentResponse res = new PaymentResponse();
        res.setId(p.getId());
        res.setTransactionId(p.getTransactionId());
        if (p.getBooking() != null) {
            res.setBookingId(p.getBooking().getId());
            res.setBookingReference(p.getBooking().getBookingReference());
        }
        res.setAmount(p.getAmount());
        res.setPaymentMethod(p.getPaymentMethod());
        res.setPaymentStatus(p.getPaymentStatus());
        res.setGatewayReference(p.getPaymentGatewayReference());
        res.setPaidAt(p.getPaidAt());
        res.setFailureReason(p.getFailureReason());
        res.setCreatedAt(p.getCreatedAt());
        return res;
    }
}
