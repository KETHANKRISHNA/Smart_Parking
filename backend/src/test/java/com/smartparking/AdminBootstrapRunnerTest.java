package com.smartparking;

import com.smartparking.entity.User;
import com.smartparking.enums.Role;
import com.smartparking.repository.UserRepository;
import com.smartparking.service.AdminBootstrapRunner;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapRunnerTest {

    @Mock private UserRepository users;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private AdminBootstrapRunner runner(String email, String password) {
        return new AdminBootstrapRunner(users, encoder, email, password);
    }

    @Test
    void doesNothingWhenNotConfigured() {
        runner("", "").run();
        verifyNoInteractions(users);
    }

    @Test
    void createsTheFirstAdminWithAHashedPassword() {
        when(users.existsByRole(Role.ROLE_ADMIN)).thenReturn(false);

        runner("Boss@Example.com", "Str0ngPass").run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertEquals("boss@example.com", saved.getValue().getEmail());
        assertEquals(Role.ROLE_ADMIN, saved.getValue().getRole());
        assertNotEquals("Str0ngPass", saved.getValue().getPassword());
        assertTrue(encoder.matches("Str0ngPass", saved.getValue().getPassword()));
    }

    @Test
    void neverCreatesASecondAdmin() {
        when(users.existsByRole(Role.ROLE_ADMIN)).thenReturn(true);

        runner("boss@example.com", "Str0ngPass").run();

        verify(users, never()).save(any());
    }

    @Test
    void refusesAWeakPassword() {
        when(users.existsByRole(Role.ROLE_ADMIN)).thenReturn(false);

        assertThrows(IllegalStateException.class, () -> runner("boss@example.com", "weak").run());
        verify(users, never()).save(any());
    }

    @Test
    void promotesAnExistingCustomerWithTheSameEmailInsteadOfCrashing() {
        User customer = new User();
        customer.setEmail("boss@example.com");
        customer.setName("Original Name");
        customer.setRole(Role.ROLE_USER);
        customer.setEnabled(false);
        customer.setPassword("old-hash");
        when(users.existsByRole(Role.ROLE_ADMIN)).thenReturn(false);
        when(users.findByEmail("boss@example.com")).thenReturn(Optional.of(customer));

        runner("Boss@Example.com", "Str0ngPass").run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertSame(customer, saved.getValue(), "the existing row is updated, not duplicated");
        assertEquals(Role.ROLE_ADMIN, customer.getRole());
        assertTrue(customer.isEnabled());
        assertEquals("Original Name", customer.getName());
        assertTrue(encoder.matches("Str0ngPass", customer.getPassword()));
    }
}
