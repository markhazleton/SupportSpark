# Implementation Plan: Production Readiness - Critical Compliance Fixes

**Branch**: `001-audit-compliance-fixes` | **Date**: 2026-02-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-audit-compliance-fixes/spec.md`

**Note**: This plan addresses 24 critical issues identified in the 2026-02-01 site audit, organized into 5 prioritized implementation phases.

## Summary

This feature implements critical security hardening, type safety improvements, testing infrastructure, code quality tooling, and deployment readiness fixes required before production deployment. The site audit identified compliance score of 38% with 6 CRITICAL and 7 HIGH severity issues. This plan systematically addresses all blockers to achieve 90%+ compliance, focusing first on authentication security (password hashing, rate limiting, session secrets), then type safety (eliminating 12 `any` violations), testing infrastructure (0% → 80% coverage), code quality automation (ESLint/Prettier), and deployment configuration (IIS + environment handling).

## Technical Context

**Language/Version**: TypeScript 5.x (with strict mode enabled - tsconfig.json)  
**Primary Dependencies**: 
- Frontend: React 19, Vite, TanStack React Query, Wouter, shadcn/ui, Radix UI, Tailwind CSS
- Backend: Express 5, Passport.js, express-session, Zod
- **To Add**: bcrypt, express-rate-limit, vitest, eslint, prettier  
**Storage**: File-based JSON (development) → PostgreSQL (production - future phase)  
**Testing**: NONE CURRENTLY - must implement Vitest from scratch  
**Target Platform**: Windows 11 + IIS 10.0+ with iisnode  
**Project Type**: Full-stack web application (client/ + server/ + shared/)  
**Performance Goals**: Support 100 concurrent users, <2s page load, <200ms API response  
**Constraints**: 
- Must maintain backward compatibility with existing user data
- Must support IIS URL rewrite module for SPA routing
- Must complete security fixes before any production deployment
- Zero breaking changes to existing API contracts  
**Scale/Scope**: 
- ~78 TypeScript files, ~8k LOC
- 12 type safety violations to fix
- 24 audit issues across 5 categories
- 6 React pages, 44 UI components, 5 server modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Type Safety
**Status**: ⚠️ FAILING → MUST FIX  
**Current Violations**: 12 instances of unjustified `any` types across server routes, storage layer, and React components  
**Required Actions**:
- Define explicit TypeScript interfaces for Express request/response handlers
- Replace `z.custom<any>()` with proper Zod schemas in shared/routes.ts
- Create AuthenticatedRequest interface extending Express Request
- Type all error handling without generic catch-all types  
**Post-Fix Status**: ✅ MUST PASS - Zero `any` types without justification

### Principle II: Testing
**Status**: ❌ CRITICAL FAILURE → MUST IMPLEMENT  
**Current Violations**: Zero test files exist - 0% test coverage  
**Required Actions**:
- Create `vitest.config.ts` with React testing support
- Install testing dependencies (vitest, @testing-library/react, jsdom, supertest)
- Implement authentication flow integration tests (server/routes.test.ts)
- Implement storage layer unit tests (server/storage.test.ts)
- Implement React hook tests (client/src/hooks/*.test.ts)
- Achieve 80%+ coverage for auth and storage modules  
**Post-Fix Status**: ✅ MUST PASS - Test infrastructure operational with critical path coverage

### Principle III: UI Component Library
**Status**: ✅ PASSING → MAINTAIN  
**Current State**: All UI components properly use shadcn/ui primitives from @/components/ui/  
**This Feature Impact**: No changes to UI components necessary  
**Post-Fix Status**: ✅ REMAINS PASSING

### Principle IV: Security Standards
**Status**: ❌ CRITICAL FAILURE → MUST FIX  
**Current Violations**:
- SEC1: Passwords stored in plain text (server/routes.ts#L47-48)
- SEC2: Hardcoded session secret fallback (server/routes.ts#L23)
- SEC3: No rate limiting on authentication endpoints
- SEC4: Insufficient file upload validation  
**Required Actions**:
- Install and implement bcrypt for password hashing (10 rounds minimum)
- Remove hardcoded session secret fallback - fail fast if not configured
- Install and configure express-rate-limit (5 attempts per 15 min window)
- Add explicit filename sanitization for file uploads
- Create `.env.example` documenting required environment variables  
**Post-Fix Status**: ✅ MUST PASS - All CRITICAL security vulnerabilities resolved

### Principle V: API Contract Pattern
**Status**: ✅ PASSING → MAINTAIN  
**Current State**: All routes properly defined in shared/routes.ts with Zod schemas  
**This Feature Impact**: Type safety fixes will strengthen existing contracts  
**Post-Fix Status**: ✅ REMAINS PASSING (improved type definitions)

### Principle VI:State Management
**Status**: ✅ PASSING → MAINTAIN  
**Current State**: React Query properly implemented for server state management  
**This Feature Impact**: No changes to state management patterns necessary  
**Post-Fix Status**: ✅ REMAINS PASSING

### Principle VII: Code Style & Formatting
**Status**: ❌ CRITICAL FAILURE → MUST IMPLEMENT  
**Current Violations**: No ESLint or Prettier configuration exists  
**Required Actions**:
- Create `.eslintrc.json` with TypeScript and React rules
- Create `.prettierrc.json` for consistent formatting
- Install linting dependencies
- Add lint scripts to package.json (lint, lint:fix, format)
- Run initial auto-fix pass across codebase
- Optionally configure Husky pre-commit hooks  
**Post-Fix Status**: ✅ MUST PASS - All code passes linting with zero violations

### Principle VIII: Deployment & Hosting Standards
**Status**: ⚠️ PARTIAL COMPLIANCE → MUST COMPLETE  
**Current State**: web.config exists, build outputs CommonJS, but missing critical configuration  
**Current Violations**:
- DEPLOY1: Data directory permissions not automated
- DEPLOY2: Still using file-based JSON (production needs PostgreSQL - FUTURE PHASE)
- DEPLOY3: Environment variable documentation incomplete
- DEPLOY4: web.config not validated during build  
**Required Actions**:
- Update build script (script/build.ts) to create data directory structure
- Create deployment script for IIS_IUSRS permissions (PowerShell)
- Create comprehensive `.env.example` file
- Add web.config validation to build process
- Document IIS environment variable configuration in deployment guide  
**Post-Fix Status**: ✅ MUST PASS - IIS deployment ready (PostgreSQL migration deferred to future phase)

### Gate Evaluation Summary

| Gate | Pre-Fix | Post-Fix | Blocking? |
|------|---------|----------|-----------|
| Type Safety | ❌ FAIL | ✅ PASS | YES |
| Testing | ❌ FAIL | ✅ PASS | YES |
| UI Components | ✅ PASS | ✅ PASS | NO |
| Security | ❌ FAIL | ✅ PASS | YES |
| API Contracts | ✅ PASS | ✅ PASS | NO |
| State Management | ✅ PASS | ✅ PASS | NO |
| Code Style | ❌ FAIL | ✅ PASS | YES |
| Deployment | ⚠️ PARTIAL | ✅ PASS | YES |

**GATE DECISION**: ❌ **BLOCKED** - Must resolve 5 failing principles before production deployment

**Post-Implementation**: ✅ **APPROVED** - All gates will pass upon completion

## Project Structure

### Documentation (this feature)

```text
specs/001-audit-compliance-fixes/
├── spec.md                    # Feature specification (complete)
├── plan.md                    # This file - implementation plan
├── research.md                # Phase 0: Technology decisions and patterns
├── data-model.md              # Phase 1: Data structures (minimal - no new entities)
├── quickstart.md              # Phase 1: Setup and validation guide
├── contracts/                 # Phase 1: API contracts (updates to existing)
│   └── security-updates.md    # Documentation of security-related API changes
├── checklists/
│   └── requirements.md        # Spec quality validation (complete)
└── tasks.md                   # Phase 2: Generated by /speckit.tasks (NOT in this command)
```

### Source Code (repository root)

```text
client/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives (NO CHANGES)
│   │   ├── create-update-dialog.tsx    # Fix: TYPE12 - form data type
│   │   └── invite-supporter-dialog.tsx # Fix: TYPE11 - error handling
│   ├── hooks/
│   │   ├── use-auth.ts      # Fix: Add tests, maintain types
│   │   ├── use-conversations.ts # Fix: Add tests
│   │   └── use-supporters.ts    # Fix: Add tests
│   ├── pages/
│   │   ├── Auth.tsx         # Fix: TYPE10 - form submit handler
│   │   └── Dashboard.tsx    # Fix: TYPE9 - UpdateCard props
│   └── lib/
│       └── auth-utils.ts    # Affected by type fixes
└── src/                      # Test files (NEW)
    └── __tests__/           # If using centralized test dir
        └── hooks/           # Hook tests

