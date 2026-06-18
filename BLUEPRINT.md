## What This Project Is

NutriDash is a food delivery web application that improves on platforms like Foodmandu and
Pathao Food by adding a layer of nutrition intelligence those apps completely lack.

Users browse restaurants, add items to a cart, and place orders exactly as they would on any
delivery app. The difference: every menu item displays its nutritional breakdown (calories,
protein, carbs, fat, fiber), and each meal gets a Health Score (0–100) calculated against the
user's personal health profile. Allergen warnings fire before checkout if an item conflicts with
the user's registered allergies. Low-scoring items trigger healthier alternative suggestions from
the same restaurant. A weekly nutrition dashboard shows intake trends over time.

Three user roles: **Customer**, **Restaurant Admin**, and **Super Admin**. Customers order food and track nutrition. Restaurant admins manage their own menu — items, prices, and nutrition data auto-fetched from Edamam API. Super admins have platform-wide control: they create and manage restaurant accounts, activate or suspend restaurants, and monitor all customers and orders across the system.

---

## Repository Structure

```
nutridash/
├── client/   # Next.js (App Router) + TypeScript — UI/UX ONLY, ZERO business logic
└── server/    # NestJS (Node.js + TypeScript) + Prisma + PostgreSQL + Redis — ALL logic lives here
```

---

## Tech Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Backend        | NestJS v10+ (Node.js + TypeScript), Node.js v24 LTS, TypeScript 5+         |
| Database       | PostgreSQL v15+ via Prisma v5+ ORM                                         |
| Cache          | Redis v7+ via Upstash (nutrition API response caching)                     |
| Frontend       | Next.js v16+ (App Router) + React 19 + TypeScript                          |
| Styling        | Tailwind CSS v3+                                                           |
| Charts         | Recharts (nutrition dashboard)                                             |
| State          | Zustand (UI state) + React Query (server state)                            |
| Auth           | JWT (access + refresh tokens) + bcrypt password hashing                    |
| Validation     | class-validator + class-transformer (backend) + Zod (frontend forms)       |
| Nutrition Data | Edamam Food Database API                                                   |
| Payment        | Stripe (test mode only)                                                    |
| Testing        | Jest + Supertest                                                           |
| Deployment     | Vercel (frontend) + Render (backend) + Neon (PostgreSQL) + Upstash (Redis) |
| CI/CD          | GitHub Actions — lint + test on every PR to `dev`                          |

> Next.js components are Server Components by default. Anything touching Zustand, React Query,
> or browser APIs needs an explicit `'use client'` directive at the top of the file.

---

## Architecture

### API Versioning

Every backend route is served under a global prefix: **`/api/v1`**. Set once in `main.ts` via
`app.setGlobalPrefix('api/v1')` — individual controllers stay unprefixed in code
(`@Controller('auth')`, not `@Controller('api/v1/auth')`). The API Endpoints table below lists
paths relative to that prefix, e.g. `POST /auth/register` actually resolves to
`POST /api/v1/auth/register`.

A future breaking change gets a new prefix (`/api/v2`) added alongside the old one rather than
mutating `/v1` routes in place — old clients keep working until they're migrated.

The frontend's `NEXT_PUBLIC_API_URL` env var should already include this prefix
(`http://localhost:3001/api/v1`), so application code calling `lib/api.ts` never has to repeat it.

### Layer Separation (CRITICAL — Never cross these boundaries)

| Layer      | Owns                                                               | Never owns                                       |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| Controller | Receives HTTP request, calls service, returns response             | Business logic, DB calls, score calculations     |
| Service    | ALL business logic — health scoring, allergen checks, suggestions  | Raw Prisma calls, Redis ops, external HTTP calls |
| Repository | All Prisma queries + Redis reads/writes, returns plain data        | Business logic, rule checks, response formatting |
| DTO        | Validates and transforms incoming request data via class-validator | Domain logic, DB queries, formatting             |

### Module Import Rules

- ✅ Any module can import from `common/`
- ⚠️ Module-to-module imports only when explicitly necessary
- ❌ No circular imports between modules
- ✅ Cross-module communication via NestJS EventEmitter only
- ❌ Frontend NEVER contains business logic — no health score calculations, no allergen logic,
  no price math. **This includes Next.js Server Components, Server Actions, and Route Handlers.**
  Even though they technically execute on a server, they are part of the frontend application —
  they may only call the backend API, never reimplement business logic or talk to Prisma /
  the database directly. If you find yourself writing a calculation inside `app/`, it belongs in
  the NestJS backend instead.

