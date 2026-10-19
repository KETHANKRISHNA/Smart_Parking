package com.smartparking.service;

import com.smartparking.entity.AuditLog;
import com.smartparking.repository.AuditLogRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String action, String performedBy, String entityName, Long entityId, String details, String ipAddress) {
        try {
            AuditLog log = new AuditLog(action, performedBy, entityName, entityId, details, ipAddress);
            auditLogRepository.save(log);
        } catch (Exception ignored) {
            // Audit failures should never block the main transactional flow
        }
    }
}
