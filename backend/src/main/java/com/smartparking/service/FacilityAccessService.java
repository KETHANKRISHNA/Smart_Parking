package com.smartparking.service;

import com.smartparking.entity.ParkingLocation;
import com.smartparking.enums.Role;
import com.smartparking.repository.ParkingLocationRepository;
import com.smartparking.security.CustomUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Decides which parking facilities a staff member may operate. Admins may operate all; managers only their own. */
@Service
public class FacilityAccessService {

    private final ParkingLocationRepository locationRepository;

    public FacilityAccessService(ParkingLocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<ParkingLocation> facilitiesFor(CustomUserDetails user) {
        if (user.getRole() == Role.ROLE_ADMIN) {
            return locationRepository.findAll();
        }
        return locationRepository.findByManagerId(user.getId());
    }

    /**
     * Resolves the facility an operation applies to: the requested one (if the user may access it), or the
     * user's lowest-id facility when none was requested. Unassigned managers get a 403, never someone else's facility.
     */
    @Transactional(readOnly = true)
    public Long resolveFacilityId(CustomUserDetails user, Long requestedLocationId) {
        if (requestedLocationId != null) {
            requireAccess(user, requestedLocationId);
            return requestedLocationId;
        }
        return facilitiesFor(user).stream()
                .map(ParkingLocation::getId)
                .min(Long::compareTo)
                .orElseThrow(() -> new AccessDeniedException("No parking facility is assigned to your account"));
    }

    @Transactional(readOnly = true)
    public void requireAccess(CustomUserDetails user, Long locationId) {
        if (user.getRole() == Role.ROLE_ADMIN) {
            return;
        }
        boolean manages = locationRepository.findByManagerId(user.getId()).stream()
                .anyMatch(l -> l.getId().equals(locationId));
        if (!manages) {
            throw new AccessDeniedException("You do not manage this parking facility");
        }
    }
}
