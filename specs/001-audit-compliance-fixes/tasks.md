# Tasks: Production Readiness - Critical Compliance Fixes (MVP Focus)

**Input**: Design documents from `/specs/001-audit-compliance-fixes/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md  
**Constitution**: v1.3.0 (Principle X: Simplicity First applied)

**Tests**: Yes - Authentication security tests (critical path) + deferred comprehensive coverage

**Organization**: Tasks are grouped by user story with **MVP** vs **DEFERRED** labels

## Format: `- [ ] [ID] [P?] [Story?] [MVP/DEFERRED] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- **[MVP]**: Required for beta deployment (Constitution IV alpha/beta requirements)
- **[DEFERRED]**: Apply later when justified by actual need (Principle X: YAGNI)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and dependency installation

- [X] T001 [MVP] Install security dependencies: `npm install bcrypt express-rate-limit`
- [X] T002 [P] [MVP] Install type definition packages: `npm install -D @types/bcrypt`
- [X] T003 [P] [MVP] Install testing dependencies: `npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest @types/supertest`
- [X] T004 [P] [DEFERRED] Install linting dependencies: `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier prettier`
- [X] T005 [MVP] Create `.env.example` file documenting all required environment variables (SESSION_SECRET, NODE_ENV, DATABASE_URL)

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETE

**Purpose**: Core type definitions and configuration that MUST be complete before user story work

**✅ COMPLETE**: Foundation ready - user story implementation can now begin in parallel

- [X] T006 [MVP] Create `server/types.ts` with AuthenticatedRequest interface, Middleware types, AuthHandler, RouteHandler, ErrorHandler types
- [X] T007 [P] [MVP] Export Message schema in `shared/schema.ts` with proper Zod validation (id, conversationId, authorId, content, timestamp fields)
- [X] T008 [P] [MVP] Update User schema in `shared/schema.ts` to include passwordVersion field and input validation (8-72 char range)
- [X] T009 [DEFERRED] Create `.prettierrc.json` configuration file with project formatting rules (semi: true, singleQuote: false, printWidth: 100)
- [X] T010 [P] [DEFERRED] Create `.eslintrc.json` configuration with TypeScript, React rules, and no-explicit-any error
- [X] T011 [DEFERRED] Add lint scripts to `package.json`: lint, lint:fix, format, format:check, type-check, validate
- [X] T012 [MVP] Create `vitest.config.ts` with React plugin, jsdom environment, path aliases (@/, @shared), and coverage thresholds (80%)
- [X] T013 [P] [MVP] Create `test/setup.ts` file with Testing Library imports and test environment configuration

---

## Phase 3: User Story 1 - Secure Authentication System (Priority: P1) ✅ COMPLETE

**Goal**: Implement password hashing with bcrypt, rate limiting on auth endpoints, environment variable validation, prevent brute-force attacks

**Independent Test**: Register new user and verify password is hashed in data/users.json. Attempt 6 failed logins and verify 6th returns 429. Start server without SESSION_SECRET and verify it fails with error message.

**Constitution IV Status**: ✅ Alpha requirements met (bcrypt + env vars), ✅ Beta requirements met (rate limiting)

### Implementation for User Story 1

- [X] T014 [P] [US1] [MVP] Remove hardcoded session secret fallback in `server/routes.ts` line 23 - throw error if SESSION_SECRET not set
- [X] T015 [P] [US1] [MVP] Add environment variable validation at startup in `server/index.ts` - check SESSION_SECRET exists, reject if production with default value
- [X] T016 [P] [US1] [MVP] Import bcrypt in `server/routes.ts` and update registration handler to hash passwords with 10 rounds before storage
- [X] T017 [US1] [MVP] Update login Passport LocalStrategy in `server/routes.ts` lines 41-49 to use `bcrypt.compare()` instead of plain text comparison
- [X] T018 [P] [US1] [MVP] Create rate limiter middleware configuration in `server/routes.ts` - 15 min window, 5 max attempts, appropriate error messages
- [X] T019 [US1] [MVP] Apply rate limiter to POST /api/login route in `server/routes.ts`
- [X] T020 [US1] [MVP] Apply rate limiter to POST /api/register route in `server/routes.ts`
- [X] T021 [US1] [MVP] Apply rate limiter to POST /api/demo route in `server/routes.ts`
- [X] T022 [US1] [MVP] Update password serialization in Passport serializeUser to properly type user parameter in `server/routes.ts` line 58
- [X] T023 [US1] [MVP] Add password migration detection logic - return 403 with requiresReset flag if user.passwordVersion is missing

