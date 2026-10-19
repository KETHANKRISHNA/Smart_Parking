package com.smartparking.service;

import com.smartparking.dto.auth.*;
import com.smartparking.entity.User;
import com.smartparking.enums.Role;
import com.smartparking.exception.BadRequestException;
import com.smartparking.exception.ResourceNotFoundException;
import com.smartparking.repository.UserRepository;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
        user.setPhone(request.getPhone());
        user.setRole(request.getRole() != null ? request.getRole() : Role.ROLE_USER);
        user.setEnabled(true);

        User saved = userRepository.save(user);
        auditService.log("USER_REGISTER", saved.getEmail(), "User", saved.getId(), "New account created", null);

        // Auto authenticate and generate tokens
        CustomUserDetails userDetails = CustomUserDetails.build(saved);
        String jwt = tokenProvider.generateTokenFromUserDetails(userDetails, 86400000);
        String refresh = tokenProvider.generateRefreshToken(userDetails);

        return new AuthResponse(jwt, refresh, saved.getId(), saved.getName(), saved.getEmail(), saved.getPhone(), saved.getRole());
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        String jwt = tokenProvider.generateToken(authentication);
        String refresh = tokenProvider.generateRefreshToken(userDetails);

        auditService.log("USER_LOGIN", userDetails.getEmail(), "User", userDetails.getId(), "Login successful", null);

        return new AuthResponse(
                jwt,
                refresh,
                userDetails.getId(),
                userDetails.getName(),
                userDetails.getEmail(),
                null,
                userDetails.getRole()
        );
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
        user.setPhone(phone);
        User saved = userRepository.save(user);
        return new UserProfileResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getPhone(), saved.getRole(), saved.isEnabled(), saved.getCreatedAt());
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
