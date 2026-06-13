# ITI Attendance & Grading Platform — Frontend

This is the official frontend web application for the **ITI Attendance & Grading Platform**, built using **Vue 3**, **Vite**, **TypeScript**, and **Tailwind CSS**. It is fully integrated with a stateless, headless Laravel 13 JSON API backend.

The platform provides branch managers, track administrators, instructors, and students with powerful interfaces for managing cohorts, recording attendance via QR codes, tracking grades, monitoring at-risk student status, and reviewing billing summaries.

---

## 🚀 Key Modules & Features

### 1. 📊 Analytics & At-Risk Students
* **Cohort Selector**: Allows branch managers to view all active and inactive cohorts, tracks, and student counts.
* **At-Risk Detection**: Spotlights students falling behind in attendance (balance `< 150`), grades (course score `< 60`), or both.
* **Smart Filter & Search**: Client-side name/email search and risk-type category filtering.
* **Course Failure Drawer**: Visual summary of failing courses with inline details and expandable course chips.
* **Fully Responsive Pagination**: Grid footers adapt to any layout or screen size, avoiding text overflow.

### 2. 💳 Finance & Instructor Billing
* **Cost Summary KPIs**: High-level cost breakdown cards (Total Billing, Internal Instructor cost, External Consultants cost) with decorative overlays.
* **Instructor Rollup List**: Clickable overview list showing staff members, roles, rates, and active cycle payouts.
* **Engagement Drilldown**: Detailed breakdowns of hourly and fixed compensation metrics, and paginated lists of courses, labs, and business sessions taught.

### 3. 📅 Attendance & Grading
* **QR Attendance Code System**: Allows scanning and logging physical student presence at daily sessions.
* **Excuse Request Portal**: Handles mitigation flows for missed events and updates ledger status.
* **Normalized Grading**: Visual tools to audit individual deliverables, manage score overrides, and view normalization distribution graphs.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose / Notes |
|---|---|---|
| **Core Framework** | **Vue 3 (Composition API)** | State-of-the-art SPA architecture, using `<script setup>` |
| **Bundler & Dev Server** | **Vite** | Lightning-fast HMR and build optimizations |
| **Language** | **TypeScript** | Strict type safety for models, components, and APIs |
| **Styling & UI** | **Tailwind CSS + DaisyUI** | Premium dark-themed layout styling |
| **UI Components** | **PrimeVue + PrimeIcons** | Accessible icons and advanced UI selectors |
| **State Management** | **Pinia** | Store pattern for authentication and system settings |
| **HTTP Client** | **Axios** | API request interceptors for token authentication |

---

## 🐋 Local Setup Using Docker

The easiest way to run the entire stack (Frontend + Backend + PostgreSQL Database) is using Docker Compose from the root workspace directory.

### 1. Set Up Environment Files
Ensure you have the environment configurations created in both the frontend and backend directories:

* **Frontend Environment**:
  In `attendance-and-grading-platform-frontend/` directory, create a `.env` file:
  ```dotenv
  VITE_API_URL=http://localhost:8000/api
  ```

* **Backend Environment**:
  In `attendance-and-grading-platform-backend/` directory, copy `.env.example` to `.env` and fill in your DB credentials:
  ```dotenv
  APP_NAME="Attendance & Grading Platform"
  APP_ENV=local
  APP_DEBUG=true
  APP_URL=http://localhost:8000

  DB_CONNECTION=pgsql
  DB_HOST=db
  DB_PORT=5432
  DB_DATABASE=academy_db
  DB_USERNAME=academy_user
  DB_PASSWORD=academy_password
  ```

* **Root Workspace Environment**:
  In the parent directory where `docker-compose.yml` resides, ensure your `.env` contains:
  ```dotenv
  DB_PORT=5432
  DB_DATABASE=academy_db
  DB_USERNAME=academy_user
  DB_PASSWORD=academy_password
  ```

### 2. Spin Up Services
From the root workspace directory (where `docker-compose.yml` is located), run:
```bash
docker compose up -d --build
```
This builds and starts:
* **Frontend**: `http://localhost:5173`
* **Backend**: `http://localhost:8000`
* **Database**: PostgreSQL container serving database instance

### 3. Setup Database Migrations & Seeders
Once the containers are up, execute migrations and populate test data inside the backend container:
```bash
# Run database migrations
docker compose exec backend php artisan migrate --force

# Seed initial system configuration and mockup data
docker compose exec backend php artisan db:seed --force
```

---

## 💻 Running Locally (Without Docker)

If you prefer to run the frontend independently:

### 1. Installation
Navigate to the frontend folder and install npm packages:
```bash
npm install
```

### 2. Compile and Hot-Reload for Development
```bash
npm run dev
```
The application will serve locally at `http://localhost:5173`.

### 3. Build & Minify for Production
```bash
npm run build
```

### 4. Run Unit Tests (Vitest)
```bash
npm run test:unit
```

---

## 🛠️ Recommended Developer Setup

* **IDE**: [VS Code](https://code.visualstudio.com/)
* **Extensions**:
  * [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (Disable Vetur to avoid syntax conflicts)
  * [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)
* **DevTools**:
  * [Vue.js DevTools extension](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  * Enable **Custom Object Formatters** in Chrome/Firefox DevTools for readable reactive ref logging.