**Checkpoint**: ✅ Authentication is now secure - passwords hashed, rate limited, no hardcoded secrets. Ready for beta deployment.

---

## Phase 4: User Story 2 - Reliable Code Structure (Priority: P2) ✅ COMPLETE

**Goal**: Fix all 12 type safety violations by defining explicit TypeScript interfaces and removing `any` types

**Independent Test**: Run `npm run type-check` and verify zero TypeScript errors. Run `npm run lint` and verify zero complaints about `any` types.

**Constitution I Status**: ✅ All `any` types resolved or properly justified

### Implementation for User Story 2

- [X] T024 [P] [US2] [MVP] Fix TYPE1: Replace `z.custom<any>()` in `shared/routes.ts` conversations.list response with `z.array(conversationSchema)`
- [X] T025 [P] [US2] [MVP] Fix TYPE2: Replace `z.custom<any>()` in `shared/routes.ts` supporters.list response with proper schema containing mySupporters and supporting arrays
- [X] T026 [P] [US2] [MVP] Fix TYPE3: Update IStorage interface in `server/storage.ts` line 15 - change initialMessage parameter from `any` to `Message` type
- [X] T027 [P] [US2] [MVP] Fix TYPE4: Update createConversation implementation in `server/storage.ts` line 418 - use Message type for initialMessage parameter
- [X] T028 [P] [US2] [MVP] Fix TYPE5: Update passport.serializeUser in `server/routes.ts` line 58 - use `(user: User, done)` instead of `(user: any, done)`
- [X] T029 [P] [US2] [MVP] Fix TYPE6-7: Replace sanitizeUser and requireAuth function signatures in `server/routes.ts` lines 74, 122 - use proper Middleware and AuthMiddleware types from server/types.ts
- [X] T030 [US2] [MVP] Fix TYPE8: Update all route handlers in `server/routes.ts` lines 131-304 to use RouteHandler or AuthHandler types instead of `(req: any, res)`
- [X] T031 [P] [US2] [MVP] Fix TYPE9: Update UpdateCard component in `client/src/pages/Dashboard.tsx` line 115 - replace `any` with `Conversation` type from @shared/schema
- [X] T032 [P] [US2] [MVP] Fix TYPE10: Update onSubmit handler in `client/src/pages/Auth.tsx` line 49 - replace `any` with proper form data type
- [X] T033 [P] [US2] [MVP] Fix TYPE11: Improve error handling in `client/src/components/invite-supporter-dialog.tsx` line 50 - use `error instanceof Error` check instead of `error: any`
- [X] T034 [P] [US2] [MVP] Fix TYPE12: Fix textareaRef type assertion in `client/src/components/create-update-dialog.tsx` line 245 - use proper React ref typing
- [X] T035 [US2] [MVP] Run `npm run type-check` and verify zero TypeScript compilation errors across entire codebase

**Checkpoint**: ✅ All type safety violations resolved. Code is fully typed and compile-time safe.

---

## Phase 5: User Story 3 - Automated Testing Coverage (Priority: P3)

**Goal**: Implement authentication security tests (MVP) + defer comprehensive coverage (Principle X: YAGNI)

**Independent Test**: Run `npm test -- --coverage` and verify authentication flows are tested. Defer storage/hook tests until needed.

**Constitution II Status**: ⚠️ Infrastructure ready, MVP tests pending, comprehensive coverage deferred

