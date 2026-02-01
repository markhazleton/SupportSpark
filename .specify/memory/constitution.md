<!--
Sync Impact Report
==================
Version change: 1.2.1 → 1.3.0 (MINOR: Added simplicity principle, relaxed API contracts)
Modified principles:
  - Principle IV: UPDATED - Added timeline guidance (alpha/beta/production) for security measures
  - Principle V: DOWNGRADED from NON-NEGOTIABLE to RECOMMENDED - Added prototyping exception for API contracts
  - Principle X: NEW - Simplicity First (YAGNI/KISS/anti-premature-optimization)
Added sections: Principle X (Simplicity First)
Removed sections: None
Templates requiring updates:
  - plan-template.md: ✅ Emphasize starting simple, growing into complexity
  - spec-template.md: ✅ Add "Why now?" justification for complex features
  - tasks-template.md: ✅ Flag tasks that add complexity vs simplicity
Follow-up TODOs:
  - Review existing features for over-engineering (Principle X)
  - Remove premature abstractions and unused code (Principle X)
  - Ensure file-based storage has proper locking mechanisms (Principle VIII)
  - Implement progressive security timeline: alpha → beta → production (Principle IV)
  - Create web.config template with iisnode configuration (Principle IX)
  - Add deployment scripts for IIS (Principle IX)
  - Update build script to include web.config in dist/ (Principle IX)
  - Add Vitest configuration (Principle II)
  - Add ESLint + Prettier configuration (Principle VII)
  - Implement bcrypt password hashing (Principle IV - alpha phase)
  - Implement rate limiting (Principle IV - beta phase)
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

Security protections MUST be implemented before public deployment (beta/production).

- User passwords MUST be hashed using bcrypt (minimum 10 rounds)
- Authentication endpoints MUST implement rate limiting before public access
- CSRF protection MUST be implemented for state-changing operations in production
- Session secrets MUST be provided via environment variables (never hardcoded)
- File uploads MUST validate file types and enforce size limits
- SQL injection prevention MUST be ensured through parameterized queries

**Timeline Guidance**:
- Alpha (internal testing): Bcrypt + env variables required
- Beta (limited external): Add rate limiting + CSRF protection
- Production (public): All security measures fully implemented

**Rationale**: Security vulnerabilities can cause irreversible harm. These are minimum viable protections. However, not all security measures are needed for early internal testing—implement progressively as exposure increases.

### V. API Contract Pattern (RECOMMENDED)

API endpoints SHOULD be defined in a shared contract for type-safe client-server communication.

- API routes SHOULD be defined in `shared/routes.ts` as they stabilize
- Route definitions SHOULD include: method, path, input schema (if applicable), response schemas
- Error responses SHOULD use standardized error schemas from `errorSchemas`
- The `buildUrl()` helper SHOULD be used for parameterized URLs
- Breaking API changes MUST increment version or provide migration path

**Prototyping Exception**: During early prototyping, simple endpoint implementations without formal contracts are acceptable. Add contracts when:
- The endpoint design stabilizes
- Multiple clients use the endpoint
- Type safety becomes a maintenance burden

**Rationale**: Shared contracts eliminate client-server type mismatches and enable compile-time API validation. However, requiring contracts for every experimental endpoint creates unnecessary overhead during prototyping. Grow into this pattern as needs emerge.

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

### VIII. Data Storage Strategy (NON-NEGOTIABLE)

Storage solutions MUST be chosen based on actual needs, not premature optimization.

- JSON file storage on the server is ACCEPTABLE for:
  - Alpha phase deployments
  - Beta testing periods
  - Initial production rollout
  - Production preview environments
- Database migration MUST be justified by evidence from:
  - Traffic analysis showing scalability needs
  - Load testing revealing performance bottlenecks
  - Operational requirements (backup, replication, transactions)
- Premature optimization to database is PROHIBITED during early phases
- Data directory MUST have appropriate file system permissions
- File-based storage MUST implement proper locking for concurrent access
- When database migration IS justified, options include:
  - PostgreSQL (relational database)
  - Azure Cosmos DB (NoSQL, global distribution)
  - Other NoSQL solutions based on architecture needs
