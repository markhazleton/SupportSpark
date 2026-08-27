# Changelog

All notable changes to SupportSpark are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

---

## [Unreleased]

## [2026-04-12] Archive run

### Archived

- `.documentation/copilot/harvest-2026-04-12.md` — transient harvest report moved to the dated archive after the archive workflow completed.
- `.documentation/copilot/session-2026-04-12/architecture-documentation-arrangement.md` — session-specific documentation arrangement notes archived after their decisions were folded into living docs.

### Key decisions preserved

- `.documentation/Guide.md` remains the living entry point for repository documentation.
- Durable product and system guidance stays in `.documentation/domain/` rather than in session artifacts.
- README and documentation links should continue pointing at the active `.documentation/` tree instead of archived notes.

---

## [0.2.0] — 2026-02-24 · Static Preview Alpha

### Added

- **localStorage adapter** (`client/src/lib/local-storage-adapter.ts`) implementing 14 methods — auth (register, login, logout, getCurrentUser), conversations (getConversations, getConversation, createConversation, addMessage), supporters (getSupporters, inviteSupporter, updateSupporterStatus), and storage management (getStorageUsagePercent, resetAllData, isStorageAvailable) — using `supportSpark_`-prefixed keys
- **Seed data module** (`client/src/lib/seed-data.ts`) with demo user Alex Rivera, 2 "My Journey" conversations ("Starting My Recovery Journey", "Grateful for Small Wins"), 2 "Following" conversations ("Managing Daily Challenges", "Finding Community Support"), and bidirectional supporter relationships populated on first registration
- **PreviewBanner component** (`client/src/components/preview-banner.tsx`) — persistent "Preview Alpha" notice on every page, passive storage usage warning at 80% threshold (via `navigator.storage.estimate()`), and "Reset Demo Data" action shown only to authenticated users
- **Hash-based routing** — `App.tsx` wrapped with Wouter `useHashLocation`, enabling `/#/dashboard`, `/#/conversation/:id` paths compatible with GitHub Pages static hosting
- **Static Vite build config** (`vite.config.static.ts`) with `base: "/SupportSpark/"`, `root: client/`, output to `dist-static/`, and `data/quotes.json` bundled
- **GitHub Actions deploy workflow** (`.github/workflows/deploy-preview.yml`) auto-deploys to GitHub Pages on push — Node 20, `npm ci`, Vite static build, upload-pages-artifact, deploy-pages
- `.nojekyll` marker in `client/public/` to prevent GitHub Pages from processing underscore-prefixed Vite asset directories

### Changed

- `client/src/hooks/use-auth.ts` — register and login mutations replaced with localStorage adapter calls; logout clears session only, preserving stored data; Zod validation errors (email format, password min-length) surface on the Auth form
- `client/src/hooks/use-conversations.ts` — all queries and mutations replaced with localStorage adapter equivalents (getConversations, getConversation, createConversation, addMessage)
- `client/src/hooks/use-supporters.ts` — all queries and mutations replaced with localStorage adapter (getSupporters, inviteSupporter with auto-accept + mock user generation, updateSupporterStatus)
- `client/src/lib/queryClient.ts` — server-dependent utilities (apiRequest, getQueryFn, throwIfResNotOk) removed; QueryClient instance preserved
- `client/src/pages/Home.tsx` — `/api/quotes` fetch replaced with static import of bundled `data/quotes.json`; quote carousel rotation logic unchanged
- `client/src/pages/Demo.tsx` — server API calls replaced with localStorage adapter equivalents; demo login buttons call `adapter.login()` with pre-seeded credentials
- `README.md` — preview-alpha section added with GitHub Pages URL and brief usage instructions

### Tests Added

- `client/src/lib/local-storage-adapter.test.ts` — unit tests for all 14 adapter methods including register (success + duplicate email), login (success + wrong password), logout, getCurrentUser, CRUD conversations, CRUD supporters, seed data injection on first registration, resetAllData, and isStorageAvailable
- `client/src/lib/seed-data.test.ts` — unit tests verifying seed user, "My Journey" conversations, "Following" conversations, and bidirectional supporter relationships
- `client/src/hooks/use-auth.test.tsx` — integration tests for register flow with React Query cache update, login/logout session management, and getCurrentUser restoration on mount
- `client/src/hooks/use-conversations.test.tsx` — integration tests for getConversations (own + supporter), createConversation, and addMessage
- `client/src/hooks/use-supporters.test.tsx` — integration tests for getSupporters, inviteSupporter (auto-accept + mock user generation), and updateSupporterStatus

### Deployment

- Preview URL: <https://markhazleton.github.io/SupportSpark/>
- Platform: GitHub Pages (static, no server runtime)
- Build command: `npm run build:static`
- Output: `dist-static/` (index.html + hashed JS/CSS assets, total < 5 MB)

---

## [0.1.0] — 2026-02-03 · Audit & Compliance Fixes

### Security

- Passwords hashed with bcrypt (minimum 10 rounds) on registration; plaintext password storage removed
- `passwordVersion` field added to user records to distinguish bcrypt-hashed accounts from legacy plaintext accounts; login returns HTTP 403 for accounts requiring migration
- `SESSION_SECRET` validated at startup — server exits with an error if the variable is absent or matches a known-insecure default value
- Rate limiting applied to login, registration, and demo login endpoints; returns HTTP 429 with `Retry-After` header after threshold is exceeded
- Password never returned in API responses; sanitized at the serialization boundary in all auth routes

### Tests Added

- `server/routes.test.ts` — Authentication security tests covering bcrypt password verification (correct and incorrect), registration hashing, password migration detection (403 path), SESSION_SECRET environment validation, and rate limiting on login and registration endpoints
- `server/storage.test.ts` — Storage contract tests

---

[0.2.0]: https://github.com/markhazleton/SupportSpark/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/markhazleton/SupportSpark/releases/tag/v0.1.0