server/
├── index.ts                 # Entry point (minimal changes for env validation)
├── routes.ts                # Fix: SEC1, SEC2, SEC3, TYPE5-8 - MAJOR CHANGES
│   # Split into modules (recommended):
│   ├── routes/              # Refactored structure (optional enhancement)
│   │   ├── auth.ts          # Authentication routes + bcrypt + rate limiting
│   │   ├── conversations.ts # Conversation CRUD (type fixes)
│   │   ├── supporters.ts    # Supporter relationships (type fixes)
│   │   └── uploads.ts       # SEC4 - file upload security
│   └── middleware/          # Extract middleware (optional enhancement)
│       ├── requireAuth.ts   # TYPE7 - properly typed auth middleware
│       └── rateLimiter.ts   # SEC3 - rate limiting configuration
├── storage.ts               # Fix: TYPE3-4 - Message type definitions
│   # Add tests:
│   └── storage.test.ts      # NEW - storage layer integration tests
├── types.ts                 # NEW - proper Express + Passport type definitions
└── __tests__/               # NEW - server tests
    └── routes.test.ts       # Authentication flow integration tests

shared/
├── schema.ts                # Export Message type, update User type for password
└── routes.ts                # Fix: TYPE1-2 - replace z.custom<any>() with proper schemas

