# SmartPark: Smart Parking Management System

Find a parking facility, pick a bay, pay, and walk in with a QR ticket. Facility managers scan tickets at the gate; administrators run the whole network.

**Spring Boot 3 (Java 21) REST API + React 19 single-page app.** The build produces one runnable Spring Boot jar that serves both, and the same React build can be hosted on Vercel in front of a separately hosted API.

## Features

| Role | What they can do |
|---|---|
| **Driver** (customer) | Search facilities on a map or list (by name, city, category, price, availability) · see live bay availability for the chosen time window · reserve a bay (the server calculates the price) · pay within a 15 minute hold · get a QR ticket · cancel (full refund up to 1 hour before the start) · notifications |
| **Facility manager** | Live bay board for their own facility · take bays out of service / return them · scan QR tickets at the gate (entry within the booked window, exit with overstay fee calculation) · today's reservations |
| **Administrator** | Dashboard (revenue, occupancy, vehicle mix, top facilities, 7 day trend) · create/edit facilities and bays · assign managers · create staff accounts, change roles, disable users · all bookings · audit trail |

## Tech stack

| Layer | Technology |
|---|---|
| API | Spring Boot 3.3.4, Spring Web, Spring Security (stateless JWT access + refresh tokens), Spring Data JPA / Hibernate, Bean Validation, springdoc OpenAPI, ZXing (QR), Actuator (health) |
| Database | PostgreSQL in production with **Flyway** migrations · H2 (file) for local development · H2 in-memory for tests |
| Front end | React 19, Vite 8, React Router 7, Tailwind CSS 3, axios, Recharts, Leaflet, html5-qrcode |
| Quality | JUnit 5 + Mockito + `@SpringBootTest` (29 tests, including a concurrent double-booking test) · Vitest + Testing Library (29 tests) · oxlint · GitHub Actions CI |
| Deployment | Multi-stage `Dockerfile` · `render.yaml` (API + Postgres on Render) · `frontend/vercel.json` (Vercel) |

## How it fits together

```
 Browser ──► Vercel (static React build)  ── /api/* rewrite ──►  Render: Spring Boot jar ──► PostgreSQL
 Browser ──► single Spring Boot jar (React bundled in /static) ───────────────────────────► H2 / PostgreSQL
```

Everything the browser calls is same-origin (`/api/v1/...`): in development Vite proxies it, on Vercel a rewrite proxies it, and in the jar the API and the app share a server. No CORS configuration is needed for any of these.

Backend packages (`backend/src/main/java/com/smartparking`): `controller` → `service` → `repository` → `entity`, with `dto`, `security` (JWT filter, rate limiting), `payment` (gateway abstraction), `scheduler` (hold expiry, no-shows), `config`, `exception`, `web` (SPA fallback).

## Run it locally

Requirements: JDK 21+ and Node 22+ (the Maven build downloads its own Node if you only use Maven).

**Option A: one jar, whole site (what you submit)**

```bash
cd backend
./mvnw package            # runs the tests, builds the React app, bundles it into the jar
java -jar target/smart-parking-backend-1.0.0.jar
# open http://localhost:8080
```

If a Vite dev server is running and `npm install` complains about locked files on Windows, build the front end yourself and skip that step: `cd frontend && npm run build`, then `./mvnw package -DskipFrontend` (the built `frontend/dist` is still bundled).

**Option B: development with hot reload**

```bash
cd backend && ./mvnw spring-boot:run      # API on :8080
cd frontend && npm install && npm run dev # app on :5173, /api proxied to :8080
```

The default `dev` profile needs no configuration: it creates a file-based H2 database in `backend/data/`, seeds demo data, and enables Swagger UI (`/swagger-ui.html`) and the H2 console (`/h2-console`, localhost only).

