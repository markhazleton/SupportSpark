# Phase 0: Research & Technology Decisions

**Feature**: Production Readiness - Critical Compliance Fixes  
**Date**: 2026-02-01  
**Status**: Complete

## Overview

This document consolidates research findings and technology decisions for implementing security hardening, type safety improvements, testing infrastructure, code quality tooling, and deployment automation. All decisions align with the SupportSpark Constitution (v1.1.0) and address findings from the 2026-02-01 site audit.

---

## 1. Password Hashing Implementation

### Research Question

Which password hashing algorithm should be used for securing user credentials in Node.js/Express application?

### Options Evaluated

| Algorithm  | Pros                                                                  | Cons                                        | Node.js Support              |
| ---------- | --------------------------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| **bcrypt** | Industry standard, well-tested, adjustable work factor, wide adoption | Older algorithm, max 72-byte input          | Excellent (`bcrypt` package) |
| **argon2** | Winner of 2015 Password Hashing Competition, modern, memory-hard      | Less widespread adoption, newer             | Good (`argon2` package)      |
| **scrypt** | Built into Node.js crypto, good security                              | Fewer implementation examples, less tooling | Native (Node 10+)            |
| **PBKDF2** | Simple, built-in                                                      | Considered less secure than alternatives    | Native                       |

### Decision: **bcrypt**

**Rationale**:
-Constitution explicitly mandates bcrypt (Principle IV: "User passwords MUST be hashed using bcrypt")

- Industry-standard with 20+ years of battle-testing
- Passport.js ecosystem has excellent bcrypt examples
- Simple API: `bcrypt.hash()` and `bcrypt.compare()`
- Adjustable cost factor allows future security upgrades
- Windows compatibility confirmed (binary builds available)

**Configuration**:

```typescript
import bcrypt from "bcrypt";

// Registration
const saltRounds = 10; // Constitution minimum
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Login
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

**Package**: `bcrypt` + `@types/bcrypt`

**Alternatives Considered**:

- argon2: Rejected because Constitution specifies bcrypt, would require amendment
- scrypt: Less documentation for Express/Passport integration
- PBKDF2: Not recommended for password hashing (2026 standards)

---

## 2. Rate Limiting Strategy

### Research Question

How should rate limiting be implemented for authentication endpoints in Express 5?

### Options Evaluated

| Solution                  | Pros                                                | Cons                                          | Best For             |
| ------------------------- | --------------------------------------------------- | --------------------------------------------- | -------------------- |
| **express-rate-limit**    | Express-focused, simple API, memory store built-in  | Single-server only (without Redis)            | Small-medium apps    |
| **rate-limiter-flexible** | Multi-backend (Redis, Memcached), advanced features | More complex configuration                    | High-scale apps      |
| **Custom middleware**     | Full control, no dependencies                       | Must implement sliding window, testing burden | Special requirements |

### Decision: **express-rate-limit**

**Rationale**:

- Simple drop-in middleware for Express routes
- Constitution requirement satisfied with minimal complexity
- In-memory store sufficient for single IIS instance deployment
- Can upgrade to Redis store if scaling needs emerge
- Clear error messages and retry-after headers built-in
- Active maintenance and Express 5 compatibility confirmed

**Configuration**:

```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  // Store: memory (default) - sufficient for single server
});

// Apply to routes
app.post('/api/login', authLimiter, passport.authenticate('local'), ...);
app.post('/api/register', authLimiter, ...);
```

**Package**: `express-rate-limit`

**Future Scaling Path**: If clustering/multi-server needed, configure Redis store:

```typescript
import RedisStore from "rate-limit-redis";
store: new RedisStore({ client: redisClient });
```

**Alternatives Considered**:

- rate-limiter-flexible: Over-engineering for current single-server deployment
- Custom: Unnecessary maintenance burden for solved problem

---

## 3. Testing Framework Configuration

### Research Question

How should Vitest be configured for full-stack React + Express application?

### Research Findings

**Vitest Advantages**:

- Native Vite integration (already using Vite for client build)
- Fast parallel test execution
- Compatible with Jest API (easy migration path)
- Built-in TypeScript support
- Modern ESM-first design

**Test Structure Decision**:

```text
Test Organization Strategy:
├── server/
│   ├── routes.test.ts        # Integration tests (API endpoints)
│   └── storage.test.ts       # Unit tests (storage layer)
├── client/src/
│   ├── hooks/
│   │   ├── use-auth.test.ts  # Hook unit tests
│   │   └── use-conversations.test.ts
│   └── pages/
│       └── Auth.test.tsx     # Component integration tests
└── shared/
    └── schema.test.ts        # Schema validation tests
