package com.smartparking.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PaymentConfirmRequest {

    @NotBlank(message = "Transaction ID is required")
    private String transactionId;

    /** Card number, UPI id or bank code entered by the payer; forwarded to the gateway, never stored. */
    @Size(max = 60, message = "Payment instrument is too long")
    private String instrument;

    public PaymentConfirmRequest() {}

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getInstrument() { return instrument; }
    public void setInstrument(String instrument) { this.instrument = instrument; }
}
