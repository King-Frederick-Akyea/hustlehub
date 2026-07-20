# HustleHub

A campus "get stuff done / earn money / rent & barter" app for students. A student can post a task
(grocery run, laundry, queue-standing, document submission, delivery, tutoring, etc.), other
students bid on it, get accepted, complete it, and get paid out of an in-app wallet. The same users
can also list items/services for rent or barter, and chat with each other in-app.

The system has two halves that live in this one repo:

- **`frontend/`** — an Expo (React Native) app: the mobile client students use.
- **`services/`** — seven independently-deployable Spring Boot microservices plus one shared
  library module, fronted by a lightweight gateway.

---

## 1. Project structure

```
hustlehub/
├── start-all.ps1              # Launches all 7 backend services, one per PowerShell window
├── frontend/                  # Expo / React Native app
│   ├── App.tsx, index.tsx     # App entry points
│   ├── app.json               # Expo config (icons, plugins, scheme)
│   ├── .env.example           # Template for local env vars (copy -> .env.local)
│   └── src/
│       ├── api/                # Axios client (client.ts), typed error parsing (errors.ts)
│       ├── components/         # Shared presentational components (Button, Card, Header, Avatar, ...)
│       ├── constants/          # colors, spacing, typography, task/rental category lists
│       ├── context/            # AuthContext (session/user), RoleContext (poster/tasker switch)
│       ├── hooks/               # usePushNotifications, useUserLocation
│       ├── navigation/          # Stack/Tab navigators + navigation/types.ts (typed route params)
│       ├── screens/
│       │   ├── onboarding/      # First-run carousel
│       │   ├── auth/            # Welcome, Login, Register, email/ID/face verification, password reset
│       │   └── main/            # Home, Tasks, Task details, Active task, Messages, Wallet, Rentals, Profile, ...
│       ├── services/            # One file per backend domain (taskService, walletService, messageService, ...)
│       └── utils/               # Formatting/display helpers shared across screens
└── services/
    ├── pom.xml                 # Build-only Maven "reactor" (mvn clean install here builds everything)
    ├── .env.properties.example # Template for shared DB/JWT/internal-key config (copy -> .env.properties)
    ├── common/                 # Shared library: JWT validation, error format, inter-service HTTP clients
    ├── gateway-service/         # Reverse proxy — the only backend host the app talks to (port 8080)
    ├── identity-service/        # Auth, users, student verification (port 8181)
    ├── tasks-service/           # Tasks + bids + bookmarks + status updates (port 8182)
    ├── messaging-service/       # Conversations + messages (port 8183)
    ├── notifications-service/   # Push notifications + device tokens (port 8184)
    ├── payments-service/        # Wallet, top-ups/withdrawals, escrow, Paystack webhooks (port 8185)
    └── rentals-service/         # Rental/barter listings + offers (port 8186)
```

### How the backend fits together

```
                         ┌─────────────────────┐
   Expo app  ───────────▶│  gateway-service      │  :8080  (routes by URL prefix, no auth logic of its own)
                         └──────────┬───────────┘
                                    │
        ┌───────────────┬──────────┼───────────────┬───────────────┬────────────────┐
        ▼               ▼          ▼               ▼               ▼                ▼
 identity-service  tasks-service  messaging-service notifications  payments-service rentals-service
     :8181            :8182          :8183         -service:8184      :8185           :8186
        │               │              │                │               │                │
        └───────────────┴──────────────┴────────────────┴───────────────┴────────────────┘
                              each owns its own Postgres database
                   (hustlehub_identity / _tasks / _messaging / _notifications / _payments / _rentals)
```

- **No shared database.** Every service owns its own schema (Flyway-managed migrations under
  `src/main/resources/db/migration`) and only talks to other services over HTTP, never by
  reaching into another service's tables.
