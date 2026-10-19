package com.smartparking.dto.session;

import jakarta.validation.constraints.NotBlank;

public class QrVerificationRequest {

    @NotBlank(message = "QR Token is required")
    private String qrToken;

    private String gateName = "Gate 1 (Main Entrance)";

    public QrVerificationRequest() {}

    public QrVerificationRequest(String qrToken, String gateName) {
        this.qrToken = qrToken;
        this.gateName = gateName;
    }

    public String getQrToken() { return qrToken; }
    public void setQrToken(String qrToken) { this.qrToken = qrToken; }

    public String getGateName() { return gateName; }
    public void setGateName(String gateName) { this.gateName = gateName; }
}