### Error Handling

- Services throw typed `HttpException` subclasses — NO try/catch in services or controllers
- One global `@Catch()` ExceptionFilter handles ALL errors — logs to console, formats response
- Registered in `main.ts`: `app.useGlobalFilters(new GlobalExceptionFilter())`
- NEVER expose: stack traces, SQL queries, passwords, or JWT tokens in error responses

### Shared Utilities — Zero Duplication

Logic used by more than one module lives in `backend/src/common/utils/` only. Never copy-paste.

- `nutrition.ts` — health score calculation, macro ratio helpers
- `allergen.ts` — allergen flag matching between item allergens and user profile
- `paginate.ts` — shared cursor-based and page-based pagination wrapper

---

## User Roles & Flows

### Customer

**Registration & onboarding:**

```
POST /auth/register → account created
        ↓
Redirect to /onboarding/health-profile
        ↓
Fill health profile: age, weight, height, goal (LOSE / MAINTAIN / GAIN),
  dietary restriction, allergens (multi-select), calorie target (auto-suggested)
        ↓
isOnboardingComplete = true → Home page (restaurant listing)
```

> All protected routes check `isOnboardingComplete`. If false, redirect to
> `/onboarding/health-profile`. No exceptions.

**Capabilities:**

- Browse restaurants, filter by cuisine or health rating
- View menu items with nutrition tags and allergen badges
- See a personalised Health Score (0–100) per item
- See allergen warnings before adding a conflicting item to cart
- Get up to 3 healthier alternatives when selecting an item scoring below 50
- Manage cart with live calorie + health score totals
- Checkout via Stripe (test mode)
- View order history with per-order nutritional summary
- View weekly nutrition dashboard — caloric intake, macro breakdown, health score trend

### Super Admin

- Created via seed script only — no registration endpoint, no self-service
- Single super admin account for MVP; role is not assignable through any API
- Has full read access across all users, restaurants, and orders
- Can create Restaurant Admin accounts (`POST /super-admin/restaurants` creates the restaurant + its admin user in one operation)
- Can activate or deactivate any restaurant (`PATCH /super-admin/restaurants/:id`)
- Can suspend or reinstate any customer account (`PATCH /super-admin/users/:id`)
- Can view all orders platform-wide with filters (by restaurant, status, date range)
- Does NOT place orders, has no health profile, skips onboarding entirely
- Super admin routes are grouped under `/super-admin` and protected by `SUPER_ADMIN` role guard
- Never appears in customer-facing restaurant listings or order flows

### Restaurant Admin

- Accounts are created by the Super Admin via `POST /super-admin/restaurants` — no self-service registration
- Can add, edit, and remove menu items for their own restaurant only
- On item creation: nutrition data is auto-fetched from Edamam API and cached in Redis
- On Edamam failure: item is still created, `nutritionStatus = FAILED`, ordering still works,
  health score shows "N/A", admin panel shows a retry button
- Cannot access any other restaurant's data

---

## Database Schema (Prisma)

