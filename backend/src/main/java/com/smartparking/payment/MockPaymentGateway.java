package com.smartparking.payment;

import com.smartparking.entity.Payment;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.UUID;

/**
 * Test-mode gateway (like Stripe/Razorpay test cards). Charges succeed unless a well-known
 * "decline" test instrument is supplied: a card number ending in 0002, or a UPI id containing "fail".
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public GatewayResult charge(Payment payment, String instrument) {
        String reference = "MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        String value = instrument == null ? "" : instrument.replaceAll("\s+", "").toLowerCase(Locale.ROOT);

        if (value.endsWith("0002")) {
            return GatewayResult.declined(reference, "Card declined by issuer (test card)");
        }
        if (value.contains("fail")) {
            return GatewayResult.declined(reference, "UPI collect request failed (test handle)");
        }
        return GatewayResult.approved(reference);
    }
}
