package com.smartparking.controller;

import com.smartparking.dto.common.ApiResponse;
import com.smartparking.dto.parking.ParkingLocationDto;
import com.smartparking.dto.parking.ParkingSlotDto;
import com.smartparking.enums.LocationCategory;
import com.smartparking.service.ParkingLocationService;
import com.smartparking.service.ParkingSlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/parking")
@Tag(name = "Parking Locations & Search", description = "Endpoints for finding parking, searching by city/category and viewing slot layouts")
public class ParkingLocationController {

    private final ParkingLocationService locationService;
    private final ParkingSlotService slotService;

    public ParkingLocationController(ParkingLocationService locationService,
                                     ParkingSlotService slotService) {
        this.locationService = locationService;
        this.slotService = slotService;
    }

    @GetMapping
    @Operation(summary = "Search and filter active parking locations")
    public ResponseEntity<ApiResponse<List<ParkingLocationDto>>> getLocations(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) LocationCategory category) {
        List<ParkingLocationDto> list = locationService.searchLocations(query, city, category);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get parking location details by ID")
    public ResponseEntity<ApiResponse<ParkingLocationDto>> getLocationById(@PathVariable Long id) {
        ParkingLocationDto dto = locationService.getLocationById(id);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @GetMapping("/{id}/slots")
    @Operation(summary = "Get slots for a location with window availability")
    public ResponseEntity<ApiResponse<List<ParkingSlotDto>>> getLocationSlots(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        List<ParkingSlotDto> slots = slotService.getSlotsForLocation(id, startTime, endTime);
        return ResponseEntity.ok(ApiResponse.ok(slots));
    }

    @GetMapping("/{id}/availability")
    @Operation(summary = "Get current available slot counts for location")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLocationAvailability(@PathVariable Long id) {
        ParkingLocationDto loc = locationService.getLocationById(id);
        Map<String, Object> map = Map.of(
                "locationId", loc.getId(),
                "locationName", loc.getName(),
                "totalSlots", loc.getTotalSlots(),
                "availableSlots", loc.getAvailableSlots(),
                "hourlyRate", loc.getHourlyRate()
        );
        return ResponseEntity.ok(ApiResponse.ok(map));
    }
}
