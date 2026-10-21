package com.smartparking.service;

import com.smartparking.dto.parking.CreateLocationRequest;
import com.smartparking.dto.parking.ParkingLocationDto;
import com.smartparking.entity.ParkingLocation;
import com.smartparking.entity.User;
import com.smartparking.enums.LocationCategory;
import com.smartparking.enums.Role;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.ParkingLocationRepository;
import com.smartparking.repository.ParkingSlotRepository;
import com.smartparking.repository.UserRepository;
import com.smartparking.security.CustomUserDetails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ParkingLocationService {

    private final ParkingLocationRepository locationRepository;
    private final ParkingSlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final FacilityAccessService facilityAccess;
    private final Clock clock;
    private final long paymentWindowMinutes;

    public ParkingLocationService(ParkingLocationRepository locationRepository,
                                  ParkingSlotRepository slotRepository,
                                  BookingRepository bookingRepository,
                                  UserRepository userRepository,
                                  AuditService auditService,
                                  FacilityAccessService facilityAccess,
                                  Clock clock,
                                  @Value("${app.booking.payment-window-minutes:15}") long paymentWindowMinutes) {
        this.locationRepository = locationRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.facilityAccess = facilityAccess;
        this.clock = clock;
        this.paymentWindowMinutes = paymentWindowMinutes;
    }

    @Transactional(readOnly = true)
    public List<ParkingLocationDto> getAllLocationsForAdmin() {
        return mapAll(locationRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<ParkingLocationDto> getManagedFacilities(CustomUserDetails user) {
        return mapAll(facilityAccess.facilitiesFor(user));
    }

    /** The facility a staff member is operating (requested one, or their first), with live availability. */
    @Transactional(readOnly = true)
    public ParkingLocationDto getManagedFacility(CustomUserDetails user, Long requestedLocationId) {
        return getLocationById(facilityAccess.resolveFacilityId(user, requestedLocationId));
    }

    @Transactional(readOnly = true)
    public List<ParkingLocationDto> searchLocations(String query, String city, LocationCategory category) {
        List<ParkingLocation> list;
        if (query != null && !query.trim().isEmpty()) {
            list = locationRepository.searchLocations(query.trim());
        } else if (city != null && !city.trim().isEmpty()) {
            list = locationRepository.findByCityIgnoreCaseAndActiveTrue(city.trim());
        } else if (category != null) {
            list = locationRepository.findByCategoryAndActiveTrue(category);
        } else {
            list = locationRepository.findAllByActiveTrue();
        }

        return mapAll(list.stream()
                .filter(loc -> category == null || loc.getCategory() == category)
                .toList());
    }

    @Transactional(readOnly = true)
    public ParkingLocationDto getLocationById(Long id) {
        return mapToDtoWithCurrentAvailability(getEntityById(id));
    }

    @Transactional(readOnly = true)
    public ParkingLocation getEntityById(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking location not found with id: " + id));
    }

    @Transactional
    public ParkingLocationDto createLocation(CreateLocationRequest request, String actorEmail) {
        ParkingLocation loc = new ParkingLocation();
        updateLocationFromRequest(loc, request);
        ParkingLocation saved = locationRepository.save(loc);
        auditService.log("LOCATION_CREATED", actorEmail, "ParkingLocation", saved.getId(), saved.getName(), null);
        return mapToDtoWithCurrentAvailability(saved);
    }

    @Transactional
    public ParkingLocationDto updateLocation(Long id, CreateLocationRequest request, String actorEmail) {
        ParkingLocation loc = getEntityById(id);
        updateLocationFromRequest(loc, request);
        ParkingLocation updated = locationRepository.save(loc);
        auditService.log("LOCATION_UPDATED", actorEmail, "ParkingLocation", id, updated.getName(), null);
        return mapToDtoWithCurrentAvailability(updated);
    }

    /** A facility with booking history is never destroyed; it has to be deactivated instead. */
    @Transactional
    public void deleteLocation(Long id, String actorEmail) {
        ParkingLocation loc = getEntityById(id);
        if (bookingRepository.existsByParkingLocationId(id)) {
            throw new BadRequestException("This facility has booking history and cannot be deleted. Deactivate it instead.");
        }
        locationRepository.delete(loc);
        auditService.log("LOCATION_DELETED", actorEmail, "ParkingLocation", id, loc.getName(), null);
    }

    @Transactional
    public ParkingLocationDto toggleActiveStatus(Long id, String actorEmail) {
        ParkingLocation loc = getEntityById(id);
        loc.setActive(!loc.isActive());
        auditService.log(loc.isActive() ? "LOCATION_ACTIVATED" : "LOCATION_DEACTIVATED", actorEmail,
                "ParkingLocation", id, loc.getName(), null);
        return mapToDtoWithCurrentAvailability(locationRepository.save(loc));
    }

    @Transactional
    public ParkingLocationDto assignManager(Long locationId, Long managerId, String actorEmail) {
        ParkingLocation loc = getEntityById(locationId);
        loc.setManager(managerId != null ? requireManager(managerId) : null);
        auditService.log("MANAGER_ASSIGNED", actorEmail, "ParkingLocation", locationId,
                loc.getName() + " -> " + (loc.getManager() != null ? loc.getManager().getEmail() : "none"), null);
        return mapToDtoWithCurrentAvailability(locationRepository.save(loc));
    }

    private User requireManager(Long managerId) {
        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager user not found with id: " + managerId));
        if (manager.getRole() != Role.ROLE_PARKING_MANAGER) {
            throw new BadRequestException(manager.getEmail() + " is not a parking manager");
        }
        return manager;
    }

    private void updateLocationFromRequest(ParkingLocation loc, CreateLocationRequest request) {
        loc.setName(request.getName());
        loc.setAddress(request.getAddress());
        loc.setCity(request.getCity());
        loc.setLatitude(request.getLatitude());
        loc.setLongitude(request.getLongitude());
        loc.setDescription(request.getDescription());
        loc.setOpeningTime(request.getOpeningTime() != null ? request.getOpeningTime() : "00:00");
        loc.setClosingTime(request.getClosingTime() != null ? request.getClosingTime() : "23:59");
        loc.setCategory(request.getCategory() != null ? request.getCategory() : LocationCategory.OTHER);
        loc.setHourlyRate(request.getHourlyRate());
        loc.setImageUrl(request.getImageUrl());
        loc.setActive(request.isActive());

        if (request.getManagerId() != null) {
            loc.setManager(requireManager(request.getManagerId()));
        }
    }

    public ParkingLocationDto mapToDtoWithCurrentAvailability(ParkingLocation loc) {
        return mapAll(List.of(loc)).get(0);
    }

    /** Maps many facilities with two aggregate queries in total, instead of three queries per facility. */
    public List<ParkingLocationDto> mapAll(List<ParkingLocation> locations) {
        LocalDateTime now = LocalDateTime.now(clock);
        Map<Long, long[]> slotCounts = new HashMap<>(); // [total, outOfService]
        for (Object[] row : slotRepository.slotCountsByLocation()) {
            slotCounts.put((Long) row[0], new long[]{((Number) row[1]).longValue(), ((Number) row[2]).longValue()});
        }
        Map<Long, Long> booked = new HashMap<>();
        for (Object[] row : bookingRepository.bookedSlotCountsByLocation(now, now.plusMinutes(30), now.minusMinutes(paymentWindowMinutes))) {
            booked.put((Long) row[0], ((Number) row[1]).longValue());
        }

        return locations.stream().map(loc -> {
            long[] counts = slotCounts.getOrDefault(loc.getId(), new long[]{0, 0});
            ParkingLocationDto dto = toDto(loc);
            dto.setTotalSlots((int) counts[0]);
            dto.setAvailableSlots((int) Math.max(0, counts[0] - counts[1] - booked.getOrDefault(loc.getId(), 0L)));
            return dto;
        }).toList();
    }

    private ParkingLocationDto toDto(ParkingLocation loc) {
        ParkingLocationDto dto = new ParkingLocationDto();
        dto.setId(loc.getId());
        dto.setName(loc.getName());
        dto.setAddress(loc.getAddress());
        dto.setCity(loc.getCity());
        dto.setLatitude(loc.getLatitude());
        dto.setLongitude(loc.getLongitude());
        dto.setDescription(loc.getDescription());
        dto.setOpeningTime(loc.getOpeningTime());
        dto.setClosingTime(loc.getClosingTime());
        dto.setCategory(loc.getCategory());
        dto.setHourlyRate(loc.getHourlyRate());
        dto.setImageUrl(loc.getImageUrl());
        dto.setActive(loc.isActive());
        dto.setCreatedAt(loc.getCreatedAt());
        if (loc.getManager() != null) {
            dto.setManagerId(loc.getManager().getId());
            dto.setManagerName(loc.getManager().getName());
        }
        return dto;
    }
}
