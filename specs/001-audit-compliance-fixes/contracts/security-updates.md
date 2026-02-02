# API Contract Updates: Security & Rate Limiting

**Feature**: Production Readiness - Critical Compliance Fixes  
**Date**: 2026-02-01  
**Version**: 1.0.0

## Overview

This document describes API behavior changes related to security hardening. All changes are **backward compatible** from the client perspective, but introduce new error responses and security constraints.

---

## Authentication Endpoints

### POST /api/login

**URL**: `/api/login`  
**Method**: `POST`  
**Security**: Rate limited (5 attempts per 15 minutes per IP)

**Request Body**:

```typescript
{
  email: string,    // Valid email format
  password: string  // Plain text (hashed server-side)
}
```

**Response Codes**:

**200 OK** - Successful authentication

```typescript
{
  id: string,
  email: string,
  firstName: string,
  lastName?: string,
  avatarColor?: string,
  avatar?: string,
  // Note: password field never returned
}
```

**401 Unauthorized** - Invalid credentials

```typescript
{
  message: "Incorrect password." | "User not found.";
}
```

**403 Forbidden** - Password migration required (NEW)

```typescript
{
  message: "Password security upgrade required. Please reset your password.",
  requiresReset: true
}
```

**429 Too Many Requests** - Rate limit exceeded (NEW)

```typescript
{
  message: "Too many login attempts, please try again later",
  retryAfter?: number  // Seconds until rate limit resets
}
```

**Headers** (NEW):

- `RateLimit-Limit`: Maximum requests per window
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when rate limit resets
- `Retry-After`: Seconds to wait before retrying (only on 429)

**Behavior Changes**:

- ✅ Passwords now verified via bcrypt instead of plain text comparison
- ✅ Rate limiting enforces 5 attempts per 15-minute window
- ✅ Failed attempts count toward rate limit
- ✅ Successful login resets rate limit counter for that IP

**Client Impact**:

- Must handle 429 response code
- Should display retry-after time to users
- Should handle 403 for password migration

---

### POST /api/register

**URL**: `/api/register`  
**Method**: `POST`  
**Security**: Rate limited (5 attempts per 15 minutes per IP)

**Request Body**:

```typescript
{
  email: string,        // Valid email format, unique
  password: string,     // Min 8 characters, max 72 (bcrypt limit)
  firstName: string,    // Min 1 character
  lastName?: string,
  avatarColor?: string,
  avatar?: string
}
```

**Response Codes**:

**200 OK** - Registration successful

```typescript
{
  id: string,
  email: string,
  firstName: string,
  lastName?: string,
  avatarColor?: string,
  avatar?: string,
  // Note: password field never returned
}
```

**400 Bad Request** - Validation error

```typescript
{
  message: "Email already in use" | "Password must be at least 8 characters";
}
```

**429 Too Many Requests** - Rate limit exceeded (NEW)

```typescript
{
  message: "Too many registration attempts, please try again later",
  retryAfter?: number
}
```

**Behavior Changes**:

- ✅ Password automatically hashed with bcrypt (10 rounds) before storage
- ✅ Password validation enforces 8-72 character range
- ✅ Rate limiting prevents registration spam
- ✅ Password never appears in logs or responses

**Client Impact**:

- Must handle 429 response code
- Should validate password length client-side (8-72 chars)
- More secure registration process (no changes to request format)

---

### POST /api/demo

**URL**: `/api/demo`  
**Method**: `POST`  
**Security**: Rate limited (5 attempts per 15 minutes per IP)

**Request Body**: None

**Response Codes**:

**200 OK** - Demo session created

```typescript
{
  // Demo user object (either member or supporter)
  id: string,
  email: string,
  firstName: string,
  // ...
}
```

**429 Too Many Requests** - Rate limit exceeded (NEW)

```typescript
{
  message: "Too many demo requests, please try again later",
  retryAfter?: number
}
```

**Behavior Changes**:

- ✅ Rate limiting prevents demo account abuse
- ✅ Demo accounts use same secure authentication as real users

**Client Impact**:

- Must handle 429 response code

---

### POST /api/logout

**URL**: `/api/logout`  
**Method**: `POST`  
**Security**: None (already requires authenticated session)

**No changes** - Behavior remains identical

---

## Protected Endpoints

All endpoints requiring authentication maintain existing behavior but benefit from improved security:

- Password verification now uses bcrypt
- Session management more secure (no hardcoded secrets)
- Type safety improvements (internal, no API changes)

### Rate Limiting Details

**Configuration**:

- **Window**: 15 minutes (900,000 milliseconds)
- **Limit**: 5 requests per window per IP address
- **Scope**: Applies to `/api/login`, `/api/register`, `/api/demo`
- **Storage**: In-memory (resets on server restart)
- **Tracking**: By IP address from `req.ip`

**How It Works**:

1. First request from IP: Counter starts at 1
2. Subsequent requests: Counter increments
3. At 6th request within 15 minutes: 429 response returned
4. After 15 minutes: Counter resets automatically
5. Successful authentication may reset counter early (configurable)

**Bypass for Development**:

```typescript
// Set environment variable to disable rate limiting (DEV ONLY)
if (process.env.NODE_ENV === "test") {
  // No rate limiting in test environment
}
```

**Future Scaling**:

- Can upgrade to Redis store for multi-server deployments
- Can implement per-user limits in addition to per-IP
- Can add CAPTCHA after repeated failures

---

## Error Response Standards

### Standardized Error Format

All endpoints return errors in consistent format:

```typescript
{
  message: string,      // Human-readable error message
  code?: string,        // Optional error code for programmatic handling
  details?: unknown     // Optional additional context
}
```