script/
├── build.ts                 # Fix: DEPLOY1, DEPLOY4 - data dir + validation
└── deploy-iis.ps1           # NEW - IIS_IUSRS permissions automation

data/                         # Development storage
└── [existing structure]      # No changes needed

# NEW Configuration Files (root)
vitest.config.ts             # NEW - Vitest + React Testing Library
.eslintrc.json               # NEW - ESLint configuration
.prettierrc.json             # NEW - Prettier configuration
.env.example                 # NEW - DEPLOY3 - environment variable documentation

# UPDATED Configuration Files
tsconfig.json                # Update: paths for test files
package.json                 # Add: dev dependencies + lint scripts

dist/                        # Build output (unchanged structure)
├── index.cjs                # Server bundle
├── public/                  # Client assets
├── web.config               # Validated during build
└── data/                    # NEW - Created by build script
```

**Structure Decision**: Maintain existing web application structure (client/ + server/ + shared/). This feature primarily updates existing files with security, type safety, and testing improvements. Optional refactoring of `server/routes.ts` into modules is recommended but not required for initial implementation. Focus on fixes first, refactor second.

## Complexity Tracking

> **This section documents pre-existing violations being fixed by this feature**

| Violation | Why It Existed | Impact of Fix |
|-----------|----------------|---------------|
| Plain text passwords | Initial MVP prioritized speed over security | CRITICAL - Must migrate all existing user passwords, requires user action |
| Hardcoded secret fallback | Development convenience | CRITICAL - Will cause startup failure if SESSION_SECRET not set (intentional) |
| No rate limiting | Not implemented in initial release | HIGH - Prevents brute-force attacks, may affect legitimate users who mistype |
| 12 `any` type violations | Rapid prototyping without strict typing | MEDIUM - Improves type safety, may reveal hidden bugs during compilation |
| Zero test coverage | MVP shipped without test infrastructure | HIGH - Tests catch regressions but require significant setup time |
| No linting configuration | Not configured in initial project setup | LOW - Auto-fixes most issues, manual review needed for complex cases |
| File-based storage | Acceptable for development/demo | DEFERRED - PostgreSQL migration is separate epic, not blocking production |

**No New Complexity Added**: This feature reduces technical debt rather than adding complexity. All changes align with constitution principles established on 2026-02-01.

---

## Phase 0: Outline & Research

**Goal**: Research best practices and make technology decisions for each compliance fix

**Outputs**: `research.md` with decisions, rationale, and alternatives considered

### Research Tasks

1. **Password Hashing Implementation**
   - Research: bcrypt vs argon2 vs scrypt for Node.js
   - Decision criteria: Industry standard, Node.js compatibility, Windows support
   - Deliverable: Selected algorithm with configuration (rounds/cost factor)

2. **Rate Limiting Strategy**
   - Research: express-rate-limit vs rate-limiter-flexible vs custom implementation
   - Decision criteria: Express 5 compatibility, memory/Redis options, configuration flexibility
   - Deliverable: Selected library with window/limit configuration

3. **Testing Framework Configuration**
   - Research: Vitest setup for React + Express, test environment configuration
   - Decision criteria: Vite integration, speed, compatibility with existing build
   - Deliverable: Test infrastructure design (unit vs integration split, mock strategies)

4. **Type Safety Patterns**
   - Research: Express TypeScript patterns, Request augmentation, Passport.js typing
   - Decision criteria: Type safety level, maintainability, community patterns
   - Deliverable: Type definition structure for authenticated routes

5. **Linting Configuration**
   - Research: ESLint + Prettier integration, recommended rules for React + TypeScript
   - Decision criteria: Constitution alignment, common practice, auto-fix capability
   - Deliverable: Rule set configuration with justification

6. **IIS Deployment Automation**
   - Research: PowerShell ACL management, data directory setup patterns
   - Decision criteria: Idempotency, error handling, documentation
   - Deliverable: Deployment script structure

### Success Criteria for Phase 0
- All NEEDS CLARIFICATION items resolved
- Technology choices documented with rationale
- Implementation patterns established
- No blocking unknowns remain

---

## Phase 1: Design & Contracts

**Goal**: Define data structures, API changes, and quickstart guide

**Outputs**: `data-model.md`, `contracts/`, `quickstart.md`

### 1.1 Data Model Updates

**File**: `data-model.md`

**Changes Required**:

**User Schema (shared/schema.ts)**:
```typescript
// Current
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string(), // Plain text - VIOLATION
  // ...
});