- **Auth is stateless and shared.** `identity-service` issues JWTs. Every other service validates
  that same JWT locally (via `common`'s `JwtAuthenticationFilter`) using an identical
  `app.jwt.secret` — it never calls back into identity-service to check a token. This is why
  **the JWT secret must be byte-for-byte identical across all six business services.**
- **Service-to-service calls** (e.g. tasks-service asking identity-service for a user's display
  name, or escrow holds against payments-service) go through `/internal/**` endpoints, protected
  by a second shared secret, `app.internal.key`, sent as the `X-Internal-Key` header. This also
  must be identical across all six services.
- **`common`** is a plain shared library (not a runnable service). It supplies the JWT filter,
  the standard error response shape, and typed HTTP clients (`UserServiceClient`,
  `PaymentsServiceClient`, `NotificationsServiceClient`) so no service hand-rolls its own HTTP
  calls to another.

### Gateway route table

| Path prefix | Routed to |
|---|---|
| `/api/auth`, `/api/users`, `/api/verification` | identity-service |
| `/api/tasks`, `/api/bids` | tasks-service |
| `/api/conversations` | messaging-service |
| `/api/notifications` | notifications-service |
| `/api/payments` | payments-service |
| `/api/listings`, `/api/offers` | rentals-service |

---

## 2. Prerequisites

| Tool | Version used in this repo | Notes |
|---|---|---|
| Java (JDK) | 17+ (25 confirmed working) | `java -version` |
| PostgreSQL | 17 (any recent 14+ works) | Must be running on `localhost:5432` |
| Node.js | 18+ | for the Expo app |
| Maven | *none needed globally* | every service ships its own `mvnw`/`mvnw.cmd` wrapper |
| Expo CLI | *none needed globally* | `npx expo` uses the project's local `expo` package |

You do **not** need Docker or a globally-installed Maven — everything below uses the checked-in
Maven wrapper (`./mvnw` / `mvnw.cmd`) and a local Postgres instance.

---

## 3. First-time setup

### 3.1 Database

Create one database per service (all owned by the same Postgres role, e.g. `postgres`):

```sql
CREATE DATABASE hustlehub_identity;
CREATE DATABASE hustlehub_tasks;
CREATE DATABASE hustlehub_messaging;
CREATE DATABASE hustlehub_notifications;
CREATE DATABASE hustlehub_payments;
CREATE DATABASE hustlehub_rentals;
```

Each service runs its own Flyway migrations automatically on first boot — you never run SQL
files by hand.

### 3.2 Backend secrets

Four values — Postgres host/port/user/password, JWT secret, and internal API key — are read from
environment variables **with no default** (on purpose — so a real secret never accidentally ships
baked into a committed file), and are the same across every service. Rather than copy them into
six separate per-service files, they live in **one shared file**: `services/.env.properties`,
which every service's `application.properties` imports via `spring.config.import`. It's
gitignored — create it once from the checked-in template:

```powershell
# From services/
Copy-Item .env.properties.example .env.properties
```

Then edit `services/.env.properties` and fill in:

- `DB_PASSWORD` — your local Postgres password.
- `JWT_SECRET` — any random base64 string. Generate one with:
  ```powershell
  [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
  ```
- `INTERNAL_API_KEY` — same idea, any random string.

That's it for **tasks-service, messaging-service, notifications-service, and rentals-service** —
they need nothing else. **identity-service** and **payments-service** each additionally have their
own small `application-dev.properties` (same copy-from-`.example` pattern, in that service's own
`src/main/resources/`) for the one or two things that are genuinely specific to them, not shared:

- `identity-service/application-dev.properties` — outgoing email. Leave `app.mail.provider=logging`
  (the default — just prints codes to the console) unless you have a real Brevo API key; with
  `app.mail.dev-echo-enabled=true`, OTP/reset codes are also echoed straight back in the API
  response, so you can test signup/verification without a real mailbox either way.
- `payments-service/application-dev.properties` — `app.paystack.secret-key`, a Paystack **test-mode**
  secret key from your Paystack dashboard. Leave it out and the service still boots fine; wallet
  top-up/withdraw specifically will 500 without it.

`gateway-service` needs no secrets at all — it's a pure proxy.

> **This is the single most common reason a service "won't start" or "used to work and now
> doesn't":** a missing `services/.env.properties`, or someone editing one service's copy of these
> values independently instead of the shared file (they must be byte-for-byte identical across
> every service — see §6 for the exact symptoms). Since the file is shared, there's now only one
> place this can go wrong instead of six.

### 3.3 Frontend environment

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local` and set `EXPO_PUBLIC_API_URL` to the gateway's address:

- **Android emulator only:** `http://10.0.2.2:8080`
- **Physical phone (Expo Go) or iOS simulator:** your dev machine's LAN IP, e.g.
  `http://192.168.0.108:8080` (find it with `ipconfig`; phone and PC must be on the same Wi-Fi).
  `localhost` will **not** work from a physical device — it resolves to the phone itself.

---

## 4. Running everything

### 4.1 Backend — all services at once

From the repo root:

```powershell
./start-all.ps1
```

This opens one PowerShell window per service (identity, tasks, messaging, notifications,
payments, rentals, gateway — in that order), each running `./mvnw.cmd spring-boot:run`. Each
service takes ~15–30s to finish booting (Flyway migration + JPA startup). Close a window, or
`Ctrl+C` inside it, to stop just that service without touching the others.

### 4.2 Backend — one service at a time

```powershell
cd services/identity-service
./mvnw.cmd spring-boot:run
```

Repeat per service directory. Useful when you only touched one service and don't want to restart
everything.

### 4.3 Ports reference

| Service | Port | Depends on DB |
|---|---|---|
| gateway-service | 8080 | — |
| identity-service | 8181 | hustlehub_identity |
| tasks-service | 8182 | hustlehub_tasks |
| messaging-service | 8183 | hustlehub_messaging |
| notifications-service | 8184 | hustlehub_notifications |
| payments-service | 8185 | hustlehub_payments |
| rentals-service | 8186 | hustlehub_rentals |

(Ports intentionally skip 8081–8084 — Expo/Metro's dev bundler claims 8081 by default and falls
back to 8082+ if that's taken, so the whole 808x range under 8080 stays reserved for frontend
tooling, not backend services.)

### 4.4 Frontend

```powershell
cd frontend
npx expo start
```

Scan the QR code with Expo Go (physical device) or press `a`/`i` for an emulator/simulator. If you
change `.env.local`, restart with a cleared cache: `npx expo start -c`.

### 4.5 Quick health check

Once the gateway and at least one backend service are up:

```powershell
curl http://localhost:8080/health
curl http://localhost:8080/api/auth/register -X POST -H "Content-Type: application/json" `
  -d '{"fullName":"Test User","email":"test@st.example.edu","password":"Test1234!","role":"tasker"}'
```

A successful register call returns an `accessToken`/`refreshToken`/`user` JSON body — if you get
that, the gateway, identity-service, JWT signing, and Postgres write path are all working
end-to-end.

---

## 5. Type checking the frontend

```powershell
cd frontend
npx tsc --noEmit
```

This project's `tsconfig.json` has `"noImplicitAny": true`. Every screen's `navigation`/`route`
props are typed via `frontend/src/navigation/types.ts`, which exports one flattened
`RootStackParamList` covering every route across every navigator (root stack, auth stack,
verification stack, main stack, and main tab bar). It's flattened on purpose: several screens
navigate across navigator boundaries (e.g. a Home tab screen pushing the stack-only `Notifications`
route), so per-navigator param lists would fight each other. When adding a new screen:

```tsx
import type { ScreenProps } from '../../navigation/types';

const MyScreen = ({ navigation, route }: ScreenProps<'MyRouteName'>) => { ... };
```

...and add `MyRouteName: undefined` (or `{ someParam: string }` if it takes params) to
`RootStackParamList` in `navigation/types.ts`. Also register the same name as a `<Stack.Screen name="MyRouteName">` in whichever navigator renders it.

---

## 6. Troubleshooting / common runtime errors

### Backend

**`Could not resolve placeholder 'DB_PASSWORD' / 'JWT_SECRET' / 'INTERNAL_API_KEY'` at startup**
(`org.springframework.boot.context.properties.bind....` or a Flyway/HikariCP failure right after
the banner) — you're missing `services/.env.properties`. Fix: see §3.2.

**One service returns 401/403 on requests carrying a token another service issued** — shouldn't
happen anymore now that the secrets live in one shared `services/.env.properties`, but if you ever
see it: something is overriding `JWT_SECRET`/`INTERNAL_API_KEY` for just one service (an env var set
in that specific terminal, a stray line re-added to that service's own `application-dev.properties`,
etc.) — all six business services must resolve to the exact same two values.

**`Connection to localhost:5432 refused`** — Postgres isn't running. On Windows: `Get-Service
postgresql*` to check, `Start-Service postgresql-x64-17` (adjust version) to start it.

**`FATAL: database "hustlehub_xxx" does not exist`** — you skipped §3.1; create the missing
database.

**`Validate failed: Migration checksum mismatch` (Flyway)** — someone edited an already-applied
migration file. Never edit a migration that's already run against your local DB; add a new
`V{n}__description.sql` instead. If it's your own throwaway local DB, the fastest fix is dropping
and recreating that one database and letting Flyway re-run from scratch.

**`Address already in use` on 8080–8186** — a previous run is still alive. Find and stop it:
```powershell
Get-Process java | Select-Object Id,StartTime
Stop-Process -Id <id>
```
or just close the leftover PowerShell window `start-all.ps1` opened for it.

**500 on a Paystack-backed wallet endpoint** — `app.paystack.secret-key` is blank/invalid in
`payments-service`'s `application-dev.properties`. Use a Paystack test-mode secret key, or expect
top-up/withdraw specifically (not the rest of the wallet API) to fail without one.

### Frontend

**Red screen: `EXPO_PUBLIC_API_URL is not set`** — create `frontend/.env.local` from
`.env.example` (§3.3) and restart Metro with `npx expo start -c` (env vars are read at bundle
time, so a plain reload isn't enough after changing `.env.local`).

**App loads but every request times out / network error, only on a physical phone** — you're
using `localhost` in `.env.local`. Switch to your PC's LAN IP (Android emulator: `10.0.2.2`
instead). Also confirm phone and PC are on the same Wi-Fi network, and allow the Java process
through Windows Firewall on the "Private networks" prompt the first time you start the backend.

**`Binding element 'navigation' implicitly has an 'any' type` (ts(7031)) on a new screen** — the
screen's props aren't typed yet. See §5 — add the route to `RootStackParamList` and type the
component with `ScreenProps<'YourRouteName'>`.

**Metro bundler port conflicts with something else on 8081** — Expo automatically falls back to
8082+; check the terminal output for the actual URL/QR it's serving from.

---

## 7. Notable dev-only behavior

- `identity-service`: with `app.mail.dev-echo-enabled=true`, email verification codes and password
  reset tokens are echoed back directly in the API response (`devToken`/similar fields) instead of
  only being emailed — this is what lets `ResetPasswordScreen` pre-fill a token in dev without a
  working mail provider. Never enable this in a real deployment.
- `identity-service` defaults `app.mail.provider` to `logging`, which just prints codes to the
  console instead of sending real email — fine for local dev, not for production. Set it to
  `brevo` (plus `app.mail.brevo.api-key`/`app.mail.from-address`) to send real email through
  Brevo's transactional email API instead.
- `payments-service`'s Paystack integration runs in **test mode** off a `sk_test_...` secret key —
  no real money moves. Top-up/withdraw call out to Paystack's test API; everything else in the
  wallet (balance, transaction history, task/rental escrow hold-and-release) works with no
  Paystack key at all, since escrow is internal ledger bookkeeping in `wallet_transactions`, not a
  Paystack call.
- Every service's Flyway config sets `spring.flyway.baseline-on-migrate=true` with a specific
  baseline version — this exists so a database that already has some tables from an earlier
  version of the schema won't make Flyway try (and fail) to recreate them; it has no effect once a
  service's `flyway_schema_history` table already exists.

## 8. Business rules worth knowing

A few authorization/workflow decisions that aren't obvious from the UI alone, for anyone extending
these flows:

- **Only the assigned tasker can mark a task complete** (`POST /api/tasks/{id}/complete`), not the
  poster. Completion releases the poster's held escrow to the tasker, so letting the poster
  trigger it unilaterally would let them release payment (or refuse to) without the tasker ever
  having signaled the work was actually done. The poster can still track progress via the task's
  status-update log and message the tasker; they just don't get a "Mark Complete" button.
- **A listing owner never sees their own listings in the public browse feed**
  (`GET /api/listings`) — `getActiveListings` explicitly excludes the current user's own listings,
  same as `GET /api/tasks` does for tasks. To see and manage what you've posted, use
  `GET /api/listings/mine` — in the app, that's the "Mine" tab on the Rentals & Barter screen. The
  same screen (`ListingDetailsScreen`) that shows offers/bids to a browsing user also shows an
  "Offers Received" panel with accept/reject actions when you're viewing your own listing.
- **`ListingResponse.offerCount`/`myOfferStatus`** (mirroring `TaskResponse.bidCount`/`myBidStatus`)
  are what let the frontend hide the "Rent"/"Offer" button once you already have a pending or
  accepted offer on a listing, and show how many offers an owner has received without opening each
  listing individually. A `rejected` `myOfferStatus` does **not** block making a new offer — same
  as a rejected bid doesn't block re-bidding on a task.