### Test Infrastructure Setup

- [X] T036 [US3] [MVP] Create test setup with example test in `test/setup.test.ts` to verify Vitest configuration works
- [ ] T037 [P] [US3] [DEFERRED] Create mock data fixtures in `test/fixtures/users.ts` for test users with hashed passwords - *Create as needed*
- [ ] T038 [P] [US3] [DEFERRED] Create mock data fixtures in `test/fixtures/conversations.ts` for test conversations and messages - *Create as needed*

### Authentication Tests (Critical Path - MVP REQUIRED)

- [ ] T039 [P] [US3] [MVP] Create `server/routes.test.ts` - test suite structure with supertest setup
- [ ] T040 [P] [US3] [MVP] Write test "rejects login with incorrect password" - POST /api/login with wrong password returns 401
- [ ] T041 [P] [US3] [MVP] Write test "accepts login with correct bcrypt password" - register user, then login successfully returns 200 with user object
- [ ] T042 [P] [US3] [MVP] Write test "hashes password on registration" - POST /api/register, verify password in storage is bcrypt hash format
- [ ] T043 [P] [US3] [MVP] Write test "rate limits failed login attempts" - make 5 failed attempts, verify 6th returns 429 with retryAfter
- [ ] T044 [P] [US3] [MVP] Write test "rate limit resets after window" - verify rate limit counter resets behavior
- [ ] T045 [P] [US3] [MVP] Write test "returns 403 for users requiring password migration" - user without passwordVersion triggers migration flow
- [ ] T046 [P] [US3] [MVP] Write test "validates SESSION_SECRET requirement" - test environment validation logic

### Storage Layer Tests (DEFERRED - Temporary File Storage)

- [ ] T047 [P] [US3] [DEFERRED] Create `server/storage.test.ts` - test suite for FileStorage class - *Defer until PostgreSQL migration (Principle X: file storage is temporary)*
- [ ] T048 [P] [US3] [DEFERRED] Write test "creates conversation with initial message" - verify createConversation properly stores data
- [ ] T049 [P] [US3] [DEFERRED] Write test "retrieves conversations for user" - verify getConversationsForUser returns correct data
- [ ] T050 [P] [US3] [DEFERRED] Write test "adds message to conversation" - verify addMessage appends correctly
- [ ] T051 [P] [US3] [DEFERRED] Write test "handles missing user gracefully" - verify proper error handling for invalid user ID
- [ ] T052 [P] [US3] [DEFERRED] Write test "handles file system errors" - verify error handling when data files inaccessible

### React Hook Tests (DEFERRED - UI Stable, No Regressions)

- [ ] T053 [P] [US3] [DEFERRED] Create `client/src/hooks/use-auth.test.ts` - test suite for useAuth hook with QueryClientProvider wrapper - *Defer until UI regressions emerge (Principle X: UI is stable)*
- [ ] T054 [P] [US3] [DEFERRED] Write test "useAuth returns null when not authenticated"
- [ ] T055 [P] [US3] [DEFERRED] Write test "useAuth returns user after successful login"
- [ ] T056 [P] [US3] [DEFERRED] Write test "useAuth handles logout correctly"
- [ ] T057 [P] [US3] [DEFERRED] Create `client/src/hooks/use-conversations.test.ts` - test suite for useConversations hook
- [ ] T058 [P] [US3] [DEFERRED] Write test "useConversations fetches conversation list"
- [ ] T059 [P] [US3] [DEFERRED] Write test "useConversations invalidates cache after mutation"

### Schema Validation Tests (DEFERRED - Runtime Validation Sufficient)

- [ ] T060 [P] [US3] [DEFERRED] Create `shared/schema.test.ts` - test Zod schema validation - *Defer (Principle X: Zod validates at runtime already)*
- [ ] T061 [P] [US3] [DEFERRED] Write test "User schema validates correct registration data"
- [ ] T062 [P] [US3] [DEFERRED] Write test "User schema rejects passwords shorter than 8 characters"
- [ ] T063 [P] [US3] [DEFERRED] Write test "Message schema validates complete message structure"
- [ ] T064 [US3] [MVP] Run `npm test -- --coverage` and verify:
  - 80%+ coverage achieved for authentication flows in `server/routes.ts`
  - Storage/hooks coverage deferred until needed

