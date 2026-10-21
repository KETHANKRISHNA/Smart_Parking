package com.smartparking.service;

import com.smartparking.dto.parking.CreateSlotRequest;
import com.smartparking.dto.parking.ParkingSlotDto;
import com.smartparking.entity.ParkingLocation;
import com.smartparking.entity.ParkingSlot;
import com.smartparking.enums.SlotStatus;
import com.smartparking.enums.SlotType;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.ParkingLocationRepository;
import com.smartparking.repository.ParkingSlotRepository;
import com.smartparking.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ParkingSlotService {

    private final ParkingSlotRepository slotRepository;
    private final ParkingLocationRepository locationRepository;
    private final BookingRepository bookingRepository;
    private final AuditService auditService;
    private final FacilityAccessService facilityAccess;
    private final Clock clock;
    private final long paymentWindowMinutes;

    public ParkingSlotService(ParkingSlotRepository slotRepository,
                              ParkingLocationRepository locationRepository,
                              BookingRepository bookingRepository,
                              AuditService auditService,
                              FacilityAccessService facilityAccess,
                              Clock clock,
                              @Value("${app.booking.payment-window-minutes:15}") long paymentWindowMinutes) {
        this.slotRepository = slotRepository;
        this.locationRepository = locationRepository;
        this.bookingRepository = bookingRepository;
        this.auditService = auditService;
        this.facilityAccess = facilityAccess;
        this.clock = clock;
        this.paymentWindowMinutes = paymentWindowMinutes;
    }

    @Transactional(readOnly = true)
    public List<ParkingSlotDto> getSlotsForLocation(Long locationId, LocalDateTime startTime, LocalDateTime endTime) {
        List<ParkingSlot> slots = slotRepository.findByParkingLocationId(locationId);

        Set<Long> bookedSlotIds = new HashSet<>();
        if (startTime != null && endTime != null) {
            bookedSlotIds.addAll(bookingRepository.findBookedSlotIdsInWindow(locationId, startTime, endTime,
                    LocalDateTime.now(clock).minusMinutes(paymentWindowMinutes)));
        }

        return slots.stream()
                .map(slot -> mapToDto(slot, bookedSlotIds.contains(slot.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ParkingSlot getSlotById(Long slotId) {
        return slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Parking slot not found with id: " + slotId));
    }

    @Transactional
    public ParkingSlotDto createSlot(CreateSlotRequest request) {
        ParkingLocation location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Parking location not found with id: " + request.getLocationId()));

        if (slotRepository.findByParkingLocationIdAndSlotNumberIgnoreCase(location.getId(), request.getSlotNumber().trim()).isPresent()) {
            throw new BadRequestException("Slot number '" + request.getSlotNumber() + "' already exists in this location");
        }

        ParkingSlot slot = new ParkingSlot();
        slot.setSlotNumber(request.getSlotNumber().trim().toUpperCase());
        slot.setParkingLocation(location);
        slot.setSlotType(request.getSlotType() != null ? request.getSlotType() : SlotType.CAR);
        slot.setStatus(request.getStatus() != null ? request.getStatus() : SlotStatus.AVAILABLE);
        slot.setCustomHourlyRate(request.getCustomHourlyRate());
        slot.setFloorLevel(request.getFloorLevel() != null ? request.getFloorLevel() : "Ground");
        slot.setHasEvCharger(request.isHasEvCharger());

        ParkingSlot saved = slotRepository.save(slot);

        // Update location's totalSlots count
        location.setTotalSlots((int) slotRepository.countByParkingLocationId(location.getId()));
        locationRepository.save(location);

        return mapToDto(saved, false);
    }

    /**
     * Staff may only flip a bay between AVAILABLE and OUT_OF_SERVICE. OCCUPIED/RESERVED are driven by
     * gate scans and bookings, and a bay with a vehicle inside cannot be taken out of service by hand.
     */
    @Transactional
    public ParkingSlotDto updateSlotStatus(Long slotId, SlotStatus status, CustomUserDetails actor) {
        if (status != SlotStatus.AVAILABLE && status != SlotStatus.OUT_OF_SERVICE) {
            throw new BadRequestException("Bay status can only be set to AVAILABLE or OUT_OF_SERVICE manually");
        }
        ParkingSlot slot = getSlotById(slotId);
        facilityAccess.requireAccess(actor, slot.getParkingLocation().getId());
        if (slot.getStatus() == SlotStatus.OCCUPIED) {
            throw new BadRequestException("Bay " + slot.getSlotNumber() + " has a vehicle inside. Process the gate exit first.");
        }
        slot.setStatus(status);
        auditService.log("SLOT_STATUS_CHANGED", actor.getEmail(), "ParkingSlot", slotId,
                slot.getSlotNumber() + " -> " + status, null);
        return mapToDto(slotRepository.save(slot), false);
    }

    @Transactional
    public ParkingSlotDto updateSlot(Long slotId, CreateSlotRequest request) {
        ParkingSlot slot = getSlotById(slotId);

        if (!slot.getSlotNumber().equalsIgnoreCase(request.getSlotNumber().trim())) {
            slotRepository.findByParkingLocationIdAndSlotNumberIgnoreCase(slot.getParkingLocation().getId(), request.getSlotNumber().trim())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(slotId)) {
                            throw new BadRequestException("Slot number '" + request.getSlotNumber() + "' already exists in this location");
                        }
                    });
            slot.setSlotNumber(request.getSlotNumber().trim().toUpperCase());
        }

        if (request.getSlotType() != null) slot.setSlotType(request.getSlotType());
        if (request.getStatus() != null) slot.setStatus(request.getStatus());
        slot.setCustomHourlyRate(request.getCustomHourlyRate());
        if (request.getFloorLevel() != null) slot.setFloorLevel(request.getFloorLevel());
        slot.setHasEvCharger(request.isHasEvCharger());

        return mapToDto(slotRepository.save(slot), false);
    }

    @Transactional
    public void deleteSlot(Long slotId, String actorEmail) {
        ParkingSlot slot = getSlotById(slotId);
        if (bookingRepository.existsByParkingSlotId(slotId)) {
            throw new BadRequestException("Bay " + slot.getSlotNumber() + " has booking history and cannot be deleted. Mark it out of service instead.");
        }
        ParkingLocation loc = slot.getParkingLocation();
        slotRepository.delete(slot);
        auditService.log("SLOT_DELETED", actorEmail, "ParkingSlot", slotId, slot.getSlotNumber(), null);
        loc.setTotalSlots((int) slotRepository.countByParkingLocationId(loc.getId()));
        locationRepository.save(loc);
    }

    public ParkingSlotDto mapToDto(ParkingSlot slot, boolean isBookedForWindow) {
        ParkingSlotDto dto = new ParkingSlotDto();
        dto.setId(slot.getId());
        dto.setSlotNumber(slot.getSlotNumber());
        dto.setLocationId(slot.getParkingLocation().getId());
        dto.setLocationName(slot.getParkingLocation().getName());
        dto.setSlotType(slot.getSlotType());
        dto.setStatus(slot.getStatus());
        dto.setCustomHourlyRate(slot.getCustomHourlyRate());
        dto.setEffectiveHourlyRate(slot.getEffectiveHourlyRate());
        dto.setFloorLevel(slot.getFloorLevel());
        dto.setHasEvCharger(slot.isHasEvCharger());
        dto.setBookedForWindow(isBookedForWindow);
        return dto;
    }
}
