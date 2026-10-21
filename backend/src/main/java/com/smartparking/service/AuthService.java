package com.smartparking.service;

import com.smartparking.dto.admin.AdminCreateUserRequest;
import com.smartparking.dto.auth.*;
import com.smartparking.entity.User;
import com.smartparking.enums.Role;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.UserRepository;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(blankToNull(request.getPhone()));
        // Self-registration can only ever create a customer account
        user.setRole(Role.ROLE_USER);
        user.setEnabled(true);

        User saved = userRepository.save(user);
        auditService.log("USER_REGISTER", saved.getEmail(), "User", saved.getId(), "New account created", null);

        return issueTokens(saved);
    }

    /** Admin-only: creates a staff (or customer) account with an explicit role. */
    @Transactional
    public UserProfileResponse createUserByAdmin(AdminCreateUserRequest request, String adminEmail) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered: " + email);
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(blankToNull(request.getPhone()));
        user.setRole(request.getRole());
        user.setEnabled(true);

        User saved = userRepository.save(user);
        auditService.log("USER_CREATED_BY_ADMIN", adminEmail, "User", saved.getId(),
                "Created " + saved.getEmail() + " with role " + saved.getRole(), null);

        return toProfile(saved);
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(String refreshToken) {
        if (!tokenProvider.validateRefreshToken(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }
        User user = userRepository.findByEmail(tokenProvider.getEmailFromToken(refreshToken))
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired refresh token"));
        if (!user.isEnabled()) {
            throw new DisabledException("Account is disabled");
        }
        return issueTokens(user);
    }

    private AuthResponse issueTokens(User user) {
        CustomUserDetails details = CustomUserDetails.build(user);
        return new AuthResponse(
                tokenProvider.generateAccessToken(details),
                tokenProvider.generateRefreshToken(details),
                user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole());
    }

    private UserProfileResponse toProfile(User u) {
        return new UserProfileResponse(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole(), u.isEnabled(), u.getCreatedAt());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        auditService.log("USER_LOGIN", user.getEmail(), "User", user.getId(), "Login successful", null);

        return issueTokens(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, String name, String phone) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (name != null && !name.trim().isEmpty()) {
            user.setName(name.trim());
        }
        if (phone != null) {
            user.setPhone(blankToNull(phone));
        }
        return toProfile(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.log("PASSWORD_CHANGE", user.getEmail(), "User", user.getId(), "Password updated", null);
    }
}