### Demo accounts (dev profile / `SEED_DEMO_DATA=true` only)

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@smartparking.com` | `Admin@123` |
| Facility manager | `manager@smartparking.com` | `Manager@123` |
| Facility manager | `manager2@smartparking.com` | `Manager@123` |
| Driver | `user@smartparking.com` | `User@123` |
| Driver | `kethan@smartparking.com` | `Kethan@123` |

These exist only when demo data is on. They are public knowledge, so never enable demo data on a deployment people rely on.

### Fill a running instance with realistic demo data

[`scripts/seed-demo-data.mjs`](scripts/seed-demo-data.mjs) populates any running SmartPark (local or hosted) through its admin API: 2 extra admins, 7 facility managers, 14 drivers, 13 facilities in Bangalore, Hyderabad, Mumbai and Delhi with photos and 286 bays, and about 19 sample bookings (paid, completed, currently parked, upcoming, cancelled). It needs Node 18+ and an existing admin account, and is safe to run twice (existing items are skipped).

```bash
node scripts/seed-demo-data.mjs --admin-email you@example.com --admin-password '...'
node scripts/seed-demo-data.mjs --base https://your-api.onrender.com --admin-email ... --admin-password ...
# add --no-bookings to skip the sample bookings
```

The seeded accounts share documented passwords (`Admin@2026`, `Manager@2026`, `User@2026`, with emails like `anita.rao@example.com`), so use it for development and presentations only. Facility photos live in `frontend/public/facilities/` and come from [Unsplash](https://unsplash.com) (free to use under the Unsplash License).

## Tests

```bash
cd backend  && ./mvnw verify            # 29 tests: unit, security matrix, payment/gate flow, concurrency, Flyway
cd frontend && npm run lint && npm test # 29 tests
```

The integration tests (`SmartParkingFlowIT`) run the real Spring context. They check, among other things, that registering with `"role":"ROLE_ADMIN"` still yields a customer, that one of eight simultaneous bookings of the same bay wins, that a manager cannot scan another facility's ticket, and that a disabled user's token stops working immediately.

## Configuration

Local development needs none. For production see [`backend/.env.example`](backend/.env.example); the important ones:

| Variable | Purpose |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` (default) or `prod` |
| `JWT_SECRET` | **Required in prod**, 32+ random characters. The app refuses to start without it |
| `DB_HOST`, `DB_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` (or `DATABASE_URL`) | PostgreSQL connection |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | Creates the first admin on an empty database |
| `SEED_DEMO_DATA` | `true` loads sample facilities and the demo accounts above |
| `PORT` | HTTP port (hosting platforms set it) |

## Booking lifecycle and rules

`PENDING_PAYMENT` (bay held for 15 minutes) → pay → `CONFIRMED` (QR issued) → gate entry → gate exit → `COMPLETED`. Unpaid holds become `EXPIRED`; unused confirmed bookings become `EXPIRED` (no-show) after their window; users can cancel while nothing has been scanned.

* The slot row is locked while a booking is created, so two people can never hold the same bay for overlapping times.
* The server prices every booking (half-hour rounding, one hour minimum, 30 minutes to 24 hours, up to 30 days ahead). A vehicle must fit the bay (bikes only in bike bays, and so on).
* A ticket is valid from 15 minutes before the start until the end of the booked window. Exiting late records an overstay fee, which the manager collects at the gate (it is not charged online).
* Payments go through a `PaymentGateway`. The bundled `MockPaymentGateway` behaves like a test-mode gateway: it approves everything except a card ending `0002` or a UPI id containing `fail`. **No real money moves.** To take real payments, implement `PaymentGateway` for Razorpay or Stripe.

## API

Interactive docs are at `/swagger-ui.html` when `SWAGGER_ENABLED=true` (always in dev). Base path `/api/v1`; responses are wrapped as `{ success, message, data, timestamp }`.