```

**Configuration** (`vitest.config.ts`):

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom", // For React components
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["server/**/*.ts", "client/src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/node_modules/**",
        "client/src/components/ui/**", // shadcn/ui - vendor code
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
```

**Test Setup File** (`test/setup.ts`):

```typescript
import "@testing-library/jest-dom";
import { beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server"; // MSW for API mocking

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
```

**Dependencies Required**:

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^23.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0"
  }
}
```

**Test Patterns**:

1. **API Integration Tests** (supertest):

```typescript
import request from "supertest";
import { app } from "../server/index";

describe("POST /api/login", () => {
  it("rejects invalid password", async () => {
    const response = await request(app)
      .post("/api/login")
      .send({ email: "test@example.com", password: "wrong" });
    expect(response.status).toBe(401);
  });
});
```

2. **React Hook Tests** (Testing Library):

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

test("useAuth returns user after login", async () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: QueryClientProvider,
  });
  // ... test logic
});
```

**Alternatives Considered**:

- Jest: Rejected - Slower than Vitest, requires additional Babel configuration
- Test-only frameworks (AVA, Tape): Rejected - Less React ecosystem integration

---

## 4. Type Safety Patterns

### Research Question

How should TypeScript types be properly defined for Express routes with Passport.js authentication?

### Best Practices Research

**Problem Areas Identified**:

1. Express `Request` doesn't know about `user` property added by Passport
2. Route handlers use `any` for request/response
3. Zod schemas use `z.custom<any>()` losing type information

**Solution Pattern**:

**1. Define Authenticated Request Type** (`server/types.ts`):

```typescript
import { type Request, type Response, type NextFunction } from "express";
import { type User } from "@shared/schema";

// Extend Express Request with Passport user
export interface AuthenticatedRequest extends Request {
  user: User; // Type-safe user object
}

// Type-safe middleware
export type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

// Type-safe authenticated route handler
export type AuthHandler = (req: AuthenticatedRequest, res: Response) => Promise<void> | void;

// Type-safe error handler
export type ErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => void;
```

**2. Properly Type Route Handlers**:

```typescript
// Before (TYPE7-8 violations)
const requireAuth = (req: any, res: any, next: any) => { ... };
app.get('/api/conversations', (req: any, res) => { ... });

// After (Type-safe)
import { type AuthMiddleware, type AuthHandler, type AuthenticatedRequest } from './types';

const requireAuth: AuthMiddleware = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

const listConversations: AuthHandler = async (req, res) => {
  // req.user is now properly typed!
  const conversations = await storage.getConversationsForUser(req.user.id);
  res.json(conversations);
};

app.get('/api/conversations', requireAuth, listConversations);
```

**3. Fix Zod Schema Types** (TYPE1-2):

```typescript
// Before (shared/routes.ts)
responses: {
  200: z.custom<any>(), // Loses all type information
}

// After
import { conversationSchema, supporterSchema } from './schema';

responses: {
  200: z.array(conversationSchema), // Full type inference
}
```

**4. Passport Type Augmentation** (for serializeUser):

```typescript
// server/types.ts
import "express-session";
import { type User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    passport: {
      user: string; // User ID
    };
  }
}

// Now serializeUser can be properly typed
passport.serializeUser<string>((user: User, done) => {
  done(null, user.id);
});
```

**Type Safety Checklist**:

- [ ] All request handlers use explicit types (no `any`)
- [ ] All `req.user` access uses `AuthenticatedRequest`
- [ ] All Zod schemas use concrete types (no `z.custom<any>()`)
- [ ] All error handlers properly typed
- [ ] TypeScript strict mode compiles without errors

**Alternatives Considered**:

- Type assertions (`req as AuthenticatedRequest`): Rejected - bypasses type safety
- Keeping `any`: Rejected - violates Constitution Principle I

