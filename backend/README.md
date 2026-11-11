# AgriFarm Backend API

Production-ready farm management REST API built with **Node.js**, **Express.js**, **PostgreSQL**, and **Prisma ORM**.

---

## 1. System Overview

AgriFarm provides an end-to-end digital farm management platform allowing farmers and farm administrators to manage:
- **Farms and Agricultural Fields**: Multi-farm and multi-field management with GPS coordinates, acreage, soil types, and irrigation methods.
- **Crop Catalog & Cultivation Cycles**: Dynamic crop registry, active & historical cycle tracking, growth stage progression, and health monitoring.
- **Agricultural Tasks**: Scheduling, priority-based workflows, and farmhand assignments.
- **Farm Financials**: Categorized expense tracking and harvest revenue records.
- **Weather Services**: Geolocation-based weather observation and caching.
- **Agricultural Market Prices**: Crop market intelligence and price trend reporting.
- **Dashboard Analytics & Executive Reports**: Executive summaries, production reports, expense breakdowns, and ROI profitability analytics.

---

## 2. Technology Stack

- **Runtime**: Node.js (>=20) with ECMAScript Modules (`"type": "module"`)
- **Backend Framework**: Express.js
- **Database**: PostgreSQL (UUID primary keys, ENUM types, NUMERIC currency/quantities)
- **ORM**: Prisma ORM
- **Authentication**: Stateless JSON Web Tokens (JWT) with password fingerprint invalidation
- **Password Hashing**: bcrypt (12 salt rounds)
- **Validation**: Zod schema validation
- **Security**: Helmet headers, CORS policy, express-rate-limit brute force mitigation
- **Logging**: Morgan HTTP logger
- **Testing**: Node test runner (`node:test`) + Supertest

---

## 3. Database Architecture (10 Models, 10 Enums)

The database schema strictly adheres to the approved AgriFarm PostgreSQL DBML specification.

### Enums
- `user_status`: `active`, `inactive`, `suspended`
- `farm_status`: `active`, `inactive`, `archived`
- `field_status`: `active`, `inactive`
- `crop_cycle_status`: `planned`, `active`, `harvested`, `cancelled`
- `growth_stage`: `preparation`, `sowing`, `germination`, `vegetative`, `flowering`, `fruiting`, `maturity`, `harvested`
- `crop_health_status`: `healthy`, `needs_attention`, `affected`, `unknown`
- `task_type`: `irrigation`, `fertilization`, `pesticide`, `weeding`, `planting`, `harvesting`, `inspection`, `other`
- `task_status`: `pending`, `in_progress`, `completed`, `cancelled`
- `expense_category`: `seeds`, `fertilizer`, `pesticide`, `labour`, `irrigation`, `equipment`, `transportation`, `maintenance`, `other`
- `weather_source`: `api`, `manual`

### Models & Key Relationships
1. **User** (`users`): System users (farmers and workers).
2. **Farm** (`farms`): Agricultural holdings owned by users (`owner_id -> users.id`, `onDelete: Restrict`).
3. **Field** (`fields`): Parcels within a farm (`farm_id -> farms.id`, `onDelete: Cascade`, unique `[farmId, name]`).
4. **CropCatalog** (`crop_catalog`): Standard crop registry with default yield per acre and typical duration.
5. **CropCycle** (`crop_cycles`): Specific cultivation cycle (`field_id -> fields.id`, `crop_id -> crop_catalog.id`).
6. **Task** (`tasks`): Field activities (`farm_id -> farms.id`, optional `field_id`, `crop_cycle_id`, `assigned_to`).
7. **Expense** (`expenses`): Financial outflows (`farm_id -> farms.id`, `recorded_by -> users.id`).
8. **Harvest** (`harvests`): Actual harvested output and sale records (`farm_id`, `field_id`, `crop_cycle_id`).
9. **MarketPrice** (`market_prices`): APMC Mandi market price records (`crop_id -> crop_catalog.id`).
10. **WeatherRecord** (`weather_records`): Cached meteorological observations (`farm_id -> farms.id`).

---

