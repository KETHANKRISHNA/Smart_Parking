package com.smartparking.service;

import com.smartparking.entity.AuditLog;
import com.smartparking.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Writes in its own transaction so that a failed audit insert can never poison, or be rolled back
     * with, the business transaction that triggered it. A null {@code ipAddress} is filled from the current request.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String performedBy, String entityName, Long entityId, String details, String ipAddress) {
        try {
            String ip = ipAddress != null ? ipAddress : currentClientIp();
            auditLogRepository.save(new AuditLog(action, performedBy, entityName, entityId, truncate(details), ip));
        } catch (Exception e) {
            log.warn("Could not write audit entry {}: {}", action, e.getMessage());
        }
    }

    private static String truncate(String text) {
        return text != null && text.length() > 1000 ? text.substring(0, 1000) : text;
    }

    private static String currentClientIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            String forwarded = attrs.getRequest().getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            return attrs.getRequest().getRemoteAddr();
        }
        return null;
    }
}