```prisma
// ─── Enums ───────────────────────────────────────────────────────────────────

enum UserRole {
  CUSTOMER
  RESTAURANT_ADMIN
  SUPER_ADMIN
}

enum HealthGoal {
  LOSE
  MAINTAIN
  GAIN
}

enum DietaryRestriction {
  NONE
  VEGETARIAN
  VEGAN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
}

enum NutritionStatus {
  FETCHED   // Edamam returned data successfully
  PENDING   // Fetch not yet attempted
  FAILED    // Edamam returned error — item still orderable
}

// ─── Models ──────────────────────────────────────────────────────────────────

model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  passwordHash         String
  name                 String
  role                 UserRole  @default(CUSTOMER)
  isOnboardingComplete Boolean   @default(false)
  isSuspended          Boolean   @default(false)  // Set by Super Admin
  restaurantId         String?   // Restaurant admins only
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  healthProfile        HealthProfile?
  orders               Order[]
  nutritionLogs        NutritionLog[]   // ← added: was missing, NutritionLog.user needs this back-relation
  restaurant           Restaurant? @relation(fields: [restaurantId], references: [id])

  @@index([email])
  @@index([role])
}

model HealthProfile {
  id                 String             @id @default(cuid())
  userId             String             @unique
  age                Int
  weightKg           Float
  heightCm           Float
  goal               HealthGoal
  dietaryRestriction DietaryRestriction @default(NONE)
  allergens          String[]           // e.g. ["NUTS", "GLUTEN", "DAIRY", "SHELLFISH"]
  calorieTarget      Int                // Daily kcal target
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
}

model Restaurant {
  id           String   @id @default(cuid())
  name         String
  cuisine      String
  address      String
  imageUrl     String?
  healthRating Float    @default(0)  // 0–5, recalculated when menu changes
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  menuItems MenuItem[]
  orders    Order[]
  admins    User[]

  @@index([cuisine])
  @@index([isActive])
}

model MenuItem {
  id              String          @id @default(cuid())
  restaurantId    String
  name            String
  description     String?
  priceRs         Int             // Stored in paisa — display as Rs. at render time only
  category        String          // "Main" | "Snack" | "Drink" | "Dessert"
  imageUrl        String?
  isAvailable     Boolean         @default(true)
  nutritionStatus NutritionStatus @default(PENDING)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  restaurant Restaurant    @relation(fields: [restaurantId], references: [id])
  nutrition  NutritionInfo?
  orderItems OrderItem[]

  @@index([restaurantId])
  @@index([restaurantId, isAvailable])
  @@index([restaurantId, category])
}

model NutritionInfo {
  id          String   @id @default(cuid())
  menuItemId  String   @unique
  calories    Int      // kcal per serving
  proteinG    Float
  carbsG      Float
  fatG        Float
  fiberG      Float
  allergens   String[] // Sourced from Edamam
  servingSize String?  // e.g. "1 plate (350g)"
  fetchedAt   DateTime @default(now())

  menuItem MenuItem @relation(fields: [menuItemId], references: [id])
}

model Order {
  id              String      @id @default(cuid())
  userId          String
  restaurantId    String
  status          OrderStatus @default(PENDING)
  totalPriceRs    Int         // Paisa
  totalCalories   Int?        // Computed from items at order time
  healthScoreAvg  Int?        // Average health score across all items for this user
  stripePaymentId String?
  deliveryAddress String
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user         User          @relation(fields: [userId], references: [id])
  restaurant   Restaurant    @relation(fields: [restaurantId], references: [id])
  orderItems   OrderItem[]
  nutritionLog NutritionLog?

  @@index([userId, createdAt])
  @@index([status])
}

model OrderItem {
  id          String @id @default(cuid())
  orderId     String
  menuItemId  String
  quantity    Int
  unitPriceRs Int    // Paisa snapshot at time of order

  order    Order    @relation(fields: [orderId], references: [id])
  menuItem MenuItem @relation(fields: [menuItemId], references: [id])

  @@index([orderId])
}

model NutritionLog {
  id             String   @id @default(cuid())
  userId         String
  orderId        String   @unique
  logDate        DateTime // Date only — used for weekly aggregation
  totalCalories  Int
  totalProteinG  Float
  totalCarbsG    Float
  totalFatG      Float
  totalFiberG    Float
  healthScoreAvg Int

  user  User  @relation(fields: [userId], references: [id])
  order Order @relation(fields: [orderId], references: [id])

  @@index([userId, logDate])
}
```

---

## Health Score Algorithm

The Health Score (0–100) is calculated **per item per user** by `NutritionService`.
It is **never stored** — always computed fresh from the user's health profile and the item's nutrition data.

```typescript
// backend/src/common/utils/nutrition.ts
export function calculateHealthScore(
  nutrition: NutritionInfo,
  profile: HealthProfile,
): number {
  let score = 100;

  // 1. Calorie penalty — how much of the daily target does this item consume?
  const caloriePct = nutrition.calories / profile.calorieTarget;
  if (caloriePct > 0.5)
    score -= 30; // >50% of daily target in one item
  else if (caloriePct > 0.35) score -= 15;
  else if (caloriePct > 0.2) score -= 5;

  // 2. Macro balance penalty based on goal
  const totalMacros = nutrition.proteinG + nutrition.carbsG + nutrition.fatG;
  if (totalMacros > 0) {
    const proteinRatio = nutrition.proteinG / totalMacros;
    const fatRatio = nutrition.fatG / totalMacros;

    if (profile.goal === "LOSE") {
      if (fatRatio > 0.4) score -= 20;
      if (proteinRatio < 0.2) score -= 10;
    }
    if (profile.goal === "GAIN") {
      if (proteinRatio < 0.25) score -= 15;
    }
    if (profile.goal === "MAINTAIN") {
      if (fatRatio > 0.45) score -= 10;
    }
  }

  // 3. Fiber bonus
  if (nutrition.fiberG >= 5) score += 5;
  else if (nutrition.fiberG >= 3) score += 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}
```

