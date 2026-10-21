package com.smartparking.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;
import java.util.TimeZone;

/**
 * Pins the application to one business time zone. Booking times are zone-less {@code LocalDateTime}s
 * entered by users in local time, so the server (often UTC in the cloud) must compare them in that zone.
 */
@Configuration
public class AppConfig {

    private final ZoneId zone;

    public AppConfig(@Value("${app.time-zone:Asia/Kolkata}") String zoneId) {
        this.zone = ZoneId.of(zoneId);
    }

    @PostConstruct
    void applyDefaultTimeZone() {
        TimeZone.setDefault(TimeZone.getTimeZone(zone));
    }

    @Bean
    public Clock clock() {
        return Clock.system(zone);
    }
}