## 4. Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Prisma schema matching approved DBML
│   └── seed.js                    # Comprehensive idempotent seed script
├── src/
│   ├── config/
│   │   ├── database.js            # Prisma client instance singleton
│   │   └── env.js                 # Zod validated environment variables
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT Bearer verification & active account guard
│   │   ├── error.middleware.js    # Centralized error handler & Prisma error mapper
│   │   ├── notFound.middleware.js # Standardized 404 handler
│   │   └── validate.middleware.js # Zod body/query/params request validator
│   ├── modules/
│   │   ├── auth/                  # Register, Login, Me, Change Password
│   │   ├── users/                 # User directory for task assignments
│   │   ├── farms/                 # Farm CRUD & ownership isolation
│   │   ├── fields/                # Field CRUD (scoped & top-level)
│   │   ├── crops/                 # Crop catalog search & inspection
│   │   ├── cropCycles/            # Cycle tracking, progress & metrics
│   │   ├── tasks/                 # Task workflow & completion endpoints
│   │   ├── expenses/              # Expense tracking & category aggregations
│   │   ├── harvests/              # Harvest recordings & sales tracking
│   │   ├── weather/               # Open-Meteo & OpenWeatherMap integrations
│   │   ├── marketPrices/          # Agmarknet / APMC market price feeds
│   │   └── dashboard/             # Executive analytics & report generators
│   ├── utils/
│   │   ├── ApiError.js            # Normalized custom error class
│   │   ├── ApiResponse.js         # Consistent success & pagination envelopes
│   │   ├── asyncHandler.js        # Async route exception forwarder
│   │   └── ownership.js           # Multi-tenant resource ownership guards
│   ├── app.js                     # Express application configuration
│   └── server.js                  # HTTP server bootstrap & graceful shutdown
├── tests/
│   ├── setup-env.js               # Test environment configuration
│   ├── validation.test.js         # Schema validation unit tests
│   ├── business-logic.test.js     # Agricultural calculation unit tests
│   ├── error-handling.test.js     # Error mapper unit tests
│   └── api.test.js                # API integration & security tests
├── AgriFarm_API.postman_collection.json # Postman collection
├── .env.example                   # Environment configuration template
├── .gitignore
└── package.json
```

---

## 5. Security & Ownership-Based Authorization

1. **Authentication**:
   - Passwords hashed using `bcrypt` (12 rounds).
   - Identity derived **strictly** from verified JWT Bearer tokens.
   - Passwords hashes are **never returned** across any endpoint.
   - Changing password embeds a new password fingerprint into issued tokens, immediately invalidating old tokens across all devices.
   - Suspended or deleted accounts lose access immediately.
2. **Ownership Isolation**:
   - `Farm.ownerId` is always set from `req.user.id` on creation.
   - Clients cannot supply or override `ownerId`.
   - Access to fields, crop cycles, tasks, expenses, harvests, and weather data is validated through database parent-ownership checks (`assertFarmOwnership`, `assertCropCycleOwnership`, etc.).
   - If an unauthorized user attempts to view, modify, or delete another user's farm resource, the API responds with `404 NOT_FOUND` (preventing ID enumeration).

---

## 6. Business Logic Specifications

- **Expected Yield**:
  $$\text{Expected Yield} = \text{Cultivated Area} \times \text{Default Yield Per Acre}$$
  (Automatically calculated on crop cycle creation if not explicitly provided).
- **Estimated Revenue**:
  $$\text{Estimated Revenue} = \text{Expected Yield} \times \text{Expected Selling Price Per Unit}$$
- **Estimated Profit**:
  $$\text{Estimated Profit} = \text{Estimated Revenue} - \text{Attributable Expenses}$$
- **Task Completion Percentage**:
  $$\text{Task Completion Rate} = \left(\frac{\text{Completed Tasks}}{\text{Total Tasks}}\right) \times 100$$
- **Crop Progress**:
  $$\text{Crop Progress} = \min\left(100, \left(\frac{\text{Elapsed Days}}{\text{Expected Duration Days}}\right) \times 100\right)$$
  - *Distinguished cleanly from crop health*.
  - *Cycles with status `harvested` are locked at 100%*.
  - *Planned cycles with future planting dates evaluate to 0%*.
- **Historical Double-Counting Prevention**:
  Dashboard summary metrics calculate cultivated acreage, expected yield, and estimated revenue **strictly** over `active` crop cycles, preventing completed or historical Kharif/Rabi cycles from skewing current operations.

---

## 7. API Reference

All responses follow a consistent envelope structure:

### Standard Success Envelope
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "in": "body", "path": "name", "message": "Farm name is required" }
    ]
  }
}
```