**Checkpoint**: ⚠️ Authentication tests operational (MVP). Comprehensive coverage deferred per Principle X.

---

## Phase 6: User Story 4 - Consistent Code Quality Standards (Priority: P4)

**Goal**: Run linting once for audit compliance (MVP) - defer automation (Principle X: YAGNI)

**Independent Test**: Run `npm run lint` and verify <10 non-critical violations acceptable for beta.

**Constitution VII Status**: ⚠️ Config exists (Phase 2 complete), run once for baseline, defer automation

### Implementation for User Story 4 (SIMPLIFIED)

- [X] T065 [P] [US4] [DEFERRED] Add ESLint ignore patterns to `.eslintrc.json` - exclude dist/, node_modules/, *.config.js - *Already in config*
- [X] T066 [P] [US4] [DEFERRED] Add Prettier ignore file `.prettierignore` excluding dist/, node_modules/, coverage/ - *Already exists*
- [ ] T067 [US4] [MVP] Run initial `npm run lint` to generate baseline violation report and save output for review
- [ ] T068 [US4] [MVP] Run `npm run lint:fix` to automatically fix all auto-fixable violations
- [ ] T069 [US4] [DEFERRED] Manually review and fix remaining lint violations identified in T067 that couldn't be auto-fixed - *Accept <10 non-critical warnings (Principle X)*
- [ ] T070 [US4] [MVP] Run `npm run format` to format all TypeScript, JSON, and Markdown files
- [ ] T071 [US4] [DEFERRED] Verify `npm run lint` reports zero violations after fixes - *Not required for MVP*
- [ ] T072 [US4] [DEFERRED] Verify `npm run format:check` reports all files properly formatted - *Not required for MVP*
- [ ] T073 [P] [US4] [DEFERRED] (OPTIONAL) Install Husky for pre-commit hooks: `npm install -D husky lint-staged` - *Premature automation (Principle X)*
- [ ] T074 [P] [US4] [DEFERRED] (OPTIONAL) Configure lint-staged in `package.json` to run ESLint and Prettier on staged files
- [ ] T075 [P] [US4] [DEFERRED] (OPTIONAL) Create pre-commit hook with `npx husky add .husky/pre-commit "npx lint-staged"`

**Checkpoint**: ⚠️ Linting run once for audit baseline. Zero violations not required for beta per Principle X.

---

## Phase 7: User Story 5 - Production Deployment Readiness (Priority: P2)

**Goal**: Automate IIS deployment + add CSRF protection (Constitution IV beta requirement)

**Independent Test**: Run build process and verify dist/ contains validated web.config, data directory structure. Deploy to IIS staging and verify write permissions work, application starts successfully.

**Constitution IX Status**: ⚠️ In progress - deployment automation + CSRF protection needed

### Build Process Updates (MVP REQUIRED)

- [ ] T076 [P] [US5] [MVP] Update `script/build.ts` - add data directory creation logic after server build (mkdir dist/data/conversations)
- [ ] T077 [P] [US5] [MVP] Update `script/build.ts` - copy initial data files (users.json, supporters.json, quotes.json) to dist/data or create empty arrays
- [ ] T078 [P] [US5] [MVP] Update `script/build.ts` - initialize conversations metadata files (meta.json with lastConversationId: 0, index.json with [])
- [ ] T079 [US5] [MVP] Update `script/build.ts` - add web.config validation logic checking for iisnode handler and correct entry point path
- [ ] T080 [US5] [MVP] Test build process - run `npm run build` and verify dist/ structure is complete

### Deployment Automation (MVP REQUIRED)

