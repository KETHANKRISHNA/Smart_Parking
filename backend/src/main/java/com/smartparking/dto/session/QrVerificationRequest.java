package com.smartparking.dto.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class QrVerificationRequest {

    @NotBlank(message = "QR Token is required")
    private String qrToken;

    @Size(max = 60, message = "Gate name is too long")
    private String gateName;

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
