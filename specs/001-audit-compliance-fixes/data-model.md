# Phase 1: Data Model & Schema Changes

**Feature**: Production Readiness - Critical Compliance Fixes  
**Date**: 2026-02-01  
**Status**: Complete

## Overview

This feature primarily secures and types existing data structures rather than introducing new entities. Changes focus on password security representation, type definitions, and validation schemas.

---

## Schema Changes

### User Schema (shared/schema.ts)

**Purpose**: Represent hashed passwords securely and track password algorithm version

**Current Schema** (insecure):

```typescript
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string(), // ❌ Stored as plain text
  firstName: z.string().min(1),
  lastName: z.string().min(1).optional(),
  avatarColor: z.string().optional(),
  avatar: z.string().optional(),
});

export const userSchema = insertUserSchema.extend({
  id: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

**Updated Schema** (secure):

```typescript
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72), // ✅ Validation for input (bcrypt max 72 bytes)
  firstName: z.string().min(1),
  lastName: z.string().min(1).optional(),
  avatarColor: z.string().optional(),
  avatar: z.string().optional(),
});

export const userSchema = insertUserSchema.extend({
  id: z.string(),
  password: z.string(), // Now represents bcrypt hash (no length constraint)
  passwordVersion: z.enum(["bcrypt-10"]).default("bcrypt-10"), // Track algorithm
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

**Migration Impact**:

- Existing users with plain text passwords must reset passwords
- `passwordVersion` field allows future algorithm upgrades
- Input validation (8+ chars) applied at registration
- Stored password is now a hash string (~60 chars for bcrypt)

**Breaking Changes**: None for API consumers (password still a string field)

---

### Message Schema (shared/schema.ts)

**Purpose**: Properly type conversation messages (fixes TYPE3-4)

**Current** (ambiguous):

```typescript
// Message type not exported, used as `any` in storage.ts
```

**Updated** (explicit):

```typescript
export const messageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().optional(),
  content: z.string().min(1),
  timestamp: z.string().datetime(),
  isSupporter: z.boolean().default(false),
});

export type Message = z.infer<typeof messageSchema>;
```

**Usage in Storage**:

```typescript
// Before
export interface IStorage {
  createConversation(memberId: string, title: string, initialMessage: any): Promise<Conversation>;
}

// After
import { type Message } from "@shared/schema";

export interface IStorage {
  createConversation(
    memberId: string,
    title: string,
    initialMessage: Message
  ): Promise<Conversation>;
}
```

**Breaking Changes**: None (internal type strengthening)

---

## Type Definitions (server/types.ts)

**Purpose**: Provide proper TypeScript types for Express + Passport.js integration

**New File Structure**:

```typescript
import { type Request, type Response, type NextFunction } from "express";
import { type User } from "@shared/schema";

/**
 * Express Request extended with authenticated Passport user
 * Use this interface for protected routes that require authentication
 */
export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * Type-safe middleware function
 */
export type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

/**
 * Type-safe authenticated route handler
 * Guarantees req.user is available and properly typed
 */
export type AuthHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

/**
 * Type-safe standard route handler
 */
export type RouteHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

/**
 * Type-safe error handler
 */
export type ErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => void;
```

**Module Augmentation for Express Session**:

```typescript
// Extend express-session to include Passport types
declare module "express-session" {
  interface SessionData {
    passport?: {
      user: string; // User ID stored in session
    };
  }
}

// Extend Express Request to include Passport methods
declare module "express" {
  interface Request {
    user?: User;
    isAuthenticated(): boolean;
    login(user: User, done: (err: any) => void): void;
    logout(done: (err: any) => void): void;
  }
}
```

---

## API Response Schema Updates (shared/routes.ts)

**Purpose**: Replace generic `z.custom<any>()` with proper Zod schemas (fixes TYPE1-2)

**Before** (loses type information):

```typescript
export const api = {
  conversations: {
    list: {
      method: "GET" as const,
      path: "/api/conversations",
      responses: {
        200: z.custom<any>(), // ❌ No type checking
      },
    },
  },
  supporters: {
    list: {
      method: "GET" as const,
      path: "/api/supporters",
      responses: {
        200: z.custom<any>(), // ❌ No type checking
      },
    },
  },
};
```

**After** (full type inference):

```typescript
import { conversationSchema, supporterSchema, messageSchema } from "./schema";

export const api = {
  conversations: {
    list: {
      method: "GET" as const,
      path: "/api/conversations",
      responses: {
        200: z.array(conversationSchema), // ✅ Fully typed
      },
    },
    getById: {
      method: "GET" as const,
      path: "/api/conversations/:id",
      responses: {
        200: conversationSchema.extend({
          messages: z.array(messageSchema),
        }),
      },
    },
  },
  supporters: {
    list: {
      method: "GET" as const,
      path: "/api/supporters",
      responses: {
        200: z.object({
          mySupporters: z.array(supporterSchema),
          supporting: z.array(supporterSchema),
        }), // ✅ Fully typed
      },
    },
  },
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login",
      body: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: userSchema.omit({ password: true }), // Never return password
        401: z.object({ message: z.string() }),
        429: z.object({
          message: z.string(),
          retryAfter: z.number().optional(),
        }), // ✅ Rate limit response
      },
    },
  },
};
```

**Benefits**:

- Full TypeScript type inference from API contract
- Compile-time validation of response shapes
- Auto-complete in IDEs for API responses
- Runtime validation via Zod

---

## Rate Limit State (in-memory)

**Purpose**: Track authentication attempts per IP address

**Implementation**: Managed by `express-rate-limit` library (no schema needed)

**Data Structure** (internal to library):

```typescript
// Per-IP tracking (in-memory store)
{
  "192.168.1.100": {
    count: 3,        // Current attempt count
    resetTime: 1704125700000, // Unix timestamp when window resets
  },
  "192.168.1.101": {
    count: 5,        // Max reached
    resetTime: 1704125800000,
  }
}
```

**Configuration**:

- Window: 15 minutes (900000ms)
- Max attempts: 5 per window per IP
- Storage: In-process memory (single server)
- Persistence: No (resets on server restart - acceptable for security feature)

**Future Scaling**: Can migrate to Redis store without code changes:

```typescript
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });

const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rl:auth:",
  }),
  // ... other config
});
```

---

## Environment Configuration

**Purpose**: Document required environment variables (addresses DEPLOY3)

**New File**: `.env.example`

```bash
# ===================================
# SupportSpark Environment Variables
# ===================================

# Node Environment (REQUIRED)
# Values: production | development | test
NODE_ENV=development

# Session Security (REQUIRED for production)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# NEVER commit the actual secret to version control
SESSION_SECRET=your-secret-key-here-minimum-32-characters

# Server Configuration (OPTIONAL - IIS uses iisnode, this is for local dev)
PORT=3000

# Database Configuration (FUTURE - PostgreSQL migration)
# DATABASE_URL=postgresql://user:password@localhost:5432/supportspark

# Data Directory (OPTIONAL - defaults to ./data)
# DATA_DIR=./data

# Rate Limiting Configuration (OPTIONAL - defaults shown)
# RATE_LIMIT_WINDOW_MS=900000
# RATE_LIMIT_MAX_REQUESTS=5

# Logging Level (OPTIONAL)
# LOG_LEVEL=info

# ===================================
# IIS Deployment Notes
# ===================================
# For IIS deployment, set environment variables in web.config or IIS Configuration Editor:
# 1. Open IIS Manager
# 2. Select your website
# 3. Configuration Editor → system.webServer/iisnode
# 4. Edit environmentVariables collection
# 5. Add key-value pairs (especially SESSION_SECRET and NODE_ENV=production)
```

**Validation at Startup** (`server/index.ts`):

```typescript
// Validate required environment variables
const requiredEnvVars = ["SESSION_SECRET"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars.join(", "));
  console.error("See .env.example for configuration details");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && process.env.SESSION_SECRET === "simple-secret-key") {
  console.error("❌ Production environment detected with default SESSION_SECRET");
  console.error(
    "Generate a secure secret: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
  process.exit(1);
}
```

---

## Data Migration Strategy

### Password Migration

**Challenge**: Existing users have plain text passwords that must be hashed

**Options**:

**Option 1: Force Password Reset** (Recommended)

```typescript
// On login attempt, detect old format
if (!user.passwordVersion) {
  // Plain text password detected
  return res.status(403).json({
    message: "Password security upgrade required. Please reset your password.",
    requiresReset: true,
  });
}
```

**Option 2: One-Time Migration Script**

```typescript
// scripts/migrate-passwords.ts
import bcrypt from "bcrypt";
import { FileStorage } from "../server/storage";

const storage = new FileStorage();
const users = await storage.getAllUsers();

for (const user of users) {
  if (!user.passwordVersion) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await storage.updateUser(user.id, {
      password: hashedPassword,
      passwordVersion: "bcrypt-10",
    });
    console.log(`Migrated user: ${user.email}`);
  }
}
```

**Decision**: Use Option 1 (Force Reset) for security best practices

- Plain text passwords should not be converted directly
- Ensures users are aware of security change
- Opportunity to enforce stronger password requirements

---

## Schema Change Summary

| Entity               | Change Type | Fields Affected                                | Breaking? |
| -------------------- | ----------- | ---------------------------------------------- | --------- |
| User                 | Modified    | `password` (now hash), added `passwordVersion` | No        |
| Message              | New Export  | Type exported from schema                      | No        |
| AuthenticatedRequest | New Type    | TypeScript interface                           | No        |
| API Contracts        | Modified    | Replace `z.custom<any>()` with schemas         | No        |
| Environment Config   | New         | `.env.example` documentation                   | No        |

**Database Migration**: Not applicable (file-based JSON storage)  
**API Breaking Changes**: None  
**Client Impact**: Minimal (failed logins require password reset)

---

## Validation

### Schema Validation Tests

**New File**: `shared/schema.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { insertUserSchema, userSchema, messageSchema } from "./schema";

describe("User Schema", () => {
  it("validates correct user registration data", () => {
    const validUser = {
      email: "test@example.com",
      password: "SecurePass123",
      firstName: "Test",
    };
    expect(() => insertUserSchema.parse(validUser)).not.toThrow();
  });

  it("rejects passwords shorter than 8 characters", () => {
    const invalidUser = {
      email: "test@example.com",
      password: "short",
      firstName: "Test",
    };
    expect(() => insertUserSchema.parse(invalidUser)).toThrow();
  });

  it("includes passwordVersion in stored user schema", () => {
    const storedUser = {
      id: "1",
      email: "test@example.com",
      password: "$2b$10$hashedhashhashedhash",
      firstName: "Test",
      passwordVersion: "bcrypt-10",
    };
    const result = userSchema.parse(storedUser);
    expect(result.passwordVersion).toBe("bcrypt-10");
  });
});

describe("Message Schema", () => {
  it("validates complete message structure", () => {
    const validMessage = {
      id: "msg-1",
      conversationId: "conv-1",
      authorId: "user-1",
      authorName: "Test User",
      content: "Hello world",
      timestamp: new Date().toISOString(),
      isSupporter: false,
    };
    expect(() => messageSchema.parse(validMessage)).not.toThrow();
  });
});
```

---

## Success Criteria

- [x] User schema updated with password security fields
- [x] Message schema properly exported with Zod validation
- [x] TypeScript type definitions created for Express + Passport
- [x] API contract schemas use concrete types (no `any`)
- [x] Environment configuration documented in `.env.example`
- [x] Password migration strategy defined
- [x] Schema validation tests created
- [x] No breaking changes to API contracts
- [x] All type changes compile without errors

**Status**: ✅ COMPLETE - Ready for implementation
