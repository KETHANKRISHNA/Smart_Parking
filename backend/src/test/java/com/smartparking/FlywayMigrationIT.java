package com.smartparking;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Applies the Flyway baseline to a fresh database and lets Hibernate validate every entity mapping against
 * it. If an entity changes without a matching migration, this fails before it can break a deployment.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:flyway-check;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1",
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=validate",
        "app.seed.enabled=false"
})
@ActiveProfiles("test")
class FlywayMigrationIT {

    @Autowired
    private Flyway flyway;

    @Test
    void baselineMigrationMatchesTheEntityModel() {
        assertTrue(flyway.info().applied().length >= 1, "V1 baseline should have been applied");
    }
}
