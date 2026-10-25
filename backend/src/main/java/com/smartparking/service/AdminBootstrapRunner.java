package com.smartparking.service;

import com.smartparking.entity.User;
import com.smartparking.enums.Role;
import com.smartparking.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Creates the first administrator on an empty production database from BOOTSTRAP_ADMIN_EMAIL and
 * BOOTSTRAP_ADMIN_PASSWORD. It does nothing when those are unset or when an admin already exists, so it is safe
 * to leave configured. (Without this, a fresh deployment would have no way to sign in as an admin.)
 */
@Component
@Order(2)
public class AdminBootstrapRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminBootstrapRunner(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                @Value("${app.bootstrap.admin-email:}") String email,
                                @Value("${app.bootstrap.admin-password:}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email == null ? "" : email.trim().toLowerCase();
        this.password = password == null ? "" : password;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (email.isEmpty()) {
            log.info("BOOTSTRAP_ADMIN_EMAIL is not set, so no initial administrator is created.");
            return;
        }
        if (userRepository.existsByRole(Role.ROLE_ADMIN)) {
            log.info("An administrator already exists; BOOTSTRAP_ADMIN_* is ignored.");
            return;
        }
        if (password.length() < 8 || !password.matches(".*[A-Za-z].*") || !password.matches(".*[0-9].*")) {
            throw new IllegalStateException("BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters with a letter and a digit");
        }

        // The email may already belong to a customer who signed up on the site before any admin existed.
        // Promote that account (the deployment owner controls these variables) instead of failing on the
        // unique-email constraint, which would crash the whole application at startup.
        Optional<User> existing = userRepository.findByEmail(email);
        User admin = existing.orElseGet(() -> {
            User created = new User();
            created.setName("Administrator");
            created.setEmail(email);
            return created;
        });
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole(Role.ROLE_ADMIN);
        admin.setEnabled(true);
        userRepository.save(admin);

        if (existing.isPresent()) {
            log.info("Promoted the existing account {} to administrator and set its password from BOOTSTRAP_ADMIN_PASSWORD", email);
        } else {
            log.info("Created the initial administrator account {}", email);
        }
    }
}