// Required
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8), // Unhashed input
  // ...
});

export const storedUserSchema = insertUserSchema.extend({
  id: z.string(),
  password: z.string(), // Now represents bcrypt hash
  passwordVersion: z.literal('bcrypt-10').optional(), // Track hash algorithm
});
```

**New: AuthenticatedRequest Type (server/types.ts)**:
```typescript
import { type User } from "@shared/schema";
import { type Request } from "express";

export interface AuthenticatedRequest extends Request {
  user: User; // Properly typed user from Passport
}
```

**New: Rate Limit State** (in-memory, no schema change):
- Tracked per IP address
- Window: 15 minutes
- Max attempts: 5
- Library-managed state

**No Database Schema Changes**: This feature doesn't add new entities, only secures existing User model

### 1.2 API Contract Updates

**File**: `contracts/security-updates.md`

**Authentication Endpoints** (behavior changes, not breaking):

- `POST /api/login` - Rate limited (5/15min), password now verified via bcrypt
- `POST /api/register` - Rate limited (5/15min), password now hashed before storage
- `POST /api/demo` - Rate limited (5/15min)

**Response Changes**:
```typescript
// New error response for rate limiting
{
  message: "Too many login attempts, please try again later",
  retryAfter: 900 // seconds until window reset
}
```

**Breaking Changes**: NONE - All changes are backward compatible from client perspective

**Requires Environment Variables** (NEW):
```bash
SESSION_SECRET=<required-32-byte-hex>  # No fallback - app fails if missing
NODE_ENV=production|development
```

### 1.3 Type Safety Contract Updates

**File**: `shared/routes.ts`

**Before** (TYPE1-2 violations):
```typescript
export const api = {
  conversations: {
    list: {
      method: "GET" as const,
      path: "/api/conversations",
      responses: {
        200: z.custom<any>(), // VIOLATION
      },
    },
  },
};
```

**After** (Fixed):
```typescript
import { conversationSchema } from "./schema";

