package com.smartparking.payment;

import com.smartparking.entity.Payment;

/**
 * Port to a payment provider. The outcome is always decided on the server by the implementation,
 * never by a flag sent from the browser. Swap {@link MockPaymentGateway} for a Razorpay/Stripe adapter
 * to take real money.
 */
public interface PaymentGateway {

    GatewayResult charge(Payment payment, String instrument);

    record GatewayResult(boolean success, String reference, String failureReason) {
        public static GatewayResult approved(String reference) {
            return new GatewayResult(true, reference, null);
        }

        public static GatewayResult declined(String reference, String reason) {
            return new GatewayResult(false, reference, reason);
        }
    }
}