> The same menu item may score 80 for a GAIN-goal user and 45 for a LOSE-goal user.
> Never cache or store the score per item globally. Only the raw Edamam nutrition data is cached.

---

## Allergen Logic

```typescript
// backend/src/common/utils/allergen.ts
export function getConflictingAllergens(
  itemAllergens: string[],
  userAllergens: string[],
): string[] {
  return itemAllergens.filter((a) => userAllergens.includes(a));
}
```

- If conflicts exist: frontend shows a warning badge on the item card and an advisory modal before "Add to Cart"
- Warning is **advisory, not blocking** — user can acknowledge and add anyway
- Allergen data sourced from `NutritionInfo.allergens` (Edamam), never from restaurant input

---

## Money — Paisa Rule (CRITICAL — NEVER BREAK)

```typescript
// ❌ WRONG — floating point causes display errors
const total = 125.5 * quantity;

// ✅ CORRECT — integer paisa in DB and all API communication
const priceInPaisa = 12550; // Rs. 125.50 → 12550 paisa
const total = priceInPaisa * quantity; // Always an exact integer
const display = (priceInPaisa / 100).toFixed(2); // Convert to Rs. ONLY at render time
```

All DB price columns store **integer paisa**. Never floats. Never rupees in the database.

---

## Edamam API Integration

**Trigger:** Restaurant admin creates a new menu item.

**Endpoint:** `GET https://api.edamam.com/api/food-database/v2/parser?ingr={name}&app_id={ID}&app_key={KEY}`

**Redis caching:**

- Key: `nutrition:item:{menuItemId}` — TTL: 30 days
- Cache hit → return cached data, skip Edamam call
- Cache miss → call Edamam, write to Redis, update `NutritionInfo` table

**Failure handling:**

- Edamam error or no results → `nutritionStatus = FAILED`, item still created and orderable
- Health score shows `null` (frontend renders "Score N/A")
- Admin panel shows a "Retry nutrition fetch" button → calls `POST /admin/menu-items/:id/refetch-nutrition`

---

## Error Codes

All error codes are defined in `backend/src/common/errors.ts`.
Every error response includes a `code` string field.
**Frontend must switch on `error.response.data.code` — not on HTTP status alone.**

```typescript
// frontend/src/lib/api.ts
axios.interceptors.response.use(null, (error) => {
  const code = error.response?.data?.code;
  switch (code) {
    case "ONBOARDING_INCOMPLETE": // redirect to /onboarding/health-profile
    case "ITEM_UNAVAILABLE": // item removed since cart was built — show toast
    case "STRIPE_PAYMENT_FAILED": // show payment failure message
    case "VALIDATION_ERROR": // show field-level errors
    case "UNAUTHORIZED": // redirect to /login
    case "FORBIDDEN": // show 403 page
    case "NOT_FOUND": // show 404 page
    default: // generic error toast
  }
});
```

| Code                    | HTTP | When                                                    |
| ----------------------- | ---- | ------------------------------------------------------- |
| `ONBOARDING_INCOMPLETE` | 403  | Customer accesses protected route before profile setup  |
| `ITEM_UNAVAILABLE`      | 400  | Cart item marked unavailable since cart was built       |
| `STRIPE_PAYMENT_FAILED` | 402  | Stripe test charge declined                             |
| `VALIDATION_ERROR`      | 400  | DTO validation failed                                   |
| `UNAUTHORIZED`          | 401  | Missing or invalid JWT                                  |
| `FORBIDDEN`             | 403  | Valid JWT but insufficient role                         |
| `NOT_FOUND`             | 404  | Resource not found                                      |
| `ACCOUNT_SUSPENDED`     | 403  | User account suspended by Super Admin                   |
| `INTERNAL_ERROR`        | 500  | Unexpected server error (logged, never exposed to user) |