export const api = {
  conversations: {
    list: {
      method: "GET" as const,
      path: "/api/conversations",
      responses: {
        200: z.array(conversationSchema), // Properly typed
      },
    },
  },
};
```

### 1.4 Quickstart Guide

**File**: `quickstart.md`

**Contents**:
1. **Prerequisites**: Node.js 18+, Git
2. **Environment Setup**:
   ```bash
   # Copy and configure environment
   cp .env.example .env
   # Generate secure SESSION_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Add to .env file
   ```
3. **Install Dependencies**:
   ```bash
   npm install  # Includes new: bcrypt, express-rate-limit, vitest, eslint, prettier
   ```
4. **Run Linting**:
   ```bash
   npm run lint      # Check for violations
   npm run lint:fix  # Auto-fix style issues
   ```
5. **Run Tests**:
   ```bash
   npm test              # Run all tests
   npm test -- --ui      # Interactive test UI
   npm test -- --coverage # Coverage report
   ```
6. **Password Migration** (for existing users):
   ```bash
   # Users must reset passwords on next login
   # OR run migration script (to be created)
   ```
7. **Development Server**:
   ```bash
   npm run dev  # Starts with new security measures active
   ```
8. **Build & Deploy**:
   ```bash
   npm run build          # Creates dist/ with validated web.config
   # Deploy dist/ to IIS
   # Run: script/deploy-iis.ps1 -SitePath "C:\inetpub\wwwroot\supportspark"
   ```

### 1.5 Update Agent Context

**Action**: Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`

**Updates to `.github/copilot-instructions.md`**:
- Add bcrypt, express-rate-limit, vitest to technology stack table
- Update security standards section with implemented patterns
- Add testing patterns and examples
- Document linting configuration expectations
- Add deployment checklist updates

**Manual Additions Preserved**: Any content between markers `<!-- MANUAL_START -->` and `<!-- MANUAL_END -->` is preserved

### Success Criteria for Phase 1
- Data model changes documented with before/after examples
- API contract changes documented (none are breaking)
- Quickstart guide complete and tested
- Agent context updated with new technologies
- All deliverables ready for Phase 2 task generation

---

## Phase 2: Implementation Tasks

**Note**: Tasks are generated by `/speckit.tasks` command (NOT part of `/speckit.plan`)

**Expected Task Categories**:
1. Security hardening (bcrypt, rate limiting, secrets)
2. Type safety fixes (12 violations)
3. Test infrastructure setup
4. Test implementation (auth, storage, hooks)
5. Linting configuration
6. Deployment automation
7. Documentation updates

**Estimated Task Count**: 30-40 tasks across 5 implementation groups

**Required Before**: `/speckit.tasks` command creates `tasks.md` with detailed implementation checklist