### Endpoints Table

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/v1/health` | Service health status |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user account |
| | `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT |
| | `POST` | `/api/v1/auth/forgot-password`| Request password reset link/token |
| | `POST` | `/api/v1/auth/reset-password` | Reset password using single-use token |
| | `GET` | `/api/v1/auth/me` | Fetch authenticated user profile |
| | `PATCH` | `/api/v1/auth/me` | Update personal profile details |
| | `POST` | `/api/v1/auth/change-password`| Update password & invalidate old tokens |
| **Users** | `GET` | `/api/v1/users` | List active users for task assignment |
| **Farms** | `GET` | `/api/v1/farms` | List user's farms (with pagination & filter) |
| | `POST` | `/api/v1/farms` | Create a new farm |
| | `GET` | `/api/v1/farms/:id` | Get farm details, fields & weather |
| | `PATCH` | `/api/v1/farms/:id` | Update farm details |
| | `DELETE`| `/api/v1/farms/:id` | Delete farm and cascade resources |
| **Fields** | `GET` | `/api/v1/farms/:farmId/fields` | List fields on a farm |
| | `POST` | `/api/v1/farms/:farmId/fields` | Add a new field to a farm |
| | `GET` | `/api/v1/fields/:id` | Get field details and cycles |
| | `PATCH` | `/api/v1/fields/:id` | Update field details |
| | `DELETE`| `/api/v1/fields/:id` | Delete field |
| **Crops** | `GET` | `/api/v1/crops` | List crop catalog entries |
| | `GET` | `/api/v1/crops/:id` | Get crop catalog detail |
| **Cycles** | `GET` | `/api/v1/crop-cycles` | List crop cycles with calculated metrics |
| | `POST` | `/api/v1/crop-cycles` | Initiate a new crop cycle |
| | `GET` | `/api/v1/crop-cycles/:id` | Get crop cycle with finances & tasks |
| | `PATCH` | `/api/v1/crop-cycles/:id` | Update cycle stage, health & notes |
| | `DELETE`| `/api/v1/crop-cycles/:id` | Delete crop cycle |
| **Tasks** | `GET` | `/api/v1/tasks` | List farm tasks (filter by status/priority) |
| | `POST` | `/api/v1/tasks` | Create task for farm/field/cycle |
| | `GET` | `/api/v1/tasks/:id` | Get task details |
| | `PATCH` | `/api/v1/tasks/:id` | Update task details |
| | `PATCH` | `/api/v1/tasks/:id/complete` | Mark task as completed |
| | `DELETE`| `/api/v1/tasks/:id` | Delete task |
| **Expenses** | `GET` | `/api/v1/expenses` | List farm expenses & summary totals |
| | `POST` | `/api/v1/expenses` | Record a new expense |
| | `GET` | `/api/v1/expenses/:id` | Get expense details |
| | `PATCH` | `/api/v1/expenses/:id` | Update expense |
| | `DELETE`| `/api/v1/expenses/:id` | Delete expense |
| **Harvests** | `GET` | `/api/v1/crop-cycles/:cropCycleId/harvests` | List harvests for a crop cycle |
| | `POST` | `/api/v1/crop-cycles/:cropCycleId/harvests` | Record harvest for a crop cycle |
| | `GET` | `/api/v1/harvests` | List all harvest records across farms |
| | `GET` | `/api/v1/harvests/:id` | Get harvest details |
| | `PATCH` | `/api/v1/harvests/:id` | Update harvest details |
| | `DELETE`| `/api/v1/harvests/:id` | Delete harvest |
| **Weather** | `GET` | `/api/v1/farms/:farmId/weather` | Get cached/live weather for farm |
| | `POST` | `/api/v1/farms/:farmId/weather/refresh` | Force refresh live weather from API |
| **Market** | `GET` | `/api/v1/market-prices` | List APMC market prices |
| | `GET` | `/api/v1/market-prices/latest`| Latest modal prices by crop & market |
| **Dashboard**| `GET` | `/api/v1/dashboard/summary` | Real-time farm KPIs & chart series |
| **Reports** | `GET` | `/api/v1/reports/production` | Crop production & yield variance report |
| | `GET` | `/api/v1/reports/expenses` | Category breakdown & monthly expense trend |
| | `GET` | `/api/v1/reports/profitability` | Cycle profitability & ROI report |

---

## 8. Setup & Development Instructions

### Prerequisites
- Node.js >= 20
- PostgreSQL database

### 1. Installation
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` to configure your PostgreSQL connection:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agrifarm?schema=public"
JWT_SECRET="generate_at_least_32_characters_random_string_here"
PORT=5000
FRONTEND_URL="http://localhost:5173"
SEED_DEMO_PASSWORD="AgriFarmPassword123"
```

### 3. Generate Prisma Client & Run Migrations
```bash
# Generate the Prisma client
npx prisma generate

# Apply migrations to development database
npx prisma migrate dev --name init

# Or deploy migration schema directly
npx prisma migrate deploy
```

### 4. Seed Development Data
```bash
npm run db:seed
```
Seeds realistic farm data:
- Demo farmer: `farmer@agrifarm.dev` (Password: `AgriFarmPassword123`)
- Demo worker: `worker@agrifarm.dev` (Password: `AgriFarmPassword123`)
- 8 standard crops (Rice, Wheat, Maize, Cotton, Groundnut, Tomato, Onion, Sugarcane)
- Patil Family Farm with 2 fields, active tomato cycle, planned wheat cycle, completed rice harvest, tasks, and categorized expenses.

### 5. Start Application
```bash
# Development (with node --watch)
npm run dev

# Production
npm start
```

### 6. Run Automated Tests
```bash
npm test
```
Runs validation tests, agricultural calculation tests, error handling tests, and API security tests using Node's built-in test runner.

