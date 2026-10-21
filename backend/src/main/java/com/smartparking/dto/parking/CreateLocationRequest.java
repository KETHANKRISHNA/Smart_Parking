package com.smartparking.dto.parking;

import com.smartparking.enums.LocationCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class CreateLocationRequest {

    @NotBlank(message = "Location name is required")
    @Size(max = 150, message = "Name is too long (150 characters max)")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(max = 255, message = "Address is too long (255 characters max)")
    private String address;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City is too long (100 characters max)")
    private String city;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    @Size(max = 1000, message = "Description is too long (1000 characters max)")
    private String description;
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Opening time must be HH:mm")
    private String openingTime = "00:00";
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Closing time must be HH:mm")
    private String closingTime = "23:59";

    private LocationCategory category = LocationCategory.OTHER;

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Hourly rate must be greater than zero")
    private BigDecimal hourlyRate;

    @Size(max = 500, message = "Image URL is too long (500 characters max)")
    private String imageUrl;
    private boolean active = true;
    private Long managerId;

    public CreateLocationRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOpeningTime() { return openingTime; }
    public void setOpeningTime(String openingTime) { this.openingTime = openingTime; }

    public String getClosingTime() { return closingTime; }
    public void setClosingTime(String closingTime) { this.closingTime = closingTime; }

    public LocationCategory getCategory() { return category; }
    public void setCategory(LocationCategory category) { this.category = category; }

    public BigDecimal getHourlyRate() { return hourlyRate; }
    public void setHourlyRate(BigDecimal hourlyRate) { this.hourlyRate = hourlyRate; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
}
