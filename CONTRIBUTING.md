# Contributing to GK WhizWheel

Thank you for contributing to GK WhizWheel! To maintain consistency and software quality across human and agentic development workflows, please adhere to the following guidelines.

---

## 1. Coding Standards

We follow strict design principles, service boundaries, and coding conventions. Rather than duplicating these rules here, please review and adhere to:

👉 **[`docs/04-CODING-STANDARDS-AND-STRUCTURE.md`](docs/04-CODING-STANDARDS-AND-STRUCTURE.md)**

### Core Tenets to Remember
- **Strict Types & PSR-12:** Every PHP file must declare `declare(strict_types=1);` and have complete type hints.
- **Thin Controllers, Fat Services:** Controllers only handle request validation and response transformation. All business logic (pricing, availability, refund calculation, hold expirations) lives in `app/Services/`.
- **Form Requests & API Resources:** Never validate inline in controllers. Never return raw Eloquent models; always wrap JSON payloads using `app/Http/Resources/`.
- **Concurrency & Idempotency:** Any availability or payment modification must execute inside a database transaction with row locks (`SELECT ... FOR UPDATE`) and validate `Idempotency-Key`.
- **Signed Documents:** Vehicle and KYC documents must always be served via short-lived signed URLs, never direct public paths.
- **Code Style:** Format PHP code using Laravel Pint:
  ```bash
  ./vendor/bin/pint
  ```

---

## 2. Branch Naming Conventions

All development should occur on dedicated branches branching off `develop` (or `main` if single-branch trunk):

- **Feature branches:** `feature/<feature-slug>` (e.g., `feature/dynamic-pricing`, `feature/staff-offline-queue`)
- **Bug fixes:** `fix/<bug-slug>` (e.g., `fix/webhook-signature-validation`, `fix/deposit-refund-calc`)
- **Refactoring:** `refactor/<cleanup-slug>` (e.g., `refactor/notification-service-fallback`)
- **Documentation:** `docs/<topic-slug>` (e.g., `docs/api-contracts`)
- **Chores / Tooling:** `chore/<task-slug>` (e.g., `chore/pest-coverage-config`)

---

## 3. Commit Message Format (Conventional Commits)

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification to keep the Git history structured and automate changelog generation.

### Format
```text
<type>(<scope>): <short imperative description>

[optional body explaining context and rationale]

[optional footer(s)]
```

### Allowed Types
- `feat`: A new feature for the user or staff
- `fix`: A bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests
- `docs`: Documentation updates only
- `chore`: Maintenance tasks, dependency updates, or configuration changes
- `perf`: Code changes improving runtime performance

### Examples
- `feat(pricing): add weekend and holiday rate multipliers to PricingService`
- `fix(webhooks): verify phonepe x-verify checksum before confirming payment`
- `refactor(mobile): extract offline queue into sqlite-backed storage service`
- `test(availability): add simultaneous booking race condition test`

---

## 4. Running Tests Locally Before Pushing

Before pushing a branch or opening a pull request, you **must run the full test suite** to ensure 100% test pass rate and zero regressions:

### 1. Run Laravel Backend Tests (Pest)
```bash
./vendor/bin/pest
```
All feature and unit tests must pass. The test suite verifies critical user journeys, race-condition booking holds, refund calculation edge cases, payment webhooks, and audit logging.

### 2. Verify Code Formatting
```bash
./vendor/bin/pint --test
```

### 3. Verify Frontend Build
```bash
npm run build
```

### 4. Run Mobile Self-Check Scripts
If modifying the mobile application in `mobile/`, run the node self-check simulation scripts:
```bash
node mobile/scripts/test-walk-in-flow.js
node mobile/scripts/test-return-flow.js
```