---

## 5. Linting Configuration

### Research Question

What ESLint and Prettier configuration aligns with SupportSpark's TypeScript + React stack?

### Configuration Strategy

**ESLint Rules** (`.eslintrc.json`):

```json
{
  "root": true,
  "env": {
    "browser": true,
    "es2022": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "ignorePatterns": ["dist", "node_modules", "*.config.js", "*.config.ts"]
}
```

**Key Rules Explained**:

- `@typescript-eslint/no-explicit-any`: Enforces Constitution Principle I (no `any` types)
- `@typescript-eslint/no-floating-promises`: Catches unhandled async operations
- `react-hooks/recommended`: Prevents common React hooks mistakes
- `prettier`: Disables conflicting ESLint style rules

**Prettier Configuration** (`.prettierrc.json`):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Package Scripts** (`package.json`):

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,json,md}\"",
    "type-check": "tsc --noEmit",
    "validate": "npm run type-check && npm run lint && npm run format:check && npm test"
  }
}
```

**Dependencies Required**:

```json
{
  "devDependencies": {
    "eslint": "^8.55.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.1.0"
  }
}
```

**Pre-commit Hooks** (optional via Husky):

```bash
npm install -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**lint-staged Configuration** (`package.json`):

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Alternatives Considered**:

- Standard.js: Rejected - Less flexible, opinionated formatting conflicts with Prettier
- XO: Rejected - Too strict, would require extensive configuration overrides

---

## 6. IIS Deployment Automation

### Research Question

How should data directory permissions be automated for IIS deployment on Windows 11?

### PowerShell ACL Management Pattern

**Deployment Script** (`script/deploy-iis.ps1`):

```powershell
<#
.SYNOPSIS
Configures IIS deployment for SupportSpark application

.DESCRIPTION
Sets up data directory permissions, validates web.config, and configures IIS app pool

.PARAMETER SitePath
Path to IIS website root (e.g., C:\inetpub\wwwroot\supportspark)

.PARAMETER AppPoolName
IIS Application Pool name (default: SupportSpark)

.EXAMPLE
.\deploy-iis.ps1 -SitePath "C:\inetpub\wwwroot\supportspark"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SitePath,

    [Parameter(Mandatory=$false)]
    [string]$AppPoolName = "SupportSpark"
)

# Validate path exists
if (-not (Test-Path $SitePath)) {
    Write-Error "Site path does not exist: $SitePath"
    exit 1
}

# Configure data directory permissions
$dataPath = Join-Path $SitePath "data"
if (-not (Test-Path $dataPath)) {
    New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
    Write-Host "✓ Created data directory"
}

Write-Host "Configuring IIS_IUSRS permissions on $dataPath..."
$acl = Get-Acl $dataPath
$permission = "IIS_IUSRS", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl $dataPath $acl
Write-Host "✓ Data directory permissions configured"

# Validate web.config exists
$webConfig = Join-Path $SitePath "web.config"
if (-not (Test-Path $webConfig)) {
    Write-Error "web.config not found in $SitePath"
    exit 1
}
Write-Host "✓ web.config validated"

# Check if iisnode handler is configured
$webConfigContent = Get-Content $webConfig -Raw
if ($webConfigContent -notmatch "iisnode") {
    Write-Warning "web.config may not have iisnode handler configured"
}

# Validate index.cjs exists
$entryPoint = Join-Path $SitePath "index.cjs"
if (-not (Test-Path $entryPoint)) {
    Write-Error "Server entry point not found: index.cjs"
    exit 1
}
Write-Host "✓ Server entry point validated"

# Create conversations directory structure if needed
$conversationsPath = Join-Path $dataPath "conversations"
if (-not (Test-Path $conversationsPath)) {
    New-Item -ItemType Directory -Path $conversationsPath -Force | Out-Null

    # Initialize meta.json
    $metaJson = @{
        lastConversationId = 0
    } | ConvertTo-Json
    Set-Content -Path (Join-Path $conversationsPath "meta.json") -Value $metaJson

    # Initialize index.json
    Set-Content -Path (Join-Path $conversationsPath "index.json") -Value "[]"

    Write-Host "✓ Conversations structure initialized"
}

Write-Host "`n✅ Deployment configuration complete!"
Write-Host "`nNext steps:"
Write-Host "1. Configure environment variables in IIS Configuration Editor:"
Write-Host "   - system.webServer/iisnode/environmentVariables"
Write-Host "   - Add: SESSION_SECRET, NODE_ENV=production"
Write-Host "2. Install production dependencies: npm install --production"
Write-Host "3. Restart IIS: iisreset"
```

**Build Script Integration** (`script/build.ts`):

```typescript
// After building server, setup data directory
console.log("Setting up data directory structure...");
await mkdir("dist/data/conversations", { recursive: true });

