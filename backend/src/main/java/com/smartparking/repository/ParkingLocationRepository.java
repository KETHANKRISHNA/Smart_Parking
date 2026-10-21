package com.smartparking.repository;

import com.smartparking.entity.ParkingLocation;
import com.smartparking.entity.User;
import com.smartparking.enums.LocationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingLocationRepository extends JpaRepository<ParkingLocation, Long> {
    List<ParkingLocation> findAllByActiveTrue();
    
    List<ParkingLocation> findByCityIgnoreCaseAndActiveTrue(String city);
    
    List<ParkingLocation> findByCategoryAndActiveTrue(LocationCategory category);
    
    List<ParkingLocation> findByManager(User manager);

    List<ParkingLocation> findByManagerId(Long managerId);

    @Query("SELECT p.category, COUNT(p) FROM ParkingLocation p GROUP BY p.category")
    List<Object[]> countByCategory();

    @Query("SELECT p FROM ParkingLocation p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.city) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(p.address) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<ParkingLocation> searchLocations(@Param("query") String query);
}
