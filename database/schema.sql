-- ==============================================================
-- SMART PARKING MANAGEMENT SYSTEM — DATABASE SCHEMA
-- Target Database: MySQL 8.0+
-- Compatible with MySQL Workbench & Hibernate ORM
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `smart_parking_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `smart_parking_db`;

-- Drop existing tables in reverse dependency order if re-initializing
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `parking_sessions`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `parking_slots`;
DROP TABLE IF EXISTS `parking_locations`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS TABLE
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20),
    `role` VARCHAR(30) NOT NULL DEFAULT 'ROLE_USER',
    `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PARKING LOCATIONS TABLE
CREATE TABLE `parking_locations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `description` VARCHAR(1000),
    `opening_time` VARCHAR(10) DEFAULT '00:00',
    `closing_time` VARCHAR(10) DEFAULT '23:59',
    `total_slots` INT NOT NULL DEFAULT 0,
    `category` VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    `hourly_rate` DECIMAL(10, 2) NOT NULL DEFAULT 40.00,
    `image_url` VARCHAR(500),
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `manager_id` BIGINT,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_loc_city` (`city`),
    INDEX `idx_loc_category` (`category`),
    INDEX `idx_loc_active` (`active`),
    CONSTRAINT `fk_location_manager` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PARKING SLOTS TABLE
CREATE TABLE `parking_slots` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `slot_number` VARCHAR(20) NOT NULL,
    `parking_location_id` BIGINT NOT NULL,
    `slot_type` VARCHAR(30) NOT NULL DEFAULT 'CAR',
    `status` VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    `custom_hourly_rate` DECIMAL(10, 2),
    `floor_level` VARCHAR(20) DEFAULT 'Ground',
    `has_ev_charger` BOOLEAN DEFAULT FALSE,
    UNIQUE KEY `uk_location_slot_number` (`parking_location_id`, `slot_number`),
    INDEX `idx_slot_location` (`parking_location_id`),
    INDEX `idx_slot_status` (`status`),
    INDEX `idx_slot_type` (`slot_type`),
    CONSTRAINT `fk_slot_location` FOREIGN KEY (`parking_location_id`) REFERENCES `parking_locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BOOKINGS TABLE
CREATE TABLE `bookings` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_reference` VARCHAR(32) NOT NULL UNIQUE,
    `user_id` BIGINT NOT NULL,
    `parking_location_id` BIGINT NOT NULL,
    `parking_slot_id` BIGINT NOT NULL,
    `vehicle_number` VARCHAR(25) NOT NULL,
    `vehicle_type` VARCHAR(20) NOT NULL DEFAULT 'CAR',
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `total_hours` DOUBLE NOT NULL,
    `hourly_rate` DECIMAL(10, 2) NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    `qr_token` VARCHAR(120) UNIQUE,
    `cancellation_reason` VARCHAR(255),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_booking_ref` (`booking_reference`),
    INDEX `idx_booking_user` (`user_id`),
    INDEX `idx_booking_slot` (`parking_slot_id`),
    INDEX `idx_booking_time` (`start_time`, `end_time`),
    INDEX `idx_booking_status` (`status`),
    INDEX `idx_booking_qr` (`qr_token`),
    CONSTRAINT `fk_booking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_booking_location` FOREIGN KEY (`parking_location_id`) REFERENCES `parking_locations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_booking_slot` FOREIGN KEY (`parking_slot_id`) REFERENCES `parking_slots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PAYMENTS TABLE
CREATE TABLE `payments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `transaction_id` VARCHAR(64) NOT NULL UNIQUE,
    `booking_id` BIGINT NOT NULL UNIQUE,
    `amount` DECIMAL(10, 2) NOT NULL,
    `payment_method` VARCHAR(30) NOT NULL DEFAULT 'CARD',
    `payment_status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `gateway_reference` VARCHAR(100),
    `paid_at` DATETIME,
    `failure_reason` VARCHAR(255),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_payment_tx` (`transaction_id`),
    INDEX `idx_payment_status` (`payment_status`),
    CONSTRAINT `fk_payment_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PARKING SESSIONS TABLE (ENTRY / EXIT TRACKING)
CREATE TABLE `parking_sessions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` BIGINT NOT NULL UNIQUE,
    `entry_time` DATETIME,
    `exit_time` DATETIME,
    `entry_gate` VARCHAR(50) DEFAULT 'Gate 1 (Main Entrance)',
    `exit_gate` VARCHAR(50) DEFAULT 'Gate 2 (Main Exit)',
    `session_status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `overtime_minutes` BIGINT DEFAULT 0,
    `additional_fee` DECIMAL(10, 2) DEFAULT 0.00,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_session_status` (`session_status`),
    INDEX `idx_session_entry` (`entry_time`),
    CONSTRAINT `fk_session_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. NOTIFICATIONS TABLE
CREATE TABLE `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notif_user` (`user_id`),
    INDEX `idx_notif_read` (`is_read`),
    CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. AUDIT LOGS TABLE
CREATE TABLE `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `action` VARCHAR(100) NOT NULL,
    `performed_by` VARCHAR(120),
    `entity_name` VARCHAR(50),
    `entity_id` BIGINT,
    `details` VARCHAR(1000),
    `ip_address` VARCHAR(45),
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_action` (`action`),
    INDEX `idx_audit_time` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
