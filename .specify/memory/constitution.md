<!--
Sync Impact Report
==================
Version change: 0.0.0 → 1.0.0 (MAJOR: Initial formal constitution)
Modified principles: N/A (initial version)
Added sections: Core Principles (7), Technology Stack, Project Structure, Governance
Removed sections: None
Templates requiring updates:
  - plan-template.md: ✅ Constitution Check section aligns with principles
  - spec-template.md: ✅ Requirements section compatible
  - tasks-template.md: ✅ Phase structure compatible
Follow-up TODOs:
  - Add Vitest configuration (Principle II)
  - Add ESLint + Prettier configuration (Principle VII)
  - Implement bcrypt password hashing (Principle IV)
  - Implement rate limiting (Principle IV)
-->

# SupportSpark Constitution

A support network platform helping people share updates with their trusted support network during difficult times.

## Core Principles

### I. Type Safety (NON-NEGOTIABLE)

All code MUST maintain strict type safety through TypeScript and runtime validation.

- TypeScript `strict: true` mode MUST be enabled in tsconfig.json
- All data schemas MUST be defined using Zod in `shared/schema.ts`
- API request/response types MUST be validated at runtime with Zod
- Path aliases (`@/`, `@shared/`) MUST be used for imports
- No `any` types without explicit justification in code comments

**Rationale**: Strong typing prevents runtime errors and enables confident refactoring. Zod provides runtime validation that TypeScript alone cannot.

### II. Testing (NON-NEGOTIABLE)

All features MUST have automated tests to ensure reliability and catch regressions.

- All new features MUST have accompanying test files before merge
- Test files MUST be named `*.test.ts` or `*.test.tsx`
- Test framework: Vitest (preferred) or Jest
- API routes MUST have integration tests
- React hooks SHOULD have unit tests
- TDD cycle encouraged: Write tests → See them fail → Implement → Pass

**Rationale**: Tests enable safe refactoring and prevent regressions. No feature is complete without verification.

### III. UI Component Library (NON-NEGOTIABLE)

All user interface components MUST use the shadcn/ui component library for consistency and accessibility.

- All UI components MUST use shadcn/ui primitives from `@/components/ui/`
- Custom components MUST extend Radix UI primitives when applicable
- Tailwind CSS MUST be used for all styling
- Framer Motion SHOULD be used for animations
- New UI patterns SHOULD be added via `npx shadcn-ui@latest add`

**Rationale**: Consistent, accessible UI reduces cognitive load and ensures WCAG compliance through Radix primitives.

### IV. Security Standards (NON-NEGOTIABLE)

Security protections MUST be implemented before production deployment.

- User passwords MUST be hashed using bcrypt (minimum 10 rounds)
- Authentication endpoints MUST implement rate limiting
- CSRF protection MUST be implemented for state-changing operations
- Session secrets MUST be provided via environment variables (never hardcoded)
- File uploads MUST validate file types and enforce size limits
- SQL injection prevention MUST be ensured through parameterized queries

**Rationale**: Security vulnerabilities can cause irreversible harm. These are minimum viable protections.

### V. API Contract Pattern (NON-NEGOTIABLE)

All API endpoints MUST be defined in a shared contract for type-safe client-server communication.

- All API routes MUST be defined in `shared/routes.ts`
- Route definitions MUST include: method, path, input schema (if applicable), response schemas
- Error responses MUST use standardized error schemas from `errorSchemas`
- The `buildUrl()` helper MUST be used for parameterized URLs
- Breaking API changes MUST increment version or provide migration path

**Rationale**: Shared contracts eliminate client-server type mismatches and enable compile-time API validation.

### VI. State Management (RECOMMENDED)

Server state SHOULD be managed through TanStack React Query for consistency.

- Server state SHOULD be managed via TanStack React Query
- Query keys SHOULD follow the pattern `["/api/resource"]` or `["/api/resource", id]`
- Mutations SHOULD invalidate related queries on success
- Alternative state libraries (Redux, Zustand) MAY be used for complex client-only state
- Client state SHOULD prefer React's built-in useState/useReducer

**Rationale**: React Query provides caching, deduplication, and automatic refetching. Client state should remain simple.

### VII. Code Style & Formatting (NON-NEGOTIABLE)

Consistent code formatting MUST be enforced through tooling.

- ESLint MUST be configured with TypeScript and React rules
- Prettier MUST be configured for consistent formatting
- Pre-commit hooks SHOULD enforce linting before commits (husky/lint-staged)
- All code MUST pass linting before merge
- Import order: external deps → @shared → @/ → relative

**Rationale**: Automated formatting eliminates style debates and ensures consistent, readable code.

## Technology Stack

| Layer | Technology | Constraint |
|-------|------------|------------|
| Language | TypeScript 5.x (strict) | MUST remain strict mode |
| Frontend | React 19 + Vite | MUST use functional components |
| UI | shadcn/ui + Radix + Tailwind CSS | MUST use these libraries |
| State | TanStack React Query | SHOULD for server state |
| Routing | Wouter (frontend) | MAY change if needs grow |
| Backend | Express 5 | MUST remain Express |
| Auth | Passport.js + express-session | MUST implement bcrypt |
| Validation | Zod | MUST for all schemas |
| Testing | Vitest or Jest | MUST be configured |
| Linting | ESLint + Prettier | MUST be configured |
| Storage | File-based JSON (dev) / PostgreSQL (prod) | Production MUST use database |

## Project Structure

```
client/                    # React frontend (Vite)
  src/
    components/            # Custom + shadcn/ui components
      ui/                  # shadcn/ui primitives (do not edit directly)
    hooks/                 # Custom React hooks (use-*.ts)
    pages/                 # Route-level components
    lib/                   # Utilities, queryClient
      
server/                    # Express backend
  index.ts                 # Entry point with logging middleware
  routes.ts                # API route handlers (uses shared contract)
  storage.ts               # Data persistence layer (implements IStorage)
  
shared/                    # Shared between client & server
  schema.ts                # Zod schemas for all data models
  routes.ts                # API contract definitions
  
data/                      # File-based JSON storage (development only)
  users.json               # User accounts
  supporters.json          # Member-supporter relationships
  conversations/           # Individual conversation files
```

## Governance

- This constitution supersedes all other development practices
- Amendments require **lead developer approval** with documented rationale
- All PRs and code reviews MUST verify compliance with these principles
- Violations MUST be justified in PR description with business rationale
- Constitution review SHOULD occur quarterly or when major architectural changes are planned
- Use `replit.md` or project README for runtime development guidance

### Amendment Process

1. Propose change with rationale in a dedicated PR
2. Document impact on existing code
3. Obtain lead developer approval
4. Update version following semantic versioning:
   - MAJOR: Backward-incompatible principle changes or removals
   - MINOR: New principles or expanded guidance added
   - PATCH: Clarifications, wording improvements, typo fixes
5. Update `Last Amended` date

**Version**: 1.0.0 | **Ratified**: 2026-02-01 | **Last Amended**: 2026-02-01
