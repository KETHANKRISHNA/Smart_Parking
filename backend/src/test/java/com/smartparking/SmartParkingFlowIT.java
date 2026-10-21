package com.smartparking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/**
 * End-to-end tests against the real Spring context (security filters, JPA, in-memory H2, seeded demo data).
 * Covers the audit's critical findings: role escalation, auth rules, payment gating, gate scoping, double booking.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SmartParkingFlowIT {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;
    @Autowired private Clock clock;

    // ---------- helpers ----------

    private JsonNode send(MockHttpServletRequestBuilder req, String token, Object body, int expectedStatus) throws Exception {
        if (token != null) {
            req.header("Authorization", "Bearer " + token);
        }
        if (body != null) {
            req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body));
        }
        MvcResult result = mvc.perform(req).andReturn();
        assertEquals(expectedStatus, result.getResponse().getStatus(),
                "unexpected status for " + req.buildRequest(new org.springframework.mock.web.MockServletContext()).getRequestURI()
                        + ": " + result.getResponse().getContentAsString());
        String content = result.getResponse().getContentAsString();
        return content.isBlank() ? json.createObjectNode() : json.readTree(content);
    }

    private ObjectNode obj() {
        return json.createObjectNode();
    }

    private JsonNode login(String email, String password) throws Exception {
        return send(post("/api/v1/auth/login"), null, obj().put("email", email).put("password", password), 200).get("data");
    }

    private String tokenOf(String email, String password) throws Exception {
        return login(email, password).get("token").asText();
    }

    private String registerFreshUser() throws Exception {
        String email = "it-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        JsonNode data = send(post("/api/v1/auth/register"), null,
                obj().put("name", "IT User").put("email", email).put("password", "Passw0rd1"), 200).get("data");
        return data.get("token").asText();
    }

    private JsonNode firstLocationSlots(long locationId) throws Exception {
        return send(get("/api/v1/parking/" + locationId + "/slots"), null, null, 200).get("data");
    }

    /** Finds a CAR slot in the location that is AVAILABLE. */
    private long carSlot(long locationId, int skip) throws Exception {
        int seen = 0;
        for (JsonNode s : firstLocationSlots(locationId)) {
            if ("CAR".equals(s.get("slotType").asText()) && "AVAILABLE".equals(s.get("status").asText())) {
                if (seen++ == skip) {
                    return s.get("id").asLong();
                }
            }
        }
        throw new IllegalStateException("no free car slot");
    }

    private ObjectNode bookingBody(long locationId, long slotId, LocalDateTime start, int hours) {
        return obj().put("locationId", locationId).put("slotId", slotId)
                .put("vehicleNumber", "KA01AB1234").put("vehicleType", "CAR")
                .put("startTime", start.toString()).put("endTime", start.plusHours(hours).toString());
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    // ---------- tests ----------

    @Test
    @Order(1)
    void registrationCannotGrantAdminRole() throws Exception {
        String email = "attacker-" + UUID.randomUUID().toString().substring(0, 6) + "@example.com";
        JsonNode data = send(post("/api/v1/auth/register"), null,
                obj().put("name", "Mallory").put("email", email).put("password", "Passw0rd1").put("role", "ROLE_ADMIN"),
                200).get("data");

        assertEquals("ROLE_USER", data.get("role").asText());
        send(get("/api/v1/admin/dashboard"), data.get("token").asText(), null, 403);
    }

    @Test
    @Order(2)
    void weakPasswordIsRejected() throws Exception {
        send(post("/api/v1/auth/register"), null,
                obj().put("name", "Weak").put("email", "weak@example.com").put("password", "abcdefgh"), 400);
    }

    @Test
    @Order(3)
    void authRules() throws Exception {
        send(get("/api/v1/bookings/my"), null, null, 401);
        send(get("/api/v1/parking"), null, null, 200); // public catalogue
        send(get("/api/v1/admin/dashboard"), tokenOf("manager@smartparking.com", "Manager@123"), null, 403);
        send(get("/api/v1/manager/facility"), tokenOf("user@smartparking.com", "User@123"), null, 403);
        send(post("/api/v1/auth/login"), null, obj().put("email", "user@smartparking.com").put("password", "wrong"), 401);

        JsonNode admin = login("admin@smartparking.com", "Admin@123");
        send(get("/api/v1/admin/dashboard"), admin.get("token").asText(), null, 200);
        // a refresh token must not work as an access token
        send(get("/api/v1/auth/me"), admin.get("refreshToken").asText(), null, 401);
        // ...but it can be exchanged for a new pair
        JsonNode refreshed = send(post("/api/v1/auth/refresh"), null, obj().put("refreshToken", admin.get("refreshToken").asText()), 200).get("data");
        send(get("/api/v1/auth/me"), refreshed.get("token").asText(), null, 200);
        // an access token is not a refresh token
        send(post("/api/v1/auth/refresh"), null, obj().put("refreshToken", admin.get("token").asText()), 401);
    }

    @Test
    @Order(4)
    void devToolingIsNotExposed() throws Exception {
        mvc.perform(get("/h2-console/")).andExpect(result ->
                assertTrue(result.getResponse().getStatus() == 401 || result.getResponse().getStatus() == 403
                        || result.getResponse().getStatus() == 404, "h2 console must not be reachable"));
        mvc.perform(get("/swagger-ui.html")).andExpect(result ->
                assertNotEquals(200, result.getResponse().getStatus(), "swagger is off unless enabled"));
    }

    @Test
    @Order(5)
    void bookingMustBePaidBeforeTicketIsIssuedAndGateRespectsScope() throws Exception {
        String user = tokenOf("user@smartparking.com", "User@123");
        long slot = carSlot(1, 3);
        LocalDateTime start = now().plusMinutes(5); // inside the 15 min early-entry grace

        JsonNode booking = send(post("/api/v1/bookings"), user, bookingBody(1, slot, start, 2), 200).get("data");
        long bookingId = booking.get("id").asLong();
        assertEquals("PENDING_PAYMENT", booking.get("status").asText());
        assertTrue(booking.get("qrToken") == null || booking.get("qrToken").isNull(), "no ticket before payment");
        assertNotNull(booking.get("holdExpiresAt"));

        // The slot is held: another user cannot take it
        send(post("/api/v1/bookings"), registerFreshUser(), bookingBody(1, slot, start, 1), 409);

        // Declined card: booking stays unpaid and can be retried
        JsonNode order = send(post("/api/v1/payments/create-order"), user,
                obj().put("bookingId", bookingId).put("paymentMethod", "CARD"), 200).get("data");
        JsonNode declined = send(post("/api/v1/payments/confirm"), user,
                obj().put("transactionId", order.get("transactionId").asText()).put("instrument", "4000000000000002"), 200).get("data");
        assertEquals("FAILED", declined.get("paymentStatus").asText());
        assertEquals("PENDING_PAYMENT", send(get("/api/v1/bookings/" + bookingId), user, null, 200).get("data").get("status").asText());

        // Someone else cannot pay for my booking
        send(post("/api/v1/payments/create-order"), registerFreshUser(),
                obj().put("bookingId", bookingId).put("paymentMethod", "UPI"), 403);

        // Retry with a good card
        JsonNode retry = send(post("/api/v1/payments/create-order"), user,
                obj().put("bookingId", bookingId).put("paymentMethod", "CARD"), 200).get("data");
        assertNotEquals(order.get("transactionId").asText(), retry.get("transactionId").asText());
        JsonNode paid = send(post("/api/v1/payments/confirm"), user,
                obj().put("transactionId", retry.get("transactionId").asText()).put("instrument", "4242424242424242"), 200).get("data");
        assertEquals("COMPLETED", paid.get("paymentStatus").asText());

        JsonNode confirmed = send(get("/api/v1/bookings/" + bookingId), user, null, 200).get("data");
        assertEquals("CONFIRMED", confirmed.get("status").asText());
        String qr = confirmed.get("qrToken").asText();
        assertFalse(qr.isBlank());

        // Another customer cannot read my ticket
        send(get("/api/v1/bookings/" + bookingId), registerFreshUser(), null, 403);

        // Gate: the manager of ANOTHER facility is refused, the right manager is allowed
        String wrongManager = tokenOf("manager2@smartparking.com", "Manager@123");
        String rightManager = tokenOf("manager@smartparking.com", "Manager@123");
        send(post("/api/v1/manager/verify-ticket"), wrongManager, obj().put("qrToken", qr), 403);
        send(post("/api/v1/manager/gate-entry"), wrongManager, obj().put("qrToken", qr), 403);

        JsonNode entry = send(post("/api/v1/manager/gate-entry"), rightManager, obj().put("qrToken", qr), 200).get("data");
        assertEquals("ACTIVE", entry.get("sessionStatus").asText());
        send(post("/api/v1/manager/gate-entry"), rightManager, obj().put("qrToken", qr), 400); // duplicate scan

        // Cannot cancel once the vehicle is inside
        send(post("/api/v1/bookings/" + bookingId + "/cancel"), user, null, 400);

        // A manager cannot take an occupied bay out of service
        send(patch("/api/v1/manager/slots/" + slot + "/status"), rightManager, obj().put("status", "OUT_OF_SERVICE"), 400);

        JsonNode exit = send(post("/api/v1/manager/gate-exit"), rightManager, obj().put("qrToken", qr), 200).get("data");
        assertNotNull(exit.get("exitTime"));
        assertEquals("COMPLETED", send(get("/api/v1/bookings/" + bookingId), user, null, 200).get("data").get("status").asText());

        // Manager flips the bay out of service and back
        send(patch("/api/v1/manager/slots/" + slot + "/status"), rightManager, obj().put("status", "OUT_OF_SERVICE"), 200);
        send(patch("/api/v1/manager/slots/" + slot + "/status"), rightManager, obj().put("status", "AVAILABLE"), 200);
        send(patch("/api/v1/manager/slots/" + slot + "/status"), rightManager, obj().put("status", "RESERVED"), 400);
    }

    @Test
    @Order(6)
    void ticketIsNotValidDaysBeforeItsWindow() throws Exception {
        String user = tokenOf("user@smartparking.com", "User@123");
        long slot = carSlot(1, 4);
        JsonNode booking = send(post("/api/v1/bookings"), user, bookingBody(1, slot, now().plusDays(2), 2), 200).get("data");
        JsonNode order = send(post("/api/v1/payments/create-order"), user,
                obj().put("bookingId", booking.get("id").asLong()).put("paymentMethod", "UPI"), 200).get("data");
        send(post("/api/v1/payments/confirm"), user,
                obj().put("transactionId", order.get("transactionId").asText()).put("instrument", "someone@upi"), 200);
        String qr = send(get("/api/v1/bookings/" + booking.get("id").asLong()), user, null, 200).get("data").get("qrToken").asText();

        JsonNode verify = send(post("/api/v1/manager/verify-ticket"), tokenOf("manager@smartparking.com", "Manager@123"),
                obj().put("qrToken", qr), 200).get("data");
        assertFalse(verify.get("valid").asBoolean());
        send(post("/api/v1/manager/gate-entry"), tokenOf("manager@smartparking.com", "Manager@123"), obj().put("qrToken", qr), 400);

        // Cancelling well ahead refunds
        JsonNode cancelled = send(post("/api/v1/bookings/" + booking.get("id").asLong() + "/cancel"), user, null, 200).get("data");
        assertEquals("CANCELLED", cancelled.get("status").asText());
    }

    @Test
    @Order(7)
    void disabledUserLosesAccessImmediately() throws Exception {
        String email = "it-disable-" + UUID.randomUUID().toString().substring(0, 6) + "@example.com";
        JsonNode reg = send(post("/api/v1/auth/register"), null,
                obj().put("name", "To Disable").put("email", email).put("password", "Passw0rd1"), 200).get("data");
        String token = reg.get("token").asText();
        long userId = reg.get("id").asLong();
        send(get("/api/v1/bookings/my"), token, null, 200);

        String admin = tokenOf("admin@smartparking.com", "Admin@123");
        send(patch("/api/v1/admin/users/" + userId + "/toggle-status"), admin, null, 200);

        send(get("/api/v1/bookings/my"), token, null, 401);
        send(post("/api/v1/auth/login"), null, obj().put("email", email).put("password", "Passw0rd1"), 403);
    }

    @Test
    @Order(8)
    void adminCanCreateStaffButCannotDemoteSelf() throws Exception {
        String admin = tokenOf("admin@smartparking.com", "Admin@123");
        long adminId = login("admin@smartparking.com", "Admin@123").get("id").asLong();
        String email = "staff-" + UUID.randomUUID().toString().substring(0, 6) + "@example.com";

        JsonNode created = send(post("/api/v1/admin/users"), admin,
                obj().put("name", "New Manager").put("email", email).put("password", "Passw0rd1").put("role", "ROLE_PARKING_MANAGER"),
                200).get("data");
        assertEquals("ROLE_PARKING_MANAGER", created.get("role").asText());

        send(patch("/api/v1/admin/users/" + adminId + "/role"), admin, obj().put("role", "ROLE_USER"), 400);
        send(patch("/api/v1/admin/users/" + adminId + "/toggle-status"), admin, null, 400);
        send(patch("/api/v1/admin/users/" + adminId + "/role"), admin, obj().put("role", "NOT_A_ROLE"), 400);
    }

    @Test
    @Order(9)
    void unassignedManagerSeesNoFacility() throws Exception {
        String admin = tokenOf("admin@smartparking.com", "Admin@123");
        String email = "lonely-" + UUID.randomUUID().toString().substring(0, 6) + "@example.com";
        send(post("/api/v1/admin/users"), admin,
                obj().put("name", "Unassigned").put("email", email).put("password", "Passw0rd1").put("role", "ROLE_PARKING_MANAGER"), 200);

        send(get("/api/v1/manager/facility"), tokenOf(email, "Passw0rd1"), null, 403);
    }

    @Test
    @Order(10)
    void concurrentBookingsOfOneSlotYieldExactlyOneWinner() throws Exception {
        int contenders = 8;
        long slot = carSlot(2, 0);
        LocalDateTime start = now().plusHours(6);

        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < contenders; i++) {
            tokens.add(registerFreshUser());
        }

        ExecutorService pool = Executors.newFixedThreadPool(contenders);
        CountDownLatch ready = new CountDownLatch(contenders);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();
        for (String token : tokens) {
            results.add(pool.submit(() -> {
                ready.countDown();
                go.await();
                MockHttpServletRequestBuilder req = post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(bookingBody(2, slot, start, 2)));
                return mvc.perform(req).andReturn().getResponse().getStatus();
            }));
        }
        ready.await();
        go.countDown();

        int ok = 0;
        int conflict = 0;
        for (Future<Integer> f : results) {
            int status = f.get();
            if (status == 200) ok++;
            else if (status == 409) conflict++;
            else fail("unexpected status " + status);
        }
        pool.shutdown();

        assertEquals(1, ok, "exactly one booking may win the slot");
        assertEquals(contenders - 1, conflict);
    }

    @Test
    @Order(11)
    void dashboardAndListingsWork() throws Exception {
        String admin = tokenOf("admin@smartparking.com", "Admin@123");
        JsonNode stats = send(get("/api/v1/admin/dashboard"), admin, null, 200).get("data");
        assertTrue(stats.get("totalSlots").asLong() > 0);
        assertEquals(7, stats.get("revenueTrend").size());
        assertTrue(stats.get("availableSlots").asLong() <= stats.get("totalSlots").asLong());
        send(get("/api/v1/admin/bookings"), admin, null, 200);
        send(get("/api/v1/admin/audit-logs"), admin, null, 200);
        send(get("/api/v1/admin/locations"), admin, null, 200);
        JsonNode catalogue = send(get("/api/v1/parking"), null, null, 200).get("data");
        assertTrue(catalogue.size() >= 6);
    }
}
