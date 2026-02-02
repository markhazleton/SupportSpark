# GitHub Copilot Instructions for SupportSpark

> **Constitution Reference**: All development MUST comply with `.specify/memory/constitution.md`
>
> This file provides GitHub Copilot with project-specific context and coding standards.

## Project Overview

SupportSpark is a support network platform that helps people share updates with their trusted support network during difficult times. The platform provides a calm, distraction-free space for members to post journey updates while supporters read and respond with encouragement.

## NON-NEGOTIABLE Principles

These principles are defined in the Constitution and MUST be followed in all generated code:

### 1. Type Safety (REQUIRED)

```typescript
// ✅ CORRECT: Use Zod schemas from shared/schema.ts
import { insertUserSchema, User } from "@shared/schema";

// ✅ CORRECT: Validate at runtime
const validated = insertUserSchema.parse(userData);

// ❌ WRONG: Using `any` type
const data: any = response.json();

// ❌ WRONG: Inline type definitions for shared data
interface User {
  id: number;
  name: string;
}
```

- TypeScript `strict: true` is enabled
- All schemas MUST be defined in `shared/schema.ts` using Zod
- Use path aliases: `@/` for client, `@shared/` for shared modules
- NO `any` types without explicit justification

### 2. Testing (REQUIRED)

```typescript
// ✅ CORRECT: Test file naming
// feature.test.ts or feature.test.tsx

// ✅ CORRECT: Import from vitest
import { describe, it, expect } from "vitest";
```

- All new features MUST have accompanying tests
- Use Vitest as the test framework
- API routes MUST have integration tests
- Follow TDD: write tests first, then implement

### 3. UI Components (REQUIRED)

```tsx
// ✅ CORRECT: Use shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ✅ CORRECT: Extend with Tailwind CSS
<Button className="bg-primary hover:bg-primary/90">Submit</Button>

// ❌ WRONG: Custom button without shadcn/ui
<button className="custom-button">Submit</button>
```

- Use shadcn/ui primitives from `@/components/ui/`
- Styling with Tailwind CSS only
- Use Framer Motion for animations
- Add new components via `npx shadcn-ui@latest add`

### 4. Security (REQUIRED)

```typescript
// ✅ CORRECT: Use bcrypt for passwords
import bcrypt from "bcrypt";
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ CORRECT: Environment variables for secrets
const sessionSecret = process.env.SESSION_SECRET;

// ❌ WRONG: Hardcoded secrets
const secret = "my-secret-key";

// ❌ WRONG: Plain text passwords
user.password = plainTextPassword;
```

- Passwords MUST be hashed with bcrypt (min 10 rounds)
- Secrets MUST come from environment variables
- Implement rate limiting on auth endpoints
- Validate file uploads (type and size)

### 5. API Contracts (REQUIRED)

```typescript
// ✅ CORRECT: Define routes in shared/routes.ts
export const routes = {
  getUser: {
    method: "GET",
    path: "/api/users/:id",
    response: UserSchema,
    error: errorSchemas.notFound,
  },
} as const;

// ✅ CORRECT: Use buildUrl helper
import { buildUrl } from "@shared/routes";
const url = buildUrl("/api/users/:id", { id: userId });
```

- All API routes MUST be in `shared/routes.ts`
- Include method, path, and Zod schemas
- Use standardized error schemas
- Use `buildUrl()` for parameterized URLs

### 6. State Management (RECOMMENDED)

```typescript
// ✅ CORRECT: Use React Query for server state
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const { data } = useQuery({
  queryKey: ["/api/conversations"],
  queryFn: fetchConversations,
});

// ✅ CORRECT: Invalidate on mutation
const queryClient = useQueryClient();
mutation.onSuccess(() => {
  queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
});
```

- Server state with TanStack React Query
- Query keys: `["/api/resource"]` or `["/api/resource", id]`
- Invalidate related queries on mutations
- Use React useState/useReducer for client-only state

### 7. Code Style (REQUIRED)

```typescript
// ✅ CORRECT: Import order
import express from "express"; // External dependencies
import { User } from "@shared/schema"; // @shared/ imports
import { Button } from "@/components/ui/button"; // @/ imports
import { helper } from "./utils"; // Relative imports
```

- ESLint + Prettier for formatting
- Follow import order: external → @shared → @/ → relative
- All code must pass linting

## Technology Stack Quick Reference

| Layer      | Technology                    | Notes                      |
| ---------- | ----------------------------- | -------------------------- |
| Frontend   | React 19 + Vite               | Functional components only |
| UI         | shadcn/ui + Radix + Tailwind  | MUST use for all UI        |
| State      | TanStack React Query          | For server state           |
| Routing    | Wouter                        | Lightweight router         |
| Backend    | Express 5                     | RESTful API                |
| Auth       | Passport.js + express-session | With bcrypt                |
| Validation | Zod                           | All schemas                |
| Testing    | Vitest                        | All new features           |
| Hosting    | Windows 11 + IIS              | Production environment     |

## File Structure Convention

```
client/src/
  components/ui/     # shadcn/ui primitives (DO NOT EDIT)
  components/        # Custom components
  hooks/use-*.ts    # Custom hooks
  pages/             # Route components
  lib/               # Utilities

server/
  index.ts           # Entry point
  routes.ts          # API handlers
  storage.ts         # Data persistence

shared/
  schema.ts          # Zod schemas (SINGLE SOURCE OF TRUTH)
  routes.ts          # API contracts

data/                # JSON storage (dev only)
```

## Common Patterns

### Creating a New API Endpoint

1. Define schema in `shared/schema.ts`
2. Add route contract in `shared/routes.ts`
3. Implement handler in `server/routes.ts`
4. Create integration test in `server/*.test.ts`

### Creating a New React Component

1. Use shadcn/ui primitives as base
2. Style with Tailwind CSS classes
3. Create in `client/src/components/`
4. Add unit test in `*.test.tsx`

### Creating a Custom Hook

1. Name with `use-` prefix
2. Place in `client/src/hooks/`
3. Use React Query for server data
4. Add unit test

## Documentation Guidelines

All generated documentation MUST follow this structure:

- **Session documentation**: `/docs/copilot/session-{YYYY-MM-DD}/`
  - For session-specific work, audits, implementation notes
- **Domain documentation**: `/docs/domain/`
  - For long-lasting architectural decisions, patterns, guides

## Constitution Compliance Checklist

Before completing any feature, verify:

- [ ] TypeScript strict mode compliant (no `any` without justification)
- [ ] Zod schemas defined in `shared/schema.ts`
- [ ] Tests written and passing
- [ ] UI uses shadcn/ui components
- [ ] Security best practices applied
- [ ] API contract defined in `shared/routes.ts`
- [ ] Code passes ESLint/Prettier

## Deployment Checklist

When implementing features that affect deployment:

- [ ] Build output compatible with IIS + iisnode (CommonJS format)
- [ ] web.config updated if new routes added
- [ ] Environment variables documented
- [ ] Database-ready (no hardcoded file paths for production)
- [ ] Tested with `npm run build` and `npm start`

---

**Constitution Version**: 1.0.0 | **Last Updated**: 2026-02-01

> For complete governance details, see `.specify/memory/constitution.md`
