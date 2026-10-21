package com.smartparking.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    private static final String TYPE_CLAIM = "type";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey secretKey;
    private final long expirationMs;
    private final long refreshExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs,
            @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET must be set to a random value of at least " + MIN_SECRET_BYTES + " characters");
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateToken(Authentication authentication) {
        return generateAccessToken((CustomUserDetails) authentication.getPrincipal());
    }

    public String generateAccessToken(CustomUserDetails user) {
        return build(user, TYPE_ACCESS, expirationMs);
    }

    public String generateRefreshToken(CustomUserDetails user) {
        return build(user, TYPE_REFRESH, refreshExpirationMs);
    }

    private String build(CustomUserDetails user, String type, long expiry) {
        Date now = new Date();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("id", user.getId())
                .claim("name", user.getName())
                .claim("role", user.getRole().name())
                .claim(TYPE_CLAIM, type)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiry))
                .signWith(secretKey)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return parse(token).getSubject();
    }

    /** True only for a valid, unexpired token of the access type (refresh tokens never authenticate API calls). */
    public boolean validateAccessToken(String token) {
        return validateType(token, TYPE_ACCESS);
    }

    public boolean validateRefreshToken(String token) {
        return validateType(token, TYPE_REFRESH);
    }

    private boolean validateType(String token, String expectedType) {
        try {
            return expectedType.equals(parse(token).get(TYPE_CLAIM, String.class));
        } catch (SecurityException | MalformedJwtException e) {
            logger.debug("Invalid JWT: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.debug("JWT expired: {}", e.getMessage());
        } catch (UnsupportedJwtException | IllegalArgumentException e) {
            logger.debug("JWT rejected: {}", e.getMessage());
        }
        return false;
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }
}
