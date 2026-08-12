@C:\Users\ACER\.codex\RTK.md

# Bhumi Satya Repository Guide

## Project overview

Bhumi Satya is a Node.js monorepo for managing organizational land assets.

- `frontend/`: React 19, Vite, React Router, Zustand, Tailwind CSS, Leaflet/MapLibre, and Recharts.
- `backend/`: Express, Sequelize, PostgreSQL, JWT authentication, OTP/MFA, email, and object storage integrations.
- Root scripts orchestrate the frontend and backend; this is not an npm-workspaces project.

## Commands

Run shell commands through `rtk` as required by the imported instruction.

From the repository root:

```bash
rtk npm run dev
rtk npm run dev:be
rtk npm run dev:fe
rtk npm run build
rtk npm run db:migrate
rtk npm run db:seed
```

Targeted verification:

```bash
rtk npm test --prefix backend
rtk npm test --prefix frontend
rtk npm run lint --prefix frontend
rtk npm run build --prefix frontend
```

There is no root `test` or `lint` script. Run the package-level commands above.

## Architecture and change locations

- Frontend entry: `frontend/src/main.jsx`.
- Routes and lazy-loaded pages: `frontend/src/router/index.jsx`.
- API client: `frontend/src/services/api.js`.
- Authentication/session state: `frontend/src/stores/`.
- Shared permission rules: `frontend/src/utils/permissions.js`.
- Reusable UI lives in `frontend/src/components/`; route-level views live in `frontend/src/pages/`.
- Backend entry and route mounting: `backend/src/server.js`.
- Backend request flow is `routes/` -> `controllers/` -> Sequelize `models/` and, where appropriate, `services/`.
- Cross-cutting backend concerns live in `middleware/`, `services/`, and `utils/`.
- Database configuration is in `backend/src/config/`.
- Existing migrations are present in both `backend/migrations/` (`.cjs`, sequelize-cli) and `backend/src/database/migrations/` (`.js`). Follow the convention used by the feature being changed and verify the configured migration path before adding a migration.

## Implementation conventions

- The codebase uses ES modules and mostly double quotes.
- Preserve the existing formatting of touched files; do not reformat unrelated code.
- Keep route handlers thin. Put reusable business logic in a service and database shape/associations in models.
- Register new backend routes in `backend/src/server.js`.
- Add frontend pages to the hash router and enforce access with `ProtectedRoute`/`RoleGuard` plus the centralized permission utilities.
- Use the shared frontend API client instead of creating ad-hoc Axios instances.
- Reuse shared form, asset, map, and UI components before introducing new variants.
- Keep role normalization and authorization behavior centralized. UI guards are not a substitute for backend authorization.
- Do not edit generated or bundled GIS files under `frontend/public/data/` and `frontend/src/assets/webgis*/data/` unless the task explicitly targets those artifacts.
- Treat `backend/backups/`, GeoJSON, images, archives, and other large artifacts as data. Avoid mechanical rewrites.

## Environment and security

- Local backend development requires PostgreSQL and backend environment variables. Common variables include `DATABASE_URL`, `JWT_SECRET`, SMTP settings, `FRONTEND_URL`, and storage/provider credentials.
- Never commit `.env` files, credentials, OTP secrets, JWTs, production database dumps, or user data.
- Preserve the backend's explicit CORS allowlist and serverless behavior unless a change intentionally updates deployment policy.
- Validate uploads and request input at the API boundary, and preserve audit/history behavior for mutations.

## Verification expectations

- Run the smallest relevant test first, then the package test suite for the side changed.
- Frontend behavior changes: run frontend tests and lint; run the production build for routing, dependency, or bundling changes.
- Backend behavior changes: run backend tests. Database-dependent flows may also require a configured local PostgreSQL instance.
- Changes spanning the API contract must verify both the backend response shape and all frontend consumers.
- Add or update tests for permission rules, authentication/session behavior, and service logic when those areas change.

## Changelog management

- Maintain user-facing development history in `frontend/src/data/changelog.js`; do not create or display application release numbers unless the user requests versioning again.
- **Warning:** before running any `git commit` or `git push`, update `frontend/src/data/changelog.js` first so every user-facing change included in the commit is recorded. Do not commit or push while the changelog is out of sync.
- Add only notable features, improvements, and fixes that actually exist in Git history. Use the real completion date and keep the newest entry first.
- Keep changelog wording short, understandable to non-technical users, and grouped by month on the Documentation page.
- A regular commit or push does not require a changelog entry when it only changes internal implementation without a user-visible effect.

## Working-tree hygiene

- Do not modify or discard unrelated user changes.
- Keep generated build output and dependencies (`dist/`, `node_modules/`) out of commits.
- Check `git status` before and after work, and report any verification that could not run.
