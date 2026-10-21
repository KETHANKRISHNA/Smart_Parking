package com.smartparking.dto.admin;

import com.smartparking.enums.Role;
import jakarta.validation.constraints.NotNull;

public class UpdateRoleRequest {

    @NotNull(message = "Role is required")
    private Role role;

    public UpdateRoleRequest() {}

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
