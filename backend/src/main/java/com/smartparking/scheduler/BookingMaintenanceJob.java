package com.smartparking.scheduler;

import com.smartparking.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Housekeeping: releases unpaid slot holds and flags bookings that were never used. */
@Component
public class BookingMaintenanceJob {

    private static final Logger log = LoggerFactory.getLogger(BookingMaintenanceJob.class);

    private final BookingService bookingService;
    private final int noShowGraceMinutes;

    public BookingMaintenanceJob(BookingService bookingService,
                                 @Value("${app.booking.no-show-grace-minutes:30}") int noShowGraceMinutes) {
        this.bookingService = bookingService;
        this.noShowGraceMinutes = noShowGraceMinutes;
    }

    @Scheduled(fixedDelayString = "${app.booking.expiry-check-ms:60000}", initialDelay = 30000)
    public void expireUnpaidBookings() {
        int expired = bookingService.expireUnpaidBookings();
        if (expired > 0) {
            log.info("Expired {} unpaid booking hold(s)", expired);
        }
    }

    @Scheduled(fixedDelayString = "${app.booking.no-show-check-ms:300000}", initialDelay = 60000)
    public void markNoShows() {
        int flagged = bookingService.markNoShows(noShowGraceMinutes);
        if (flagged > 0) {
            log.info("Marked {} booking(s) as no-show", flagged);
        }
    }
}