- Database selection MUST be based on access patterns, scalability requirements, and operational constraints

**Rationale**: Early-stage applications rarely need database complexity. JSON files provide simplicity, transparency, and easier debugging. Migrate only when data proves the need, avoiding premature optimization costs. Database choice should match actual usage patterns discovered during operation.

### IX. Deployment & Hosting Standards (NON-NEGOTIABLE)

The application MUST be deployable to Windows 11 with IIS for production hosting.

- Target hosting platform: Windows 11 + IIS 10.0+
- Build output MUST include both frontend static files and compiled backend
- Backend MUST compile to CommonJS format (`.cjs`) for iisnode compatibility
- The `web.config` file MUST be included with URL rewrite rules for:
  - Static file serving from `public/` directory
  - API routing to Node.js backend (iisnode)
  - SPA fallback routing for client-side navigation
- iisnode configuration MUST specify:
  - `node_env="production"` environment variable
  - Logging enabled with dedicated log directory
  - Appropriate process and connection limits
- Environment variables MUST be configurable via:
  - `.env` file for local development
  - IIS Configuration Editor for production deployment
- Data directory MUST have write permissions for `IIS_IUSRS` group
- Storage implementation MUST follow Principle VIII (Data Storage Strategy)
- SSL/TLS MUST be configured in IIS for HTTPS in production

**Build Requirements**:
- `npm run build` MUST produce deployment-ready artifacts in `dist/`
- `dist/index.cjs` = Compiled Express server (CommonJS)
- `dist/public/` = Frontend static assets
- Dependencies MUST be installed with `npm install --production` on server

**Rationale**: Standardizing on Windows 11 + IIS ensures consistent deployment processes, leverages enterprise Windows infrastructure, and provides robust hosting for production environments with native Windows integration.

### X. Simplicity First (NON-NEGOTIABLE)

Avoid premature optimization and over-engineering. Build what is needed now, not what might be needed later.

- YAGNI (You Aren't Gonna Need It): Do not add functionality until it is actually required
- KISS (Keep It Simple, Stupid): Prefer simple solutions over complex ones
- Start with the simplest implementation that could possibly work
- Add complexity only when proven necessary by real usage data
- Reject "nice to have" features that aren't solving current problems
- Refactor towards simplicity when complexity accumulates
- Question every dependency, abstraction, and pattern: "Do we need this now?"
- Prototype first, optimize later (only when measurements show the need)

**Examples of Simplicity First**:
- ✓ Use JSON files before databases (Principle VIII)
- ✓ Use React's useState before Redux/Zustand
- ✓ Write inline code before extracting utilities
- ✓ Use direct API calls before setting up API contracts for prototypes
- ✗ Building user roles system before multi-user access is needed
- ✗ Implementing caching before measuring performance problems
- ✗ Creating abstractions for code that's only used once

**Rationale**: Premature optimization wastes time on problems you don't have. Simple code is easier to understand, modify, and debug. Complexity should be earned through demonstrated need, not added speculatively.

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
| Storage | File-based JSON (initial) / Database TBD (when justified) | Follow Principle VIII |
| Hosting | Windows 11 + IIS 10.0+ | MUST support iisnode |
| Build | Vite (client) + esbuild (server) | MUST output CommonJS |

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

dist/                      # Build output (production deployment)
  index.cjs                # Compiled Express server (CommonJS)
  public/                  # Frontend static assets
  web.config               # IIS configuration with URL rewrite rules
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
3. Obtain lead 1eveloper approval
4. Update version following semantic versioning:
   - MAJOR: Backward-incompatible principle changes or removals
   - MINOR: New principles or expanded guidance added
   - PATCH: Clarifications, wording improvements, typo fixes
5. Update `Last Amended` date

**Version**: 1.3.0 | **Ratified**: 2026-02-01 | **Last Amended**: 2026-02-01