### New Error Codes

| Code                          | HTTP Status | Meaning                 | Action                        |
| ----------------------------- | ----------- | ----------------------- | ----------------------------- |
| `RATE_LIMIT_EXCEEDED`         | 429         | Too many requests       | Wait for `retryAfter` seconds |
| `PASSWORD_MIGRATION_REQUIRED` | 403         | Old password format     | Redirect to password reset    |
| `INVALID_CREDENTIALS`         | 401         | Bad email/password      | Show generic error            |
| `VALIDATION_ERROR`            | 400         | Input validation failed | Fix input and retry           |

---

## Breaking Changes

**None** - All changes are backward compatible

**Additions Only**:

- New 429 response code (clients should already handle unknown errors gracefully)
- New 403 response for password migration (only affects existing users with old passwords)
- New response headers for rate limiting (informational, not required for functionality)

---

## Client Implementation Guide

### Handling Rate Limiting

**Example: Login with Rate Limit Handling**

```typescript
async function login(email: string, password: string) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 429) {
      const data = await response.json();
      const retryAfter = data.retryAfter || 900; // Default 15 min
      throw new Error(`Too many attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes.`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    // Handle network errors, rate limits, auth failures
    throw error;
  }
}
```

**Example: Reading Rate Limit Headers**

```typescript
const remaining = response.headers.get("RateLimit-Remaining");
const limit = response.headers.get("RateLimit-Limit");

if (remaining && parseInt(remaining) < 2) {
  console.warn(`Warning: Only ${remaining}/${limit} login attempts remaining`);
}
```

### Handling Password Migration

```typescript
async function login(email: string, password: string) {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 403) {
    const data = await response.json();
    if (data.requiresReset) {
      // Redirect to password reset flow
      window.location.href = "/reset-password?reason=security-upgrade";
      return;
    }
  }

  // ... handle other responses
}
```

---

## Testing Recommendations

### Test Cases for Clients

1. **Successful Login**: Verify 200 response and user data
2. **Invalid Password**: Verify 401 response with error message
3. **Rate Limit Exceeded**: Make 6 requests rapidly, verify 429 on 6th
4. **Rate Limit Reset**: Wait 15 minutes, verify new requests allowed
5. **Rate Limit Headers**: Check headers after each auth attempt
6. **Password Too Short**: Verify 400 error during registration
7. **Password Too Long**: Test 72+ character passwords

### Integration Test Example

```typescript
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server/index";

describe("POST /api/login - Rate Limiting", () => {
  it("allows 5 failed login attempts", async () => {
    for (let i = 0; i < 5; i++) {
      const response = await request(app)
        .post("/api/login")
        .send({ email: "test@test.com", password: "wrong" });

      expect(response.status).toBe(401);
    }
  });

  it("blocks 6th failed login attempt with 429", async () => {
    // First 5 attempts
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/login").send({ email: "test@test.com", password: "wrong" });
    }

    // 6th attempt should be rate limited
    const response = await request(app)
      .post("/api/login")
      .send({ email: "test@test.com", password: "wrong" });

    expect(response.status).toBe(429);
    expect(response.body.message).toContain("too many");
  });
});
```

---

## Security Considerations

### For API Consumers

1. **Never Log Passwords**: Ensure client code never logs password fields
2. **Use HTTPS**: All authentication should occur over encrypted connections
3. **Handle 429 Gracefully**: Don't retry immediately, respect `retryAfter`
4. **Clear Sensitive Data**: Clear password inputs after successful/failed attempts
5. **Session Management**: Implement proper logout and session timeout on client

### For Server Operators

1. **Environment Variables**: Ensure `SESSION_SECRET` is properly configured
2. **HTTPS/TLS**: Configure SSL certificate in IIS
3. **Rate Limit Monitoring**: Monitor authentication failure rates
4. **IP Allowlisting**: Consider allowlisting trusted IPs if needed
5. **Audit Logs**: Review authentication logs regularly

---

## Migration Timeline

### Phase 1: Deployment (Backward Compatible)

- Deploy new authentication system with bcrypt
- Rate limiting active for all users
- Existing users can still login

### Phase 2: Password Migration (Gradual)

- Users with old passwords redirected to reset flow
- No forced migration initially
- Monitor migration completion rate

### Phase 3: Enforcement (After 30 days, optional)

- Optionally block all non-migrated accounts
- Force password reset for security

**Current Phase**: Phase 1 (Deployment)

---

## Support & Troubleshooting

### Common Issues

**"Too many login attempts" error**:

- Wait 15 minutes before retrying
- Check if multiple users sharing same IP
- Contact support if issue persists

**"Password security upgrade required"**:

- User created before security upgrade
- Use "Forgot Password" to create new secure password
- Cannot recover old password (by design)

**Rate limit affecting legitimate users**:

- Consider increasing limits for your deployment
- Implement IP allowlisting for trusted networks
- Consider CAPTCHA after multiple failures

---

## Changelog

### Version 1.0.0 (2026-02-01)

- Added bcrypt password hashing
- Added rate limiting to auth endpoints (5/15min)
- Added 429 response code for rate limits
- Added 403 response for password migration
- Added rate limit headers (RateLimit-\*)
- Improved error message consistency
- Password field never returned in responses

---

## Related Documentation

- [Data Model Changes](../data-model.md) - Schema updates for User and authentication
- [Quickstart Guide](../quickstart.md) - Setup and configuration
- [Research Document](../research.md) - Technology decisions and rationale
- [Constitution](../../../.specify/memory/constitution.md) - Security principle (IV)

**Status**: ✅ FINAL - Ready for implementation
