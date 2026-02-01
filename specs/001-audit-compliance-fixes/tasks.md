# Tasks: Production Readiness - Critical Compliance Fixes

**Input**: Design documents from `/specs/001-audit-compliance-fixes/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Yes - User Story 3 explicitly requests comprehensive automated testing

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [ ] T001 Install security dependencies: `npm install bcrypt express-rate-limit`
- [ ] T002 [P] Install type definition packages: `npm install -D @types/bcrypt`
- [ ] T003 [P] Install testing dependencies: `npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest @types/supertest`
- [ ] T004 [P] Install linting dependencies: `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier prettier`
- [ ] T005 Create `.env.example` file documenting all required environment variables (SESSION_SECRET, NODE_ENV, DATABASE_URL)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and configuration that MUST be complete before user story work

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete

- [ ] T006 Create `server/types.ts` with AuthenticatedRequest interface, Middleware types, AuthHandler, RouteHandler, ErrorHandler types
- [ ] T007 [P] Export Message schema in `shared/schema.ts` with proper Zod validation (id, conversationId, authorId, content, timestamp fields)
- [ ] T008 [P] Update User schema in `shared/schema.ts` to include passwordVersion field and input validation (8-72 char range)
- [ ] T009 Create `.prettierrc.json` configuration file with project formatting rules (semi: true, singleQuote: false, printWidth: 100)
- [ ] T010 [P] Create `.eslintrc.json` configuration with TypeScript, React rules, and no-explicit-any error
- [ ] T011 Add lint scripts to `package.json`: lint, lint:fix, format, format:check, type-check, validate
- [ ] T012 Create `vitest.config.ts` with React plugin, jsdom environment, path aliases (@/, @shared), and coverage thresholds (80%)
- [ ] T013 [P] Create `test/setup.ts` file with Testing Library imports and test environment configuration

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Authentication System (Priority: P1) 🎯 MVP SECURITY

**Goal**: Implement password hashing with bcrypt, rate limiting on auth endpoints, environment variable validation, prevent brute-force attacks

**Independent Test**: Register new user and verify password is hashed in data/users.json. Attempt 6 failed logins and verify 6th returns 429. Start server without SESSION_SECRET and verify it fails with error message.

### Implementation for User Story 1

- [ ] T014 [P] [US1] Remove hardcoded session secret fallback in `server/routes.ts` line 23 - throw error if SESSION_SECRET not set
- [ ] T015 [P] [US1] Add environment variable validation at startup in `server/index.ts` - check SESSION_SECRET exists, reject if production with default value
- [ ] T016 [P] [US1] Import bcrypt in `server/routes.ts` and update registration handler to hash passwords with 10 rounds before storage
- [ ] T017 [US1] Update login Passport LocalStrategy in `server/routes.ts` lines 41-49 to use `bcrypt.compare()` instead of plain text comparison
- [ ] T018 [P] [US1] Create rate limiter middleware configuration in `server/routes.ts` - 15 min window, 5 max attempts, appropriate error messages
- [ ] T019 [US1] Apply rate limiter to POST /api/login route in `server/routes.ts`
- [ ] T020 [US1] Apply rate limiter to POST /api/register route in `server/routes.ts`
- [ ] T021 [US1] Apply rate limiter to POST /api/demo route in `server/routes.ts`
- [ ] T022 [US1] Update password serialization in Passport serializeUser to properly type user parameter in `server/routes.ts` line 58
- [ ] T023 [US1] Add password migration detection logic - return 403 with requiresReset flag if user.passwordVersion is missing

**Checkpoint**: Authentication is now secure - passwords hashed, rate limited, no hardcoded secrets. Can deploy User Story 1 as MVP.

---

## Phase 4: User Story 2 - Reliable Code Structure (Priority: P2)

**Goal**: Fix all 12 type safety violations by defining explicit TypeScript interfaces and removing `any` types

**Independent Test**: Run `npm run type-check` and verify zero TypeScript errors. Run `npm run lint` and verify zero complaints about `any` types.

### Implementation for User Story 2

- [ ] T024 [P] [US2] Fix TYPE1: Replace `z.custom<any>()` in `shared/routes.ts` conversations.list response with `z.array(conversationSchema)`
- [ ] T025 [P] [US2] Fix TYPE2: Replace `z.custom<any>()` in `shared/routes.ts` supporters.list response with proper schema containing mySupporters and supporting arrays
- [ ] T026 [P] [US2] Fix TYPE3: Update IStorage interface in `server/storage.ts` line 15 - change initialMessage parameter from `any` to `Message` type
- [ ] T027 [P] [US2] Fix TYPE4: Update createConversation implementation in `server/storage.ts` line 418 - use Message type for initialMessage parameter
- [ ] T028 [P] [US2] Fix TYPE5: Update passport.serializeUser in `server/routes.ts` line 58 - use `(user: User, done)` instead of `(user: any, done)`
- [ ] T029 [P] [US2] Fix TYPE6-7: Replace sanitizeUser and requireAuth function signatures in `server/routes.ts` lines 74, 122 - use proper Middleware and AuthMiddleware types from server/types.ts
- [ ] T030 [US2] Fix TYPE8: Update all route handlers in `server/routes.ts` lines 131-304 to use RouteHandler or AuthHandler types instead of `(req: any, res)`
- [ ] T031 [P] [US2] Fix TYPE9: Update UpdateCard component in `client/src/pages/Dashboard.tsx` line 115 - replace `any` with `Conversation` type from @shared/schema
- [ ] T032 [P] [US2] Fix TYPE10: Update onSubmit handler in `client/src/pages/Auth.tsx` line 49 - replace `any` with proper form data type
- [ ] T033 [P] [US2] Fix TYPE11: Improve error handling in `client/src/components/invite-supporter-dialog.tsx` line 50 - use `error instanceof Error` check instead of `error: any`
- [ ] T034 [P] [US2] Fix TYPE12: Fix textareaRef type assertion in `client/src/components/create-update-dialog.tsx` line 245 - use proper React ref typing
- [ ] T035 [US2] Run `npm run type-check` and verify zero TypeScript compilation errors across entire codebase

**Checkpoint**: All type safety violations resolved. Code is fully typed and compile-time safe.

---

## Phase 5: User Story 3 - Automated Testing Coverage (Priority: P3)

**Goal**: Implement comprehensive test suite for authentication, storage, and React hooks achieving 80%+ coverage

**Independent Test**: Run `npm test -- --coverage` and verify 80%+ coverage for server/routes.ts and server/storage.ts. All tests pass.

### Test Infrastructure Setup

- [ ] T036 [US3] Create test setup with example test in `test/setup.test.ts` to verify Vitest configuration works
- [ ] T037 [P] [US3] Create mock data fixtures in `test/fixtures/users.ts` for test users with hashed passwords
- [ ] T038 [P] [US3] Create mock data fixtures in `test/fixtures/conversations.ts` for test conversations and messages

### Authentication Tests (Critical Path)

- [ ] T039 [P] [US3] Create `server/routes.test.ts` - test suite structure with supertest setup
- [ ] T040 [P] [US3] Write test "rejects login with incorrect password" - POST /api/login with wrong password returns 401
- [ ] T041 [P] [US3] Write test "accepts login with correct bcrypt password" - register user, then login successfully returns 200 with user object
- [ ] T042 [P] [US3] Write test "hashes password on registration" - POST /api/register, verify password in storage is bcrypt hash format
- [ ] T043 [P] [US3] Write test "rate limits failed login attempts" - make 5 failed attempts, verify 6th returns 429 with retryAfter
- [ ] T044 [P] [US3] Write test "rate limit resets after window" - verify rate limit counter resets behavior
- [ ] T045 [P] [US3] Write test "returns 403 for users requiring password migration" - user without passwordVersion triggers migration flow
- [ ] T046 [P] [US3] Write test "validates SESSION_SECRET requirement" - test environment validation logic

### Storage Layer Tests

- [ ] T047 [P] [US3] Create `server/storage.test.ts` - test suite for FileStorage class
- [ ] T048 [P] [US3] Write test "creates conversation with initial message" - verify createConversation properly stores data
- [ ] T049 [P] [US3] Write test "retrieves conversations for user" - verify getConversationsForUser returns correct data
- [ ] T050 [P] [US3] Write test "adds message to conversation" - verify addMessage appends correctly
- [ ] T051 [P] [US3] Write test "handles missing user gracefully" - verify proper error handling for invalid user ID
- [ ] T052 [P] [US3] Write test "handles file system errors" - verify error handling when data files inaccessible

### React Hook Tests

- [ ] T053 [P] [US3] Create `client/src/hooks/use-auth.test.ts` - test suite for useAuth hook with QueryClientProvider wrapper
- [ ] T054 [P] [US3] Write test "useAuth returns null when not authenticated"
- [ ] T055 [P] [US3] Write test "useAuth returns user after successful login"
- [ ] T056 [P] [US3] Write test "useAuth handles logout correctly"
- [ ] T057 [P] [US3] Create `client/src/hooks/use-conversations.test.ts` - test suite for useConversations hook
- [ ] T058 [P] [US3] Write test "useConversations fetches conversation list"
- [ ] T059 [P] [US3] Write test "useConversations invalidates cache after mutation"

### Schema Validation Tests

- [ ] T060 [P] [US3] Create `shared/schema.test.ts` - test Zod schema validation
- [ ] T061 [P] [US3] Write test "User schema validates correct registration data"
- [ ] T062 [P] [US3] Write test "User schema rejects passwords shorter than 8 characters"
- [ ] T063 [P] [US3] Write test "Message schema validates complete message structure"
- [ ] T064 [US3] Run `npm test -- --coverage` and verify:
  - 80%+ coverage achieved for `server/routes.ts`
  - 80%+ coverage achieved for `server/storage.ts`
  - Client hooks (`client/src/hooks/`) have test files with reasonable coverage (target: 60%+)

**Checkpoint**: Comprehensive test suite operational. 80%+ coverage on critical modules. All tests passing.

---

## Phase 6: User Story 4 - Consistent Code Quality Standards (Priority: P4)

**Goal**: Configure and run ESLint + Prettier to enforce code quality standards and eliminate all violations

**Independent Test**: Run `npm run lint` and verify zero violations across entire codebase. Run `npm run format:check` and verify all files properly formatted.

### Implementation for User Story 4

- [ ] T065 [P] [US4] Add ESLint ignore patterns to `.eslintrc.json` - exclude dist/, node_modules/, *.config.js
- [ ] T066 [P] [US4] Add Prettier ignore file `.prettierignore` excluding dist/, node_modules/, coverage/
- [ ] T067 [US4] Run initial `npm run lint` to generate baseline violation report and save output for review
- [ ] T068 [US4] Run `npm run lint:fix` to automatically fix all auto-fixable violations
- [ ] T069 [US4] Manually review and fix remaining lint violations identified in T067 that couldn't be auto-fixed
- [ ] T070 [US4] Run `npm run format` to format all TypeScript, JSON, and Markdown files
- [ ] T071 [US4] Verify `npm run lint` reports zero violations after fixes
- [ ] T072 [US4] Verify `npm run format:check` reports all files properly formatted
- [ ] T073 [P] [US4] (OPTIONAL) Install Husky for pre-commit hooks: `npm install -D husky lint-staged`
- [ ] T074 [P] [US4] (OPTIONAL) Configure lint-staged in `package.json` to run ESLint and Prettier on staged files
- [ ] T075 [P] [US4] (OPTIONAL) Create pre-commit hook with `npx husky add .husky/pre-commit "npx lint-staged"`

**Checkpoint**: All code follows consistent style standards. Linting and formatting automated.

---

## Phase 7: User Story 5 - Production Deployment Readiness (Priority: P2)

**Goal**: Automate IIS deployment configuration, data directory permissions, web.config validation, environment setup

**Independent Test**: Run build process and verify dist/ contains validated web.config, data directory structure. Deploy to IIS staging and verify write permissions work, application starts successfully.

### Build Process Updates

- [ ] T076 [P] [US5] Update `script/build.ts` - add data directory creation logic after server build (mkdir dist/data/conversations)
- [ ] T077 [P] [US5] Update `script/build.ts` - copy initial data files (users.json, supporters.json, quotes.json) to dist/data or create empty arrays
- [ ] T078 [P] [US5] Update `script/build.ts` - initialize conversations metadata files (meta.json with lastConversationId: 0, index.json with [])
- [ ] T079 [US5] Update `script/build.ts` - add web.config validation logic checking for iisnode handler and correct entry point path
- [ ] T080 [US5] Test build process - run `npm run build` and verify dist/ structure is complete

### Deployment Automation

- [ ] T081 [P] [US5] Create `script/deploy-iis.ps1` PowerShell script - parameter validation for SitePath and AppPoolName
- [ ] T082 [P] [US5] Add data directory permission configuration to `script/deploy-iis.ps1` - Get-Acl, set IIS_IUSRS Modify permissions, Set-Acl
- [ ] T083 [P] [US5] Add web.config validation to `script/deploy-iis.ps1` - check file exists and contains iisnode configuration
- [ ] T084 [P] [US5] Add entry point validation to `script/deploy-iis.ps1` - verify index.cjs exists in site path
- [ ] T085 [P] [US5] Add conversations structure initialization to `script/deploy-iis.ps1` - create directories and initialize JSON files if missing
- [ ] T086 [P] [US5] Add deployment summary output to `script/deploy-iis.ps1` - success message with next steps (configure env vars, npm install, iisreset)

### Documentation Updates

- [ ] T087 [P] [US5] Update `docs/domain/deployment-iis.md` - add section on environment variable configuration (IIS Configuration Editor steps)
- [ ] T088 [P] [US5] Update `docs/domain/deployment-iis.md` - add section on running deploy-iis.ps1 script with examples
- [ ] T089 [P] [US5] Update `docs/domain/deployment-iis.md` - add troubleshooting section for common IIS deployment issues

### Deployment Validation

- [ ] T090 [US5] Test deployment script - run `script/deploy-iis.ps1 -SitePath "C:\test\site"` in test environment and verify permissions, structure, validation
- [ ] T091 [US5] Test IIS deployment - deploy to IIS staging environment, configure SESSION_SECRET, restart IIS, verify application starts and handles requests
- [ ] T091a [P] [US5] Implement health check endpoint (FR-042): Add `GET /api/health` route in `server/routes.ts` returning `{status: "ok", configValid: true, storageReady: true}` - validates env vars and storage access

**Checkpoint**: IIS deployment fully automated and validated. Application deploys successfully with correct permissions and configuration.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation updates, cleanup

**Note on T092 vs T096**: T092 (`npm run validate`) runs technical checks (TypeScript, linting, tests). T096 (site-audit) runs comprehensive architectural and constitution compliance analysis. Both are required for full validation.

- [ ] T092 [P] Run `npm run validate` (type-check + lint + format:check + test) and ensure all checks pass
- [ ] T093 [P] Update `README.md` with new npm scripts (lint, test, validate) and setup instructions referencing quickstart.md
- [ ] T094 [P] Add GitHub Copilot examples to `.github/copilot-instructions.md` showing bcrypt usage, rate limiting patterns, test examples
- [ ] T095 [P] Update `package.json` version and add keywords for security, testing, typescript
- [ ] T096 Run site audit validation - execute `/speckit.site-audit` and verify compliance score improved from 38% to 90%+
- [ ] T097 Review all acceptance scenarios from spec.md and manually verify each one passes
- [ ] T098 Perform manual security testing per quickstart.md validation checklist (password hash, rate limiting, env var validation)
- [ ] T099 Review all documentation for accuracy and completeness (spec.md, plan.md, research.md, data-model.md, quickstart.md, contracts/)
- [ ] T100 Create password migration communication plan for existing users (email template, UI messaging for 403 responses)

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

**Total Tasks**: 101 (100 original + T091a health check)  
**Critical Path Tasks**: 23 (Setup + Foundational + US1 Security)  
**Parallelizable Tasks**: 63 (marked with [P])  
**Test Tasks**: 31 (US3 - all optional but recommended)  

**Generated**: 2026-02-01  
**Feature**: 001-audit-compliance-fixes  
**Ready for**: Implementation with GitHub Copilot  
**Last Updated**: 2026-02-01 (Analysis remediation applied)
