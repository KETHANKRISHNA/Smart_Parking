package com.smartparking.controller;

import com.smartparking.dto.auth.ChangePasswordRequest;
import com.smartparking.dto.auth.UserProfileResponse;
import com.smartparking.dto.common.ApiResponse;
import com.smartparking.security.CustomUserDetails;
import com.smartparking.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Profile", description = "Endpoints for user profile and password management")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/profile")
    @Operation(summary = "Get user profile details")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        UserProfileResponse profile = authService.getCurrentUserProfile(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile details")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        UserProfileResponse profile = authService.updateProfile(
                userDetails.getId(),
                body.get("name"),
                body.get("phone")
        );
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", profile));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change account password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }
}
