# Smart Parking: one image containing the Spring Boot API and the built React app.
# Build:  docker build -t smartparking .
# Run:    docker run -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod -e JWT_SECRET=... smartparking   (see README for all variables)

# ---- 1. Build the React app ---------------------------------------------------------------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---- 2. Build the Spring Boot jar, bundling the app from step 1 ---------------------------
# Tests run in CI; -DskipFrontend because the frontend is already built, and the bundle-frontend
# Maven profile copies frontend/dist into the jar automatically when it exists.
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn -B -q -DskipFrontend dependency:go-offline
COPY backend/src ./src
COPY --from=frontend /app/frontend/dist /app/frontend/dist
RUN mvn -B -q -DskipTests -DskipFrontend package && cp target/smart-parking-backend-*.jar /app/app.jar

# ---- 3. Small runtime image ---------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
USER spring
WORKDIR /app
COPY --from=backend /app/app.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-8080}/actuator/health/liveness" > /dev/null || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