| Area | Endpoints |
|---|---|
| Auth (public) | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` |
| Auth (signed in) | `POST /auth/logout` · `GET /auth/me` |
| Catalogue (public) | `GET /parking` · `GET /parking/{id}` · `GET /parking/{id}/slots?startTime&endTime` · `GET /parking/{id}/availability` |
| Bookings | `POST /bookings` · `GET /bookings/my` · `GET /bookings/{id}` · `GET /bookings/ref/{ref}` · `POST /bookings/{id}/cancel` |
| Payments | `POST /payments/create-order` · `POST /payments/confirm` · `GET /payments/my` |
| Profile / notifications | `GET·PUT /users/profile` · `POST /users/change-password` · `GET /notifications` · `PATCH /notifications/{id}/read` · `POST /notifications/read-all` |
| Manager (manager or admin) | `GET /manager/facilities·facility·facility/slots` · `PATCH /manager/slots/{id}/status` · `GET /manager/today-bookings` · `POST /manager/verify-ticket·gate-entry·gate-exit` |
| Admin | `GET /admin/dashboard·bookings·users·audit-logs·locations` · `POST·PUT·DELETE /admin/locations` · `POST /admin/locations/{id}/assign-manager/{managerId}` · `POST·PUT·PATCH·DELETE /admin/slots` · `POST /admin/users` · `PATCH /admin/users/{id}/role·toggle-status` |

## Security notes

* Self-registration can only create customers. Staff accounts are created by an admin (`POST /admin/users`) or by `BOOTSTRAP_ADMIN_*`.
* Access tokens last 24 hours, refresh tokens 7 days; refresh tokens cannot be used as access tokens, and disabled users lose access immediately.
* Payment outcomes are decided by the server, never by the browser. QR tickets are issued only after payment and are checked against the manager's own facility.
* Login, registration and refresh are rate limited per IP (in memory, so per instance). Passwords: 8+ characters with a letter and a digit, hashed with BCrypt.
* Dev tooling (H2 console, Swagger, demo data) is off outside the dev profile. Error responses never include exception details.
* Tokens are kept in `localStorage`, which an XSS bug could read; the Vercel config therefore ships a strict Content-Security-Policy.

## Deploy

### 1. API + database on Render

1. Push the repository to GitHub.
2. Render → **New → Blueprint** → select the repository. `render.yaml` creates the Docker web service and a Postgres database and wires the connection variables.
3. In the service's **Environment** tab set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (and `SEED_DEMO_DATA=true` if you want sample data for a demo).
4. Open `https://<your-service>.onrender.com/` to see the whole site, and `/actuator/health` for status.

Free instances sleep when idle, so the first request after a pause can take about a minute. Render's free Postgres is time-limited; check its current terms or choose a paid plan.

### 2. Front end on Vercel

1. In [`frontend/vercel.json`](frontend/vercel.json) replace `https://smartparking-api.onrender.com` with your Render service URL (it appears once, in the `/api` rewrite).
2. Vercel → **Add New Project** → import the repository → set **Root Directory** to `frontend`. The framework preset (Vite) is detected from the config.
3. Deploy. No environment variables are needed: the app calls `/api/...` on its own domain and Vercel forwards it to Render.

Vercel hosts only the React build: it cannot run a Java server, which is why the API lives on Render.

## Project layout

```
backend/    Spring Boot API   (pom.xml, mvnw, src/main/java, src/main/resources/db/migration, tests)
frontend/   React app         (src/pages, components, context, services, utils, hooks; vercel.json)
Dockerfile  builds the jar with the app bundled     render.yaml  Render blueprint
.github/workflows/ci.yml   tests + lint + build + jar packaging
```

## Known limitations

* Payments are simulated (see above). Overstay fees are recorded, not charged online.
* Rate limiting and the notification feed are per instance / polling based (30 s), not distributed or push.
* Administrative lists (`bookings` up to 500, `audit-logs` 200 newest) are capped rather than paginated.
* The single-instance design assumes one API container; running several would need a shared rate limiter.