- [ ] T081 [P] [US5] [MVP] Create `script/deploy-iis.ps1` PowerShell script - parameter validation for SitePath and AppPoolName
- [ ] T082 [P] [US5] [MVP] Add data directory permission configuration to `script/deploy-iis.ps1` - Get-Acl, set IIS_IUSRS Modify permissions, Set-Acl
- [ ] T083 [P] [US5] [MVP] Add web.config validation to `script/deploy-iis.ps1` - check file exists and contains iisnode configuration
- [ ] T084 [P] [US5] [MVP] Add entry point validation to `script/deploy-iis.ps1` - verify index.cjs exists in site path
- [ ] T085 [P] [US5] [MVP] Add conversations structure initialization to `script/deploy-iis.ps1` - create directories and initialize JSON files if missing
- [ ] T086 [P] [US5] [MVP] Add deployment summary output to `script/deploy-iis.ps1` - success message with next steps (configure env vars, npm install, iisreset)

### CSRF Protection (NEW - Constitution IV Beta Requirement)

- [ ] T091b [P] [US5] [MVP] **NEW**: Implement CSRF protection for beta deployment:
  - Configure `express.json()` with size limits (prevent large payload DoS)
  - Set `sameSite: 'strict'` on session cookies (prevent CSRF via cookie security)
  - Add `Strict-Transport-Security` header for HTTPS enforcement
  - Document: Full CSRF tokens deferred until production if needed (Principle X: start simple)

### Documentation Updates (DEFERRED)

- [ ] T087 [P] [US5] [DEFERRED] Update `docs/domain/deployment-iis.md` - add section on environment variable configuration (IIS Configuration Editor steps) - *Document after successful deployment*
- [ ] T088 [P] [US5] [DEFERRED] Update `docs/domain/deployment-iis.md` - add section on running deploy-iis.ps1 script with examples
- [ ] T089 [P] [US5] [DEFERRED] Update `docs/domain/deployment-iis.md` - add troubleshooting section for common IIS deployment issues

### Deployment Validation (MVP REQUIRED)

- [ ] T090 [US5] [MVP] Test deployment script - run `script/deploy-iis.ps1 -SitePath "C:\test\site"` in test environment and verify permissions, structure, validation
- [ ] T091 [US5] [MVP] Test IIS deployment - deploy to IIS staging environment, configure SESSION_SECRET, restart IIS, verify application starts and handles requests
- [ ] T091a [P] [US5] [MVP] Implement health check endpoint (FR-042): Add `GET /api/health` route in `server/routes.ts` returning `{status: "ok", configValid: true, storageReady: true}` - validates env vars and storage access

**Checkpoint**: ✅ IIS deployment fully automated and validated with CSRF protection. Beta-ready.

---

## Phase 8: Polish & Cross-Cutting Concerns (MVP FOCUS)

**Purpose**: Essential validation only - defer documentation polish (Principle X)

**Note on T092 vs T096**: T092 deferred (individual checks sufficient). T096 (site-audit) is MVP requirement.

