package com.smartparking.repository;

import com.smartparking.entity.Payment;
import com.smartparking.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByBookingId(Long bookingId);

    List<Payment> findByBookingUserIdOrderByCreatedAtDesc(Long userId);

    long countByPaymentStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.paymentStatus = com.smartparking.enums.PaymentStatus.COMPLETED")
    BigDecimal sumCompletedPayments();
}