// Copy initial data files
const dataFiles = ["users.json", "supporters.json", "quotes.json"];
for (const file of dataFiles) {
  try {
    await copyFile(`data/${file}`, `dist/data/${file}`);
  } catch {
    await writeFile(`dist/data/${file}`, "[]", "utf-8");
  }
}

// Initialize conversations metadata
await writeFile(
  "dist/data/conversations/meta.json",
  JSON.stringify({ lastConversationId: 0 }),
  "utf-8"
);
await writeFile("dist/data/conversations/index.json", "[]", "utf-8");

// Validate web.config
console.log("Validating web.config...");
const webConfig = await readFile("dist/web.config", "utf-8");
if (!webConfig.includes('path="index.cjs"')) {
  throw new Error("web.config references wrong entry point");
}
if (!webConfig.includes('<add name="iisnode"')) {
  throw new Error("web.config missing iisnode handler");
}
console.log("✓ web.config validated");
```

**Idempotency**: Script can be run multiple times safely
**Error Handling**: Validates prerequisites before making changes
**Documentation**: Comments explain each step

**Alternatives Considered**:

- Batch scripts: Rejected - Less powerful ACL management
- Manual steps: Rejected - Error-prone, not repeatable
- Ansible/Chef: Rejected - Over-engineering for single-server deployment

---

## Implementation Patterns Summary

### Security Implementation Order

1. Install bcrypt + express-rate-limit packages
2. Implement bcrypt in authentication routes (register, login)
3. Add rate limiter middleware
4. Remove hardcoded session secret fallback
5. Test authentication flow with new security

### Type Safety Implementation Order

1. Create `server/types.ts` with proper interfaces
2. Fix `shared/routes.ts` Zod schemas (TYPE1-2)
3. Fix `server/storage.ts` Message types (TYPE3-4)
4. Fix `server/routes.ts` route handlers (TYPE5-8)
5. Fix React components (TYPE9-12)
6. Verify TypeScript compilation succeeds

### Testing Implementation Order

1. Configure Vitest + testing libraries
2. Create test setup file with mocks
3. Write authentication integration tests
4. Write storage layer unit tests
5. Write React hook tests
6. Achieve 80%+ coverage target

### Deployment Implementation Order

1. Create PowerShell deployment script
2. Update build script with data directory setup
3. Add web.config validation
4. Create `.env.example` with documentation
5. Test full deployment to IIS staging environment

---

## Dependencies Installation

**Complete Dependency List**:

```bash
# Security
npm install bcrypt express-rate-limit

# Testing
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest @types/supertest

# Linting
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier prettier

# Type Definitions
npm install -D @types/bcrypt @types/express-rate-limit

# Optional: Pre-commit Hooks
npm install -D husky lint-staged
```

**One-Line Installation**:

```bash
npm install bcrypt express-rate-limit && npm install -D @types/bcrypt vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest @types/supertest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-config-prettier prettier
```

---

## Success Criteria for Research Phase

- [x] Password hashing: bcrypt selected with 10-round configuration
- [x] Rate limiting: express-rate-limit configured for 5/15min
- [x] Testing: Vitest configuration defined with 80%+ coverage target
- [x] Type safety: TypeScript patterns established for Express + Passport
- [x] Linting: ESLint + Prettier rules aligned with Constitution
- [x] Deployment: PowerShell script designed for IIS automation
- [x] All dependencies identified and documented
- [x] Implementation patterns established for each category
- [x] No blockers or NEEDS CLARIFICATION items remain

**Status**: ✅ COMPLETE - Ready for Phase 1 (Design & Contracts)
