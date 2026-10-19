package com.smartparking.dto.admin;

import com.smartparking.dto.booking.BookingResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AdminDashboardStats {
    private long totalLocations;
    private long totalSlots;
    private long availableSlots;
    private long activeReservations;
    private long todaysBookings;
    private BigDecimal totalRevenue;
    private double occupancyPercentage;

    private List<Map<String, Object>> revenueTrend;
    private Map<String, Long> vehicleDistribution;
    private Map<String, Long> categoryDistribution;
    private List<BookingResponse> recentBookings;
    private List<Map<String, Object>> topLocations;

    public AdminDashboardStats() {}

    public long getTotalLocations() { return totalLocations; }
    public void setTotalLocations(long totalLocations) { this.totalLocations = totalLocations; }

    public long getTotalSlots() { return totalSlots; }
    public void setTotalSlots(long totalSlots) { this.totalSlots = totalSlots; }

    public long getAvailableSlots() { return availableSlots; }
    public void setAvailableSlots(long availableSlots) { this.availableSlots = availableSlots; }

    public long getActiveReservations() { return activeReservations; }
    public void setActiveReservations(long activeReservations) { this.activeReservations = activeReservations; }

    public long getTodaysBookings() { return todaysBookings; }
    public void setTodaysBookings(long todaysBookings) { this.todaysBookings = todaysBookings; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }

    public double getOccupancyPercentage() { return occupancyPercentage; }
    public void setOccupancyPercentage(double occupancyPercentage) { this.occupancyPercentage = occupancyPercentage; }

    public List<Map<String, Object>> getRevenueTrend() { return revenueTrend; }
    public void setRevenueTrend(List<Map<String, Object>> revenueTrend) { this.revenueTrend = revenueTrend; }

    public Map<String, Long> getVehicleDistribution() { return vehicleDistribution; }
    public void setVehicleDistribution(Map<String, Long> vehicleDistribution) { this.vehicleDistribution = vehicleDistribution; }

    public Map<String, Long> getCategoryDistribution() { return categoryDistribution; }
    public void setCategoryDistribution(Map<String, Long> categoryDistribution) { this.categoryDistribution = categoryDistribution; }

    public List<BookingResponse> getRecentBookings() { return recentBookings; }
    public void setRecentBookings(List<BookingResponse> recentBookings) { this.recentBookings = recentBookings; }

    public List<Map<String, Object>> getTopLocations() { return topLocations; }
    public void setTopLocations(List<Map<String, Object>> topLocations) { this.topLocations = topLocations; }
}