---

## Implementation Order

**Critical Path** (must be sequential):
1. Phase 0: Research → Phase 1: Design → Phase 2: Tasks (via `/speckit.tasks`)
2. Within implementation: Security fixes → Type fixes → Tests → Linting → Deployment

**Can Parallelize**:
- Type safety fixes (independent across files)
- Test file creation (after test infrastructure exists)
- Linting configuration (independent of code fixes)

**Dependencies**:
- bcrypt implementation MUST complete before password migration
- Type definitions MUST exist before fixing type violations
- Test infrastructure MUST exist before writing tests
- All security fixes SHOULD complete before production deployment

---

## Validation & Success Metrics

### Automated Validation
- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `npm run lint` reports zero violations
- [ ] `npm test` runs with zero failures, 80%+ coverage on auth/storage
- [ ] `npm start` fails without SESSION_SECRET (intentional fail-fast)
- [ ] Site audit re-run shows 90%+ compliance score

### Manual Validation
- [ ] Existing user cannot login with old password (if migration needed)
- [ ] New user registration stores hashed password
- [ ] Login rate limiting blocks 6th attempt within 15 minutes
- [ ] All 12 `any` types resolved or justified
- [ ] IIS deployment succeeds with data directory write permissions
- [ ] Environment variables loaded from IIS configuration

### Compliance Scorecard (Post-Implementation)
| Metric | Before | Target | Validates |
|--------|--------|--------|-----------|
| Constitution Compliance | 38% | 90%+ | All principles |
| Security Score | 25% | 100% | Principle IV |
| Type Safety Violations | 12 | 0 | Principle I |
| Test Coverage | 0% | 80%+ | Principle II |
| Lint Violations | Unknown | 0 | Principle VII |
| CRITICAL Issues | 6 | 0 | Production readiness |
| HIGH Issues | 7 | 0 | Production readiness |

---

## Rollback Plan

**If Implementation Fails**:
1. Branch is isolated - no impact to main
2. Can abandon branch and restart
3. No database schema changes to roll back
4. Existing users unaffected until merge

**If Deployed to Production with Issues**:
1. **Password Migration Issue**: Users can reset via "forgot password"
2. **Rate Limiting Too Strict**: Adjust limits via environment or code hot-fix
3. **Type Errors**: Branch protects against merge, won't reach production
4. **Test Failures**: CI/CD blocks deployment
5. **IIS Permissions**: Run deploy-iis.ps1 script to re-apply permissions

**Monitoring**:
- Watch for increased 401 errors (rate limiting impact)
- Monitor login success rates
- Check error logs for environment variable issues
- Track test execution times in CI/CD

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Existing user lockout after password migration | HIGH | HIGH | Implement graceful password reset flow, clear user communication |
| Rate limiting blocks legitimate users | MEDIUM | MEDIUM | Conservative limits (5/15min), clear error messages, monitoring |
| Type fixes reveal hidden bugs | MEDIUM | HIGH | Comprehensive testing before merge, staged rollout |
| Test suite slows development | LOW | MEDIUM | Optimize test performance, parallel execution |
| IIS deployment script failures | MEDIUM | HIGH | Thorough testing in staging, manual fallback documented |
| Breaking changes to API contracts | LOW | CRITICAL | Careful review, no breaking changes planned |

**Overall Risk Level**: MEDIUM - Well-understood changes with clear mitigation strategies

---

## Next Steps

1. ✅ Review this implementation plan
2. ⏭️ **Run `/speckit.tasks`** to generate detailed task breakdown
3. ⏭️ Begin Phase 0: Research (create `research.md`)
4. ⏭️ Complete Phase 1: Design (create `data-model.md`, `contracts/`, `quickstart.md`)
5. ⏭️ Update agent context with new technologies
6. ⏭️ Begin implementation following task priority order
7. ⏭️ Run audit again after completion to validate improvements
