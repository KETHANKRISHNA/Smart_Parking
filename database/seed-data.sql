-- ==============================================================
-- SMART PARKING MANAGEMENT SYSTEM — SEED DATA
-- Demonstrative Locations, Slots, Users, and Sample Bookings
-- Passwords below are pre-hashed using BCrypt for testing:
-- Password: "Password@123" for all demo accounts
-- ==============================================================

USE `smart_parking_db`;

-- 1. USERS
-- Pre-hashed BCrypt for 'Password@123': $2a$10$wK1rS2QG3bB5Z2yX0f0qeuZ2/G5u0qW9vJ6y.Y5h0r0rJ7bQ1G6aK
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `enabled`) VALUES
(1, 'System Administrator', 'admin@smartparking.com', '$2a$10$wK1rS2QG3bB5Z2yX0f0qeuZ2/G5u0qW9vJ6y.Y5h0r0rJ7bQ1G6aK', '+91 9876543210', 'ROLE_ADMIN', TRUE),
(2, 'Rajesh Kumar (City Center Manager)', 'manager@smartparking.com', '$2a$10$wK1rS2QG3bB5Z2yX0f0qeuZ2/G5u0qW9vJ6y.Y5h0r0rJ7bQ1G6aK', '+91 9876543211', 'ROLE_PARKING_MANAGER', TRUE),
(3, 'Priya Sharma (Airport Terminal Manager)', 'manager2@smartparking.com', '$2a$10$wK1rS2QG3bB5Z2yX0f0qeuZ2/G5u0qW9vJ6y.Y5h0r0rJ7bQ1G6aK', '+91 9876543212', 'ROLE_PARKING_MANAGER', TRUE),
(4, 'Alex Morgan', 'user@smartparking.com', '$2a$10$wK1rS2QG3bB5Z2yX0f0qeuZ2/G5u0qW9vJ6y.Y5h0r0rJ7bQ1G6aK', '+91 9876543213', 'ROLE_USER', TRUE),
(5, 'Kethan Krishna', 'kethan@smartparking.com', '$2a$10$wK1rS2QG3bB5Z2yX0f0qeuZ2/G5u0qW9vJ6y.Y5h0r0rJ7bQ1G6aK', '+91 9876543214', 'ROLE_USER', TRUE)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. PARKING LOCATIONS
INSERT INTO `parking_locations` (`id`, `name`, `address`, `city`, `latitude`, `longitude`, `description`, `opening_time`, `closing_time`, `total_slots`, `category`, `hourly_rate`, `image_url`, `active`, `manager_id`) VALUES
(1, 'Apollo Multi-Specialty Hospital Parking', '154/11 Bannerghatta Road, Opp IIMB', 'Bangalore', 12.9249, 77.5996, '24/7 dedicated hospital parking with emergency EV bays, wheel-chair accessible ramps, and direct corridor access to main triage.', '00:00', '23:59', 16, 'HOSPITAL', 40.00, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', TRUE, 2),
(2, 'Phoenix Marketcity Mega Parking', 'Whitefield Main Rd, Mahadevapura', 'Bangalore', 12.9977, 77.6974, 'Four-level smart basement parking equipped with automated guidance, fast DC EV chargers, and valet assistance.', '09:00', '23:30', 16, 'MALL', 60.00, 'https://images.unsplash.com/photo-1567449303078-57ad995bd301?auto=format&fit=crop&w=800&q=80', TRUE, 2),
(3, 'Central Railway Station Multi-Level Hub', 'Station Road, Majestic', 'Bangalore', 12.9784, 77.5694, 'Direct platform access parking with long-stay security surveillance, bike lockers, and 24-hour manned entry booths.', '00:00', '23:59', 16, 'RAILWAY_STATION', 30.00, 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80', TRUE, 2),
(4, 'Kempegowda International Airport Terminal 1 Parking', 'KIAL Road, Devanahalli', 'Bangalore', 13.1986, 77.7066, 'Premium airport terminal parking featuring express shuttle service, covered canopies, fast luggage bays, and fastag automated checkout.', '00:00', '23:59', 16, 'AIRPORT', 100.00, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80', TRUE, 3),
(5, 'Manyata Tech Park Silicon Wing', 'Outer Ring Road, Hebbal', 'Bangalore', 13.0489, 77.6200, 'State-of-the-art corporate campus parking with reserved tech-park employee lanes, corporate visitor passes, and solar EV chargers.', '06:00', '22:00', 16, 'IT_PARK', 35.00, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', TRUE, 3),
(6, 'Cubbon Park Heritage Gardens Parking', 'Kasturba Road, Near High Court', 'Bangalore', 12.9763, 77.5929, 'Eco-friendly shaded parking surrounded by lush heritage trees, bike stands, and direct access to morning walking trails.', '06:00', '20:00', 16, 'TOURIST_SPOT', 25.00, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', TRUE, 2)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. PARKING SLOTS FOR APOLLO HOSPITAL (Location 1)
INSERT INTO `parking_slots` (`slot_number`, `parking_location_id`, `slot_type`, `status`, `floor_level`, `has_ev_charger`, `custom_hourly_rate`) VALUES
('A01', 1, 'CAR', 'OCCUPIED', 'Ground Floor', FALSE, 40.00),
('A02', 1, 'CAR', 'AVAILABLE', 'Ground Floor', FALSE, 40.00),
('A03', 1, 'CAR', 'AVAILABLE', 'Ground Floor', FALSE, 40.00),
('A04', 1, 'CAR', 'AVAILABLE', 'Ground Floor', FALSE, 40.00),
('A05', 1, 'CAR', 'AVAILABLE', 'Ground Floor', FALSE, 40.00),
('A06', 1, 'CAR', 'AVAILABLE', 'Ground Floor', FALSE, 40.00),
('E01', 1, 'EV', 'AVAILABLE', 'Ground Floor', TRUE, 55.00),
('E02', 1, 'EV', 'AVAILABLE', 'Ground Floor', TRUE, 55.00),
('E03', 1, 'EV', 'AVAILABLE', 'Ground Floor', TRUE, 55.00),
('D01', 1, 'ACCESSIBLE', 'AVAILABLE', 'Ground Floor', FALSE, 40.00),
('D02', 1, 'ACCESSIBLE', 'AVAILABLE', 'Ground Floor', FALSE, 40.00),
('B01', 1, 'BIKE', 'AVAILABLE', 'Basement 1', FALSE, 20.00),
('B02', 1, 'BIKE', 'AVAILABLE', 'Basement 1', FALSE, 20.00),
('B03', 1, 'BIKE', 'AVAILABLE', 'Basement 1', FALSE, 20.00),
('B04', 1, 'BIKE', 'AVAILABLE', 'Basement 1', FALSE, 20.00),
('B05', 1, 'BIKE', 'AVAILABLE', 'Basement 1', FALSE, 20.00)
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);
