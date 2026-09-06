# GK WhizWheel

A unified online and offline bike rental platform designed for multi-store operations with dynamic tiered pricing. The platform seamlessly bridges customer web bookings with on-ground store operations, featuring concurrency-safe reservation holds, one-way rentals, and offline-resilient staff handovers.

---

## Tech Stack

- **Backend:** Laravel 11, PHP 8.3, MySQL 8.0 / MariaDB
- **Web Frontend:** React 18, Inertia.js, Material UI (MUI) & Tailwind CSS
- **Mobile Staff App:** React Native (Android APK) with offline SQLite action queue
- **Payment & Communication:** Razorpay & PhonePe webhook integration, WhatsApp Cloud API, SMTP Email

---

## Getting Started

Follow these steps to set up and run the platform locally:

### Prerequisites
- PHP 8.3+ with `pdo_mysql`, `mbstring`, `openssl`, `curl` extensions
- Composer 2.x
- Node.js 18+ and npm
- MySQL 8.0+

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/gkwhizwheel.git
   cd gkwhizwheel
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Install JavaScript dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Update your database credentials (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) in `.env`.*

5. **Generate application key:**
   ```bash
   php artisan key:generate
   ```

6. **Run database migrations and seeders:**
   ```bash
   php artisan migrate --seed
   ```

7. **Create the storage symlink:**
   ```bash
   php artisan storage:link
   ```

8. **Start local development servers:**
   - Run Laravel backend:
     ```bash
     php artisan serve
     ```
   - In a separate terminal, run Vite dev server:
     ```bash
     npm run dev
     ```

9. **(Optional) Run tests:**
   ```bash
   ./vendor/bin/pest
   ```

---

## Project Structure

```
.
├── app/                  # Laravel application core: Models, Controllers, Services, Enums, Requests
├── bootstrap/            # Framework bootstrap and service configuration
├── config/               # Application and package configuration files
├── database/             # Migrations, model factories, and database seeders
├── docs/                 # Project planning, architecture specs, and operational guides
├── mobile/               # React Native Android staff application (symlinked to /mobile-app)
├── public/               # Web server document root (index.php, static assets)
├── resources/            # React + Inertia customer-facing website and view assets
├── routes/               # Route definitions: web.php, api.php, console.php
├── storage/              # File uploads, private bike/KYC documents, framework caches, logs
├── tests/                # Pest feature and unit test suites
└── .env.example          # Baseline environment template for production and development
```

---

## Documentation

The `docs/` directory contains complete architecture and operational specifications:

- **[`docs/API.md`](docs/API.md)**: Actual implemented REST API endpoints, diff against initial spec, request/response envelopes, and webhook contracts.
- **[`docs/ENV-VARIABLES.md`](docs/ENV-VARIABLES.md)**: Environment variable catalog, requirement classifications, defaults, and cross-checks against `.env.example`.
- **[`docs/01-REQUIREMENTS-AND-FEATURES.md`](docs/01-REQUIREMENTS-AND-FEATURES.md)**: Business requirements, booking state machine, pricing algorithms, and staff flows.
- **[`docs/02-DATABASE-SCHEMA.md`](docs/02-DATABASE-SCHEMA.md)**: Comprehensive schema definitions, table relationships, enums, and composite indexes.
- **[`docs/03-API-SPECIFICATION.md`](docs/03-API-SPECIFICATION.md)**: Initial REST API specification and architecture guidelines.
- **[`docs/04-CODING-STANDARDS-AND-STRUCTURE.md`](docs/04-CODING-STANDARDS-AND-STRUCTURE.md)**: Architecture conventions, service boundaries, and code review checklists.
- **[`docs/05-ENVIRONMENT-SETUP.md`](docs/05-ENVIRONMENT-SETUP.md)**: Server setup guide, shared-hosting constraints, cron scheduling, and backup procedures.
- **[`docs/06-PROMPT-PLAYBOOK.md`](docs/06-PROMPT-PLAYBOOK.md)**: Phased implementation guide and verification checklists.

---

## Deployment

For production deployments (including shared cPanel hosting setup, automated cron jobs, driver configurations, and Spatie backup configuration), follow the step-by-step guide in **[`docs/05-ENVIRONMENT-SETUP.md`](docs/05-ENVIRONMENT-SETUP.md)**.

---

## License

Copyright © 2026 GK WhizWheel. All rights reserved.  
This software and documentation are proprietary and confidential. Unauthorized copying, distribution, or transfer is strictly prohibited. See [`LICENSE`](LICENSE) for details.