- [ ] T092 [P] [DEFERRED] Run `npm run validate` (type-check + lint + format:check + test) and ensure all checks pass - *Run individual checks instead*
- [ ] T093 [P] [DEFERRED] Update `README.md` with new npm scripts (lint, test, validate) and setup instructions referencing quickstart.md - *Update after deployment*
- [ ] T094 [P] [DEFERRED] Add GitHub Copilot examples to `.github/copilot-instructions.md` showing bcrypt usage, rate limiting patterns, test examples - *Add patterns as they emerge*
- [ ] T095 [P] [DEFERRED] Update `package.json` version and add keywords for security, testing, typescript - *Cosmetic, not blocking*
- [ ] T096 [MVP] Run site audit validation - execute `/speckit.site-audit` and verify compliance score improved from 38% to 70%+ (MVP target)
- [ ] T097 [DEFERRED] Review all acceptance scenarios from spec.md and manually verify each one passes - *Test critical auth path only*
- [ ] T098 [MVP] Perform manual security testing per quickstart.md validation checklist (password hash, rate limiting, env var validation, CSRF headers)
- [ ] T099 [DEFERRED] Review all documentation for accuracy and completeness (spec.md, plan.md, research.md, data-model.md, quickstart.md, contracts/) - *Update post-deployment*
- [ ] T100 [DEFERRED] Create password migration communication plan for existing users (email template, UI messaging for 403 responses) - *Create when migration needed*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T005) - BLOCKS all user stories
- **User Story 1 - Security (Phase 3)**: Depends on Foundational (T006-T013) - CRITICAL priority
- **User Story 2 - Type Safety (Phase 4)**: Depends on Foundational (T006-T008) - can run parallel to US1
- **User Story 3 - Testing (Phase 5)**: Depends on Foundational (T012-T013) AND User Story 1 (T014-T023) - tests verify secure auth
- **User Story 4 - Code Quality (Phase 6)**: Depends on Foundational (T009-T011) - can run parallel to US1/US2
- **User Story 5 - Deployment (Phase 7)**: Depends on US1 completion (security must deploy) - can run parallel to US2/US3/US4
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (Security)**: CRITICAL - Must complete before production deployment
- **US2 (Type Safety)**: Independent - can start after Foundational
- **US3 (Testing)**: Depends on US1 - tests verify security features work correctly
- **US4 (Code Quality)**: Independent - can start after Foundational
- **US5 (Deployment)**: Depends on US1 - must deploy secure authentication

### Critical Path (Minimum MVP)

1. Setup (T001-T005) → ~1 hour
2. Foundational (T006-T013) → ~2 hours
3. **User Story 1 - Security (T014-T023)** → ~6 hours
4. **User Story 5 - Deployment** (T076-T091) → ~3 hours
5. Basic validation (T092, T097-T098) → ~1 hour

**Minimum MVP Timeline**: ~13 hours to deploy secure authentication

### Full Feature Timeline

- Setup + Foundational: ~3 hours
- User Story 1 (Security): ~6 hours
- User Story 2 (Type Safety): ~4 hours
- User Story 3 (Testing): ~12 hours
- User Story 4 (Code Quality): ~2 hours
- User Story 5 (Deployment): ~3 hours
- Polish: ~2 hours

**Total Estimated Effort**: ~32 hours (4 days single developer)

### Parallel Opportunities

**After Foundational Phase Complete:**
- Developer A: User Story 1 (Security) → T014-T023
- Developer B: User Story 2 (Type Safety) → T024-T035
- Developer C: User Story 4 (Code Quality) → T065-T075

**Within User Stories:**
- All tasks marked [P] can run in parallel within their phase
- US3 test files (T040-T064) can be written in parallel
- US5 build and deployment tasks (T076-T089) can proceed in parallel

---

## Parallel Example: User Story 1 - Security

```bash
# These can all start simultaneously after T013 completes:
T014: Remove hardcoded session secret → server/routes.ts
T015: Add environment validation → server/index.ts
T016: Import bcrypt and update registration → server/routes.ts
T018: Create rate limiter configuration → server/routes.ts

# After bcrypt integrated (T016-T017):
T019: Apply rate limiter to /api/login
T020: Apply rate limiter to /api/register
T021: Apply rate limiter to /api/demo
```

---

## Parallel Example: User Story 3 - Tests

```bash
# All test files can be created in parallel after T036-T038:
T039-T046: Authentication tests → server/routes.test.ts
T047-T052: Storage tests → server/storage.test.ts
T053-T059: React hook tests → client/src/hooks/*.test.ts
T060-T063: Schema tests → shared/schema.test.ts
```

---

## Implementation Strategy

### MVP First (Security Only)

1. Complete Phases 1-2: Setup + Foundational (~3 hours)
2. Complete Phase 3: User Story 1 - Security (~6 hours)
3. Complete Phase 7 (partial): User Story 5 - Basic Deployment (~2 hours)
4. **VALIDATE**: Test authentication security manually
5. **DEPLOY**: IIS staging for validation

