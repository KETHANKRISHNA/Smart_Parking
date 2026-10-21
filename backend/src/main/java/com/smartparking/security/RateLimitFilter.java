package com.smartparking.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartparking.dto.common.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Throttles credential endpoints per client IP (fixed one-minute window) to slow down password guessing
 * and mass sign-ups. In-memory, so it is per instance: fine for a single service, not a distributed limiter.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> PROTECTED_PATHS =
            Set.of("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh");
    private static final long WINDOW_MS = 60_000;

    private record Window(long startedAt, AtomicInteger count) {}

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final int limitPerMinute;

    public RateLimitFilter(ObjectMapper objectMapper,
                           @Value("${app.rate-limit.auth-per-minute:20}") int limitPerMinute) {
        this.objectMapper = objectMapper;
        this.limitPerMinute = limitPerMinute;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !HttpMethod.POST.matches(request.getMethod()) || !PROTECTED_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        String key = request.getRemoteAddr() + "|" + request.getRequestURI();
        Window window = windows.compute(key, (k, existing) ->
                existing == null || now - existing.startedAt() >= WINDOW_MS ? new Window(now, new AtomicInteger()) : existing);

        if (window.count().incrementAndGet() > limitPerMinute) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(Math.max(1, (WINDOW_MS - (now - window.startedAt())) / 1000)));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.error("Too many attempts. Please wait a minute and try again.")));
            return;
        }
        chain.doFilter(request, response);
    }

    @Scheduled(fixedDelay = 300_000)
    void evictStaleWindows() {
        long now = System.currentTimeMillis();
        windows.values().removeIf(w -> now - w.startedAt() >= WINDOW_MS);
    }
}
