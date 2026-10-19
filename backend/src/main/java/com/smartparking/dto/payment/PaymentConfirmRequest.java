package com.smartparking.dto.payment;

import jakarta.validation.constraints.NotBlank;

public class PaymentConfirmRequest {

    @NotBlank(message = "Transaction ID is required")
    private String transactionId;

    private boolean simulateSuccess = true;

    public PaymentConfirmRequest() {}

    public PaymentConfirmRequest(String transactionId, boolean simulateSuccess) {
        this.transactionId = transactionId;
        this.simulateSuccess = simulateSuccess;
    }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public boolean isSimulateSuccess() { return simulateSuccess; }
    public void setSimulateSuccess(boolean simulateSuccess) { this.simulateSuccess = simulateSuccess; }
}