**MVP delivers**: Secure authentication system ready for production

### Incremental Delivery (Recommended)

1. **Week 1**: Setup + Foundational + US1 (Security) → Deploy secure MVP
2. **Week 2**: US2 (Type Safety) + US4 (Code Quality) → Deploy improved codebase
3. **Week 3**: US3 (Testing) → Comprehensive test coverage
4. **Week 4**: US5 (Deployment) + Polish → Production-ready

### Full Parallel (3 developers)

1. All: Complete Setup + Foundational together (~3 hours)
2. Split work:
   - Dev A: User Story 1 (Security) → 6 hours
   - Dev B: User Story 2 (Type Safety) + US4 (Code Quality) → 6 hours
   - Dev C: User Story 5 (Deployment prep) → 3 hours, then help with tests
3. All: User Story 3 (Testing) in parallel (~4 hours per person)
4. All: Polish together (~2 hours)

**Parallel Timeline**: ~15-16 hours elapsed time with 3 developers

---

## Validation Checklist

### After User Story 1 (Security)

- [ ] New user password stored as bcrypt hash in data/users.json
- [ ] Login with correct password succeeds
- [ ] Login with incorrect password fails with 401
- [ ] 6th failed login within 15min returns 429
- [ ] Server fails to start without SESSION_SECRET
- [ ] Rate limit headers present in auth responses

### After User Story 2 (Type Safety)

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes with zero `any` violations
- [ ] All API route handlers properly typed
- [ ] AuthenticatedRequest used in protected routes

### After User Story 3 (Testing)

- [ ] `npm test` passes all tests
- [ ] Coverage report shows 80%+ for server/routes.ts
- [ ] Coverage report shows 80%+ for server/storage.ts
- [ ] Authentication flow fully tested
- [ ] Storage layer fully tested

### After User Story 4 (Code Quality)

- [ ] `npm run lint` reports zero violations
- [ ] `npm run format:check` confirms all files formatted
- [ ] Code follows consistent import order
- [ ] (If configured) Pre-commit hooks block non-compliant commits

### After User Story 5 (Deployment)

- [ ] `npm run build` completes successfully
- [ ] dist/ contains index.cjs, public/, web.config, data/
- [ ] web.config validated during build
- [ ] deploy-iis.ps1 runs without errors
- [ ] Data directory has IIS_IUSRS Modify permissions
- [ ] Application starts in IIS and serves requests

### Final Validation

- [ ] Run `/speckit.site-audit` and verify 90%+ compliance
- [ ] Constitution compliance improved from 38% to 90%+
- [ ] Security score improved from 25% to 100%
- [ ] Zero CRITICAL issues remain
- [ ] Zero HIGH security issues remain
- [ ] All acceptance scenarios from spec.md pass

---

## Notes

- Tasks marked [P] can run in parallel (different files, no blocking dependencies)
- Tasks marked [Story] trace to specific user story in spec.md
- Security (US1) is CRITICAL - must complete before production
- Testing (US3) verifies security implementation works correctly
- Each user story delivers independent value and can be validated separately
- Commit after completing each user story phase
- Stop at any checkpoint to validate story works independently
- Use quickstart.md for setup and validation procedures
- Reference research.md for implementation patterns and decisions

---

**Total Tasks**: 102 (100 original + T091a health check + T091b CSRF protection)  
**MVP Tasks**: ~50 (35 complete + ~15 remaining)  
**DEFERRED Tasks**: ~52 (storage tests, hook tests, schema tests, linting automation, documentation)  
**Completed**: 35/102 (34%)  
**MVP Progress**: 35/50 (70% - on track for beta deployment)  

**Constitution Alignment**: v1.3.0 (Principle X: Simplicity First applied)  
**Generated**: 2026-02-01  
**Feature**: 001-audit-compliance-fixes  
**Ready for**: MVP Beta Deployment (6 hours remaining)  
**Last Updated**: 2026-02-01 (Constitution v1.3.0 MVP focus applied)