---

## API Endpoints

> All paths below are relative to the global prefix `/api/v1` — e.g. `POST /auth/register`
> actually resolves to `POST /api/v1/auth/register`. See "API Versioning" under Architecture.

### Auth

| Method | Endpoint              | Auth   | Description                                    |
| ------ | --------------------- | ------ | ---------------------------------------------- |
| POST   | /auth/register        | Public | Customer registration                          |
| POST   | /auth/login           | Public | All roles — returns JWT access + refresh token |
| POST   | /auth/refresh         | Cookie | Rotate refresh token, return new access token  |
| POST   | /auth/logout          | JWT    | Invalidate tokens                              |
| PATCH  | /auth/change-password | JWT    | Change own password                            |

### Users

| Method | Endpoint                 | Auth     | Description                        |
| ------ | ------------------------ | -------- | ---------------------------------- |
| GET    | /users/me                | JWT      | Own profile                        |
| PATCH  | /users/me                | JWT      | Update name                        |
| GET    | /users/me/health-profile | CUSTOMER | Get health profile                 |
| POST   | /users/me/health-profile | CUSTOMER | Create health profile (onboarding) |
| PATCH  | /users/me/health-profile | CUSTOMER | Update health profile              |

### Restaurants

| Method | Endpoint              | Auth   | Description                                         |
| ------ | --------------------- | ------ | --------------------------------------------------- |
| GET    | /restaurants          | Public | All active restaurants — optional `?cuisine` filter |
| GET    | /restaurants/:id      | Public | Restaurant detail                                   |
| GET    | /restaurants/:id/menu | Public | Full menu with nutrition tags                       |

### Menu Items (Restaurant Admin only)

| Method | Endpoint                                | Auth             | Description                         |
| ------ | --------------------------------------- | ---------------- | ----------------------------------- |
| POST   | /admin/menu-items                       | RESTAURANT_ADMIN | Create item — triggers Edamam fetch |
| PATCH  | /admin/menu-items/:id                   | RESTAURANT_ADMIN | Edit item                           |
| DELETE | /admin/menu-items/:id                   | RESTAURANT_ADMIN | Remove item                         |
| POST   | /admin/menu-items/:id/refetch-nutrition | RESTAURANT_ADMIN | Retry failed Edamam fetch           |

### Nutrition

| Method | Endpoint                | Auth     | Description                                             |
| ------ | ----------------------- | -------- | ------------------------------------------------------- |
| GET    | /nutrition/score        | CUSTOMER | `?menuItemId=X` — health score for item vs user profile |
| GET    | /nutrition/alternatives | CUSTOMER | `?menuItemId=X` — up to 3 higher-scoring alternatives   |
| GET    | /nutrition/dashboard    | CUSTOMER | Weekly intake: calories, macros, health score trend     |

### Orders

| Method | Endpoint           | Auth     | Description                                  |
| ------ | ------------------ | -------- | -------------------------------------------- |
| POST   | /orders            | CUSTOMER | Place order — validates cart, charges Stripe |
| GET    | /orders            | CUSTOMER | Paginated order history (cursor-based)       |
| GET    | /orders/:id        | CUSTOMER | Order detail with nutritional summary        |
| PATCH  | /orders/:id/cancel | CUSTOMER | Cancel a PENDING order                       |

### Super Admin

| Method | Endpoint                     | Auth        | Description                                                       |
| ------ | ---------------------------- | ----------- | ----------------------------------------------------------------- |
| GET    | /super-admin/users           | SUPER_ADMIN | All users — paginated, filterable by role/status                  |
| PATCH  | /super-admin/users/:id       | SUPER_ADMIN | Suspend or reinstate a customer account                           |
| GET    | /super-admin/restaurants     | SUPER_ADMIN | All restaurants including inactive ones                           |
| POST   | /super-admin/restaurants     | SUPER_ADMIN | Create a restaurant + its admin account in one operation          |
| PATCH  | /super-admin/restaurants/:id | SUPER_ADMIN | Activate or deactivate a restaurant                               |
| GET    | /super-admin/orders          | SUPER_ADMIN | All orders platform-wide — filterable by restaurant, status, date |

---

## Redis Key Reference

