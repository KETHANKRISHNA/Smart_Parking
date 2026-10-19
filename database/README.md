# Smart Parking Management System — Database Setup Guide

This folder contains the complete SQL scripts for creating and inspecting the MySQL database.

## Database Overview
- **Database Engine**: MySQL 8.0+ / InnoDB
- **Character Set**: `utf8mb4`
- **Default Database Name**: `smart_parking_db`

---

## Architecture & Tables
1. **`users`**: User profiles with credentials, phone numbers, and roles (`ROLE_USER`, `ROLE_ADMIN`, `ROLE_PARKING_MANAGER`).
2. **`parking_locations`**: Geo-referenced parking facilities (Hospitals, Malls, Railway Stations, Airports, IT Parks, Tourist Spots).
3. **`parking_slots`**: Individual parking bays with slot type (`CAR`, `BIKE`, `EV`, `ACCESSIBLE`), status (`AVAILABLE`, `RESERVED`, `OCCUPIED`, `OUT_OF_SERVICE`), floor levels, and EV charging support.
4. **`bookings`**: Reservation time windows, vehicles, calculated prices, statuses, and unique QR tokens.
5. **`payments`**: Payment transaction logs, simulated gateway references, and refund statuses.
6. **`parking_sessions`**: Gate check-in/check-out tracking, entry/exit timestamps, and overtime penalty calculations.
7. **`notifications`**: User and administrator in-app alerts.
8. **`audit_logs`**: Security and administrative activity logs.

---

## Instructions for MySQL Workbench

1. Open **MySQL Workbench**.
2. Connect to your local MySQL instance (e.g., `localhost:3306`).
3. Open `database/schema.sql` (`File -> Open SQL Script...`).
4. Click the **Lightning Bolt icon (Execute)** to create the schema and tables.
5. Next, open `database/seed-data.sql` and execute it to populate demo records.
6. Verify the tables by running:
   ```sql
   USE smart_parking_db;
   SHOW TABLES;
   SELECT * FROM parking_locations;
   SELECT * FROM parking_slots;
   SELECT * FROM users;
   ```

---

## Connecting Spring Boot to MySQL
Update your `application.properties` or set environment variables:
```properties
spring.profiles.active=mysql
spring.datasource.url=jdbc:mysql://localhost:3306/smart_parking_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```
Or run with environment variables:
```bash
$env:SPRING_PROFILES_ACTIVE="mysql"
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="YOUR_MYSQL_PASSWORD"
mvn spring-boot:run
```
*(Note: If no MySQL credentials are provided, Spring Boot automatically boots in MySQL-compatible persistent H2 mode with zero configuration needed).*
