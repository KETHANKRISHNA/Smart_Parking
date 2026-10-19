package com.smartparking.service;

import com.smartparking.dto.parking.CreateLocationRequest;
import com.smartparking.dto.parking.ParkingLocationDto;
import com.smartparking.entity.ParkingLocation;
import com.smartparking.entity.User;
import com.smartparking.enums.BookingStatus;
import com.smartparking.enums.LocationCategory;
import com.smartparking.enums.SlotStatus;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.BookingRepository;
import com.smartparking.repository.ParkingLocationRepository;
import com.smartparking.repository.ParkingSlotRepository;
import com.smartparking.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ParkingLocationService {

    private final ParkingLocationRepository locationRepository;
    private final ParkingSlotRepository slotRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public ParkingLocationService(ParkingLocationRepository locationRepository,
                                  ParkingSlotRepository slotRepository,
                                  BookingRepository bookingRepository,
                                  UserRepository userRepository) {
        this.locationRepository = locationRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ParkingLocationDto> getAllActiveLocations() {
        return locationRepository.findAllByActiveTrue().stream()
                .map(this::mapToDtoWithCurrentAvailability)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ParkingLocationDto> getAllLocationsForAdmin() {
        return locationRepository.findAll().stream()
                .map(this::mapToDtoWithCurrentAvailability)
                .toList();
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

        return list.stream()
                .filter(loc -> category == null || loc.getCategory() == category)
                .map(this::mapToDtoWithCurrentAvailability)
                .toList();
    }

    @Transactional(readOnly = true)
    public ParkingLocationDto getLocationById(Long id) {
        ParkingLocation loc = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking location not found with id: " + id));
        return mapToDtoWithCurrentAvailability(loc);
    }

    @Transactional(readOnly = true)
    public ParkingLocation getEntityById(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parking location not found with id: " + id));
    }

    @Transactional
    public ParkingLocationDto createLocation(CreateLocationRequest request) {
        ParkingLocation loc = new ParkingLocation();
        updateLocationFromRequest(loc, request);
        ParkingLocation saved = locationRepository.save(loc);
        return mapToDtoWithCurrentAvailability(saved);
    }

    @Transactional
    public ParkingLocationDto updateLocation(Long id, CreateLocationRequest request) {
        ParkingLocation loc = getEntityById(id);
        updateLocationFromRequest(loc, request);
        ParkingLocation updated = locationRepository.save(loc);
        return mapToDtoWithCurrentAvailability(updated);
    }

    @Transactional
    public void deleteLocation(Long id) {
        ParkingLocation loc = getEntityById(id);
        locationRepository.delete(loc);
    }

    @Transactional
    public ParkingLocationDto toggleActiveStatus(Long id) {
        ParkingLocation loc = getEntityById(id);
        loc.setActive(!loc.isActive());
        return mapToDtoWithCurrentAvailability(locationRepository.save(loc));
    }

    @Transactional
    public ParkingLocationDto assignManager(Long locationId, Long managerId) {
        ParkingLocation loc = getEntityById(locationId);
        if (managerId != null) {
            User manager = userRepository.findById(managerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Manager user not found with id: " + managerId));
            loc.setManager(manager);
        } else {
            loc.setManager(null);
        }
        return mapToDtoWithCurrentAvailability(locationRepository.save(loc));
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
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager not found with id: " + request.getManagerId()));
            loc.setManager(manager);
        }
    }

    public ParkingLocationDto mapToDtoWithCurrentAvailability(ParkingLocation loc) {
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

        // Real-time calculation of total and available slots
        long totalSlots = slotRepository.countByParkingLocationId(loc.getId());
        dto.setTotalSlots((int) totalSlots);

        LocalDateTime now = LocalDateTime.now();
        List<Long> bookedSlotIds = bookingRepository.findBookedSlotIdsInWindow(loc.getId(), now, now.plusMinutes(30));
        long outOfServiceSlots = slotRepository.countByParkingLocationIdAndStatus(loc.getId(), SlotStatus.OUT_OF_SERVICE);

        int available = (int) (totalSlots - bookedSlotIds.size() - outOfServiceSlots);
        dto.setAvailableSlots(Math.max(0, available));

        return dto;
    }
}