| Key                           | Purpose                             | TTL        |
| ----------------------------- | ----------------------------------- | ---------- |
| `nutrition:item:{menuItemId}` | Edamam API response for a menu item | 30 days    |
| `session:refresh:{userId}`    | Refresh token (hashed)              | 7 days     |
| `ratelimit:auth:{ip}`         | Auth endpoint rate limit            | 15 minutes |
| `ratelimit:global:{ip}`       | Catch-all rate limit                | 1 minute   |

---

## Environment Variables

### Backend — `.env`

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nutridash
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=change_this
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=change_this_too
JWT_REFRESH_EXPIRY=7d

APP_PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

EDAMAM_APP_ID=your_app_id
EDAMAM_APP_KEY=your_app_key

STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

> `CORS_ORIGIN` changed from `5173` (Vite's default port) to `3000` (Next.js's default port).

### Frontend — `.env`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

> Next.js only exposes env vars to the browser if they're prefixed `NEXT_PUBLIC_` — anything
> without that prefix stays server-only, which matters once Server Components/Route Handlers
> are in play. (Previously `VITE_*`, since Vite's convention is different.)

> `.env` files are in `.gitignore`. Only `.env.example` files are committed to Git.
> Each developer copies `.env.example` → `.env` and fills in their own values locally.

---

## Security Rules

- JWT access tokens: 15-minute expiry
- JWT refresh tokens: 7-day expiry, HTTP-only Secure SameSite=Strict cookie
- Every `/auth/refresh` call rotates the refresh token — old one immediately invalidated
- Helmet.js applied to all server responses
- `ValidationPipe` globally with `whitelist: true` + `forbidNonWhitelisted: true`
- Stripe secret key and Edamam API key: backend only — never in frontend code or frontend `.env`
- CORS_ORIGIN: exact domain string, never `*` with credentials
- Passwords hashed with bcrypt, salt rounds: 10
- Rate limiting via Redis — never in-memory (breaks with multiple server instances)

| Endpoint Group   | Limit   | Window     |
| ---------------- | ------- | ---------- |
| Auth endpoints   | 5 req   | 15 minutes |
| All other routes | 100 req | 1 minute   |

---

## Project Structure

The repository has two top-level packages. The structure below shows the **shape** — individual files and subfolders are added as features are built and will not be pre-created.

```
nutridash/
├── .github/workflows/      # CI — lint + test on every PR to dev
├── backend/                # NestJS app
│   ├── src/
│   │   ├── main.ts         # Bootstrap: global prefix, CORS, pipe, filter
│   │   ├── app.module.ts
│   │   ├── auth/           # Registration, login, JWT, refresh, logout
│   │   ├── users/          # /users/me — profile + health profile
│   │   ├── restaurants/    # Public restaurant + menu browsing
│   │   ├── menu/           # Restaurant admin menu management
│   │   ├── nutrition/      # Health score, alternatives, dashboard, Edamam
│   │   ├── orders/         # Order placement, history, cancellation
│   │   ├── super-admin/    # Platform-wide user, restaurant, order management
│   │   └── common/         # Guards, filters, decorators, shared utils
│   └── prisma/             # schema.prisma + migrations + seed.ts
└── frontend/               # Next.js (App Router) app
    └── src/
        ├── app/            # Pages — one folder per route, grows with features
        ├── components/     # Shared UI components
        ├── hooks/          # React Query + Zustand hooks
        ├── lib/            # Axios instance, helpers
        └── types/          # Shared TypeScript types
```

> Each backend module contains its own controller, service, repository, and DTOs — created when that module's sprint begins, not upfront.

## Sprint Roadmap

> Person A owns backend-leaning features. Person B owns UI-leaning features.
> Both touch Next.js + NestJS — split is by domain, not by layer.
> Backend always before frontend. Never build UI for an endpoint before it passes manual API tests.

### Sprint 0 — Project Skeleton

**Person A:**

- Create GitHub repo, push initial structure, set branch protection on `main`
- NestJS scaffold: `main.ts` with global prefix (`/api/v1`), CORS + global pipe + global exception filter
- Prisma: full `schema.prisma` with all models, initial migration, seed script scaffold
- `common/errors.ts` with all error codes defined upfront
- CI pipeline: `ci.yml` — lint + test on every PR to `dev`
- Backend `.env.example`

**Person B:**

- Next.js (App Router, TypeScript) scaffold via `create-next-app`
- Tailwind CSS configured
- App Router route structure with all page stubs (`page.tsx` per route — see Folder Structure)
- `middleware.ts` stub for future JWT / onboarding route protection
- Axios instance in `lib/api.ts` with error code interceptor, base URL reading `NEXT_PUBLIC_API_URL`
- Shared UI components scaffold: Button, Card, Badge, Modal, Spinner
- Frontend `.env.example`

**Done when:** Both devs can clone, `npm install`, and start frontend + backend without errors.

---

### Sprint 1 — Auth + Health Profile (Person A)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `POST /users/me/health-profile` — creates profile, sets `isOnboardingComplete = true`
- `GET /users/me` + `GET /users/me/health-profile` + `PATCH /users/me/health-profile`
- JwtGuard + RolesGuard + onboarding guard
- Auth pages (Next.js): Login, Register, Onboarding health profile form

**Done when:** A user can register, complete their health profile, and get a JWT that unlocks the app.

---

### Sprint 2 — Restaurants + Menu Browsing (Person B)

- `GET /restaurants`, `GET /restaurants/:id`, `GET /restaurants/:id/menu`
- Menu items returned with nutrition data and allergen flags where available
- Home page: restaurant listing cards
- Restaurant / menu page: item cards with price, nutrition summary, allergen badges
- `HealthScoreBadge` placeholder (shows "N/A" until Sprint 3)
- `NutritionCard` component (calories / protein / carbs / fat / fiber)

**Done when:** A logged-in user can browse restaurants and see menu items with nutrition labels.

---

### Sprint 3 — Nutrition Engine (Person A)

- `EdamamService` — API client + Redis cache (30-day TTL)
- `calculateHealthScore()` wired into `GET /nutrition/score`
- `GET /nutrition/alternatives` — up to 3 higher-scoring items from same restaurant
- `getConflictingAllergens()` consumed by menu endpoint
- `AllergenWarning` modal in Next.js
- `HealthScoreBadge` wired up with real scores
- `AlternativesSuggestion` component

**Done when:** Every menu item shows a personalised health score. Allergen conflicts show a warning modal.

---

### Sprint 4 — Cart, Checkout, Order History + Admin Panels (Person B)

- Cart via Zustand (client-side only — no DB cart for MVP)
- `CartSummaryBar` — sticky footer: total calories + health score + price
- `POST /orders` — validates cart, creates Order + OrderItems + NutritionLog, charges Stripe
- `GET /orders` + `GET /orders/:id` — order history + detail pages
- `POST /admin/menu-items` — creates item, triggers Edamam fetch automatically
- `PATCH /admin/menu-items/:id`, `DELETE /admin/menu-items/:id`
- `POST /admin/menu-items/:id/refetch-nutrition`
- Admin panel page: item list, add/edit/delete, nutritionStatus badge
- Super Admin panel: `GET /super-admin/users`, `PATCH /super-admin/users/:id` (suspend/reinstate)
- Super Admin panel: `GET /super-admin/restaurants`, `POST /super-admin/restaurants`, `PATCH /super-admin/restaurants/:id` (activate/deactivate)
- Super Admin panel: `GET /super-admin/orders` — platform-wide order view with filters

**Done when:** A customer can complete a full order. A restaurant admin can manage their menu. A super admin can manage restaurants and users.

---

### Sprint 5 — Nutrition Dashboard (Person A)

- `GET /nutrition/dashboard` — aggregate NutritionLog for past 7 days per user
- Response: daily calories vs target, macro breakdown, health score trend
- Dashboard page: 3 Recharts charts (bar: calories, pie: macros, line: score trend)
- Empty state for users with fewer than 2 orders in the past week

**Done when:** A user who has placed orders can see their weekly nutrition breakdown with charts.

---

### Sprint 6 — Testing, Polish & Deployment (Both)

- Unit tests: `calculateHealthScore()` for all goal/macro combinations
- Unit tests: `getConflictingAllergens()` edge cases
- Integration tests: `/auth/*` and `/orders` with Supertest
- GitHub Actions: tests must pass before merging to `main`
- Responsive design pass (mobile breakpoints)
- Backend → Render, Frontend → Vercel, DB → Neon, Redis → Upstash
- `DEPLOYMENT.md` — step-by-step production deployment checklist
- Final `STATUS.md` update

**Done when:** App is live on production URLs and all critical paths work end-to-end.
