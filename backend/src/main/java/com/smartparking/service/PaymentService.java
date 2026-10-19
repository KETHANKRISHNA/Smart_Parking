package com.smartparking.service;

import com.smartparking.dto.payment.CreatePaymentOrderRequest;
import com.smartparking.dto.payment.PaymentConfirmRequest;
import com.smartparking.dto.payment.PaymentResponse;
import com.smartparking.entity.Booking;
import com.smartparking.entity.Payment;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.NotificationType;
import com.smartparking.enums.PaymentMethod;
import com.smartparking.enums.PaymentStatus;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          NotificationService notificationService,
                          AuditService auditService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Transactional
    public PaymentResponse createPaymentOrder(CreatePaymentOrderRequest request, Long userId) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + request.getBookingId()));

        if (!booking.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to booking payment");
        }

        // Check if an existing payment order is already attached
        Payment payment = booking.getPayment();
        if (payment == null) {
            payment = new Payment();
            payment.setBooking(booking);
            payment.setAmount(booking.getTotalAmount());
            payment.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : PaymentMethod.UPI);
            payment.setPaymentStatus(PaymentStatus.PENDING);
            payment.setTransactionId("TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
            payment.setPaymentGatewayReference("DEMO-GW-" + System.currentTimeMillis());
            booking.setPayment(payment);
        } else {
            payment.setPaymentMethod(request.getPaymentMethod());
        }

        Payment saved = paymentRepository.save(payment);
        return mapToResponse(saved);
    }

    @Transactional
    public PaymentResponse confirmSimulatedPayment(PaymentConfirmRequest request, Long userId) {
        Payment payment = paymentRepository.findByTransactionId(request.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found: " + request.getTransactionId()));

        Booking booking = payment.getBooking();
        if (!booking.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to booking payment confirmation");
        }

        if (payment.getPaymentStatus() == PaymentStatus.COMPLETED) {
            return mapToResponse(payment);
        }

        if (request.isSimulateSuccess()) {
            payment.setPaymentStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());
            payment.setPaymentGatewayReference("SIMULATED-SUCCESS-" + UUID.randomUUID().toString().substring(0, 8));

            booking.setStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            notificationService.sendNotification(
                    booking.getUser(),
                    "Payment Successful",
                    "Payment of ₹" + payment.getAmount() + " completed successfully for booking " + booking.getBookingReference(),
                    NotificationType.PAYMENT
            );

            auditService.log("PAYMENT_SUCCESS", booking.getUser().getEmail(), "Payment", payment.getId(),
                    "Amount: ₹" + payment.getAmount() + ", Txn: " + payment.getTransactionId(), null);
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Simulated card decline / insufficient balance");

            notificationService.sendNotification(
                    booking.getUser(),
                    "Payment Failed",
                    "Payment of ₹" + payment.getAmount() + " could not be processed for booking " + booking.getBookingReference(),
                    NotificationType.PAYMENT
            );
        }

        Payment saved = paymentRepository.save(payment);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getUserPayments(Long userId) {
        return paymentRepository.findByBookingUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .toList();
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
