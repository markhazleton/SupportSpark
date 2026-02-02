# Manual Security Testing Checklist

**Feature**: 001-audit-compliance-fixes  
**Target**: MVP Beta Release  
**Last Updated**: 2026-02-01

## Purpose

This checklist validates security features implemented in Phase 3 (User Story 1) and Phase 7 (CSRF protection). Perform these tests manually before beta deployment.

---

## Pre-Requisites

### Environment Setup

- [ ] Development server running (`npm run dev`)
- [ ] SESSION_SECRET configured in environment
- [ ] Browser DevTools open (Network + Application tabs)
- [ ] Clean browser state (cleared cookies/storage)

### Test Data Preparation

- [ ] Create test user emails (test1@example.com, test2@example.com, etc.)
- [ ] Prepare test passwords (min 8 chars, test passwords: "TestPass123")
- [ ] Note test start time for rate limit window tracking (15-minute window)

---

## Test Suite 1: Password Hashing (FR-027)

**Objective**: Verify passwords are hashed with bcrypt before storage

### TC-001: Password Storage Format

- [ ] **Action**: Register new user with email `security-test-1@example.com`, password `TestPass123`
- [ ] **Expected**: Registration succeeds (201 Created), returns user object without password
- [ ] **Validate**:
  - Open `data/users.json`
  - Find user with email `security-test-1@example.com`
  - Verify `password` field starts with `$2b$10$` (bcrypt format)
  - Verify `password` length is 60 characters
  - Verify `passwordVersion` field exists and equals `1`
- [ ] **Screenshot**: Save user record showing bcrypt hash format

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: ********************\_\_\_********************

### TC-002: Password Not Leaked in Response

- [ ] **Action**: Login with the test user credentials
- [ ] **Expected**: Login succeeds (200 OK), returns user object
- [ ] **Validate**:
  - Response JSON does not contain `password` field
  - Response JSON does not contain`passwordVersion` field
  - Response contains: `id`, `email`, `firstName`, `lastName`, `displayName`
- [ ] **DevTools**: Check Network tab → Response payload

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: ********************\_\_\_********************

### TC-003: Login with Hashed Password Fails

- [ ] **Action**: Logout, then attempt login with:
  - Email: `security-test-1@example.com`
  - Password: (paste the `$2b$...` hash from users.json)
- [ ] **Expected**: Login fails (401 Unauthorized)
- [ ] **Validate**: Cannot login with the stored hash directly

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: ********************\_\_\_********************

---

## Test Suite 2: Rate Limiting (FR-028)

**Objective**: Verify rate limiting prevents brute force attacks (5 attempts per 15 min)

### TC-004: Rate Limit on Failed Login Attempts

- [ ] **Action**: Create new test user, logout, then make 5 failed login attempts with wrong password
- [ ] **Expected**:
  - Attempts 1-5: Return 401 Unauthorized
  - Each response includes headers:
    - `RateLimit-Limit: 5`
    - `RateLimit-Remaining: 4, 3, 2, 1, 0`
    - `RateLimit-Reset: [timestamp]`
- [ ] **Validate (Attempt 6)**:
  - Make 6th login attempt with wrong password
  - Returns **429 Too Many Requests**
  - Response body: `{ "message": "Too many login attempts, please try again later" }`
  - Response includes `Retry-After` header (in seconds)
- [ ] **DevTools**: Check Network tab → Response headers for rate limit info

**Result**: ☐ PASS | ☐ FAIL  
**Attempts Count**: **\_** (should be 6)  
**429 Response**: ☐ YES | ☐ NO  
**Retry-After Header**: ****\_\_**** seconds  
**Notes**: ********************\_\_\_********************

### TC-005: Rate Limit on Registration Attempts

- [ ] **Action**: Attempt to register 5 new users rapidly (use unique emails: rate-test-1@ through rate-test-5@example.com)
- [ ] **Expected**: First 5 succeed (201 Created), 6th returns 429
- [ ] **Validate**:
  - 6th registration returns 429 Too Many Requests
  - Rate limit headers present
  - Message mentions "Too many" attempts

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: ********************\_\_\_********************

### TC-006: Rate Limit Window Reset

- [ ] **Action**: After TC-004 or TC-005 triggers 429, wait for window to expire
- [ ] **Expected**: After `Retry-After` seconds or 15 minutes (whichever shown), rate limit resets
- [ ] **Validate**:
  - New login/registration attempt succeeds
  - `RateLimit-Remaining` resets to 4 (1 attempt used)
- [ ] **Note**: This test requires waiting 15 minutes or checking `Retry-After` value

**Result**: ☐ PASS | ☐ FAIL | ☐ SKIPPED (time constraint)  
**Wait Time**: ****\_\_**** minutes  
**Notes**: ********************\_\_\_********************

### TC-007: Rate Limit Applies to Demo Endpoints

- [ ] **Action**: Make 6 rapid requests to `POST /api/demo/login/patient`
- [ ] **Expected**: 6th request returns 429 with rate limit headers
- [ ] **Validate**: Demo endpoints protected by same rate limiter

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: ********************\_\_\_********************

---

## Test Suite 3: Environment Variable Validation (FR-029)

**Objective**: Verify app rejects invalid SESSION_SECRET configuration

### TC-008: Missing SESSION_SECRET

- [ ] **Action**:
  - Stop dev server
  - Remove SESSION_SECRET from environment (or rename .env to .env.backup)
  - Attempt to start server: `npm run dev`
- [ ] **Expected**:
  - Server fails to start
  - Error message: "SESSION_SECRET environment variable is required"
  - Process exits with code 1
  - No server listening on port 5000
- [ ] **Validate**: Check console output for error message

**Result**: ☐ PASS | ☐ FAIL  
**Exit Code**: **\_\_\_\_**  
**Error Message**: ********************\_\_\_********************  
**Notes**: ********************\_\_\_********************

### TC-009: Default SESSION_SECRET in Production

- [ ] **Action**:
  - Set `SESSION_SECRET=your-secret-key-here` (default value from old code)
  - Set `NODE_ENV=production`
  - Attempt to start server: `npm start` (or `npm run dev` with env vars)
- [ ] **Expected**:
  - Server fails to start
  - Error message mentions default/insecure secret
  - Process exits with code 1
- [ ] **Validate**: Cannot use default secret in production environment

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: ********************\_\_\_********************

### TC-010: Valid SESSION_SECRET Acceptance

- [ ] **Action**:
  - Restore SESSION_SECRET to valid value (from .env.example)
  - Restart server - Make test request to `/api/health`
- [ ] **Expected**:
  - Server starts successfully
  - Health check returns 200 OK
  - Response: `{ "status": "ok", "configValid": true, "storageReady": true }`

**Result**: ☐ PASS | ☐ FAIL  
**Notes**: ********************\_\_\_********************

---

## Test Suite 4: CSRF Protection (FR-043 NEW)

**Objective**: Verify CSRF protection headers and cookie security

### TC-011: Session Cookie Security

- [ ] **Action**: Login successfully, check Application tab → Cookies
- [ ] **Expected**: Session cookie (`connect.sid` or similar) has:
  - `HttpOnly: true` (not accessible to JavaScript)
  - `Secure: true` (in production only, can be false in dev)
  - `SameSite: Strict` (prevents cross-site requests)
- [ ] **DevTools**: Application → Cookies → localhost:5000

**Result**: ☐ PASS | ☐ FAIL  
**Cookie Attributes**:

- `HttpOnly`: ☐ YES | ☐ NO
- `Secure`: ☐ YES | ☐ NO | ☐ N/A (dev mode)
- `SameSite`: **\_\_\_\_** (should be "Strict")  
  **Notes**: ********************\_\_\_********************

### TC-012: Security Headers Present

- [ ] **Action**: Make any authenticated request (e.g., GET /api/conversations)
- [ ] **Expected**: Response includes security headers:
  - `Strict-Transport-Security: max-age=31536000` (production only)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
- [ ] **DevTools**: Network → Select request → Headers tab → Response Headers

**Result**: ☐ PASS | ☐ FAIL  
**Headers Found**:

- `Strict-Transport-Security`: ☐ YES | ☐ NO | ☐ N/A (dev mode)
- `X-Content-Type-Options`: ☐ YES | ☐ NO
- `X-Frame-Options`: ☐ YES | ☐ NO  
  **Notes**: ********************\_\_\_********************

### TC-013: Payload Size Limit

- [ ] **Action**: Attempt to POST large JSON payload (>10MB) to `/api/register`
- [ ] **Expected**: Request rejected with 413 Payload Too Large
- [ ] **Test Data**: Create JSON with large `displayName` field (11MB+ of text)
- [ ] **Validate**: Server rejects oversized payloads to prevent DoS

**Result**: ☐ PASS | ☐ FAIL | ☐ SKIPPED (hard to generate 10MB test data)  
**Status Code**: **\_\_\_\_**  
**Notes**: ********************\_\_\_********************

---

## Test Suite 5: Password Migration Detection (FR-030 Implied)

**Objective**: Verify legacy users without passwordVersion get 403 response

### TC-014: Legacy User Login Attempt

⚠️ **NOTE**: This test requires manually editing `data/users.json` to create a legacy user record.

- [ ] **Setup**:
  - Open `data/users.json`
  - Add test user with plaintext password and NO `passwordVersion` field:
    ```json
    {
      "id": "legacy-user-1",
      "email": "legacy@example.com",
      "password": "plaintextpassword123",
      "displayName": "Legacy User"
    }
    ```
  - Save file
- [ ] **Action**: Attempt login with email `legacy@example.com`, password `plaintextpassword123`
- [ ] **Expected**:
  - Returns 403 Forbidden
  - Response body: `{ "message": "Password reset required", "requiresReset": true }`
- [ ] **Validate**: Legacy users cannot login, must reset password

**Result**: ☐ PASS | ☐ FAIL | ☐ SKIPPED (manual setup required)  
**Status Code**: **\_\_\_\_**  
**requiresReset Flag**: ☐ YES | ☐ NO  
**Notes**: ********************\_\_\_********************

---

## Test Suite 6: Health Check Endpoint (FR-042)

**Objective**: Verify monitoring endpoint works correctly

### TC-015: Health Check Success

- [ ] **Action**: GET request to `/api/health` (can use browser or curl)
- [ ] **Expected**:
  - Returns 200 OK
  - Response JSON:
    ```json
    {
      "status": "ok",
      "configValid": true,
      "storageReady": true,
      "timestamp": "[ISO timestamp]"
    }
    ```
- [ ] **Validate**: All checks pass when system healthy

**Result**: ☐ PASS | ☐ FAIL  
**Response**: ********************\_\_\_********************  
**Notes**: ********************\_\_\_********************

### TC-016: Health Check Degraded State

- [ ] **Action**:
  - Stop server
  - Temporarily rename `data/` folder to simulate storage failure
  - Start server
  - GET `/api/health`
- [ ] **Expected**:
  - Returns 503 Service Unavailable
  - Response JSON:
    ```json
    {
      "status": "degraded",
      "configValid": true,
      "storageReady": false,
      "timestamp": "[ISO timestamp]"
    }
    ```
- [ ] **Validate**: Health check detects storage issues

**Result**: ☐ PASS | ☐ FAIL | ☐ SKIPPED (optional)  
**Notes**: ********************\_\_\_********************

---

## Summary Checklist

### Critical Tests (Must Pass for Beta)

- [ ] TC-001: Passwords stored as bcrypt hashes
- [ ] TC-002: Passwords not leaked in API responses
- [ ] TC-004: Rate limiting triggers on 6th failed login (429)
- [ ] TC-005: Rate limiting triggers on 6th registration (429)
- [ ] TC-008: Server rejects missing SESSION_SECRET
- [ ] TC-011: Session cookies have proper security attributes
- [ ] TC-012: Security headers present in responses
- [ ] TC-015: Health check endpoint operational

### Important Tests (Should Pass for Production)

- [ ] TC-003: Cannot login with stored hash
- [ ] TC-007: Demo endpoints rate limited
- [ ] TC-009: Default SESSION_SECRET rejected in production
- [ ] TC-013: Oversized payloads rejected
- [ ] TC-014: Legacy users get 403 (requires manual setup)

### Optional Tests (Nice to Have)

- [ ] TC-006: Rate limit window resets after 15 minutes
- [ ] TC-016: Health check detects degraded storage state

---

## Test Execution Log

**Tester**: ********************\_\_\_********************  
**Date**: ********************\_\_\_********************  
**Environment**: ☐ Development | ☐ Staging | ☐ Production  
**Build Version**: ********************\_\_\_********************

### Results Summary

| Test ID | Feature                    | Result               | Notes |
| ------- | -------------------------- | -------------------- | ----- |
| TC-001  | Password hashing           | ☐ PASS ☐ FAIL        |       |
| TC-002  | Password sanitization      | ☐ PASS ☐ FAIL        |       |
| TC-003  | Hash login prevention      | ☐ PASS ☐ FAIL        |       |
| TC-004  | Login rate limiting        | ☐ PASS ☐ FAIL        |       |
| TC-005  | Registration rate limiting | ☐ PASS ☐ FAIL        |       |
| TC-006  | Rate limit reset           | ☐ PASS ☐ FAIL ☐ SKIP |       |
| TC-007  | Demo rate limiting         | ☐ PASS ☐ FAIL        |       |
| TC-008  | Missing SESSION_SECRET     | ☐ PASS ☐ FAIL        |       |
| TC-009  | Default secret rejection   | ☐ PASS ☐ FAIL        |       |
| TC-010  | Valid secret acceptance    | ☐ PASS ☐ FAIL        |       |
| TC-011  | Cookie security            | ☐ PASS ☐ FAIL        |       |
| TC-012  | Security headers           | ☐ PASS ☐ FAIL        |       |
| TC-013  | Payload size limit         | ☐ PASS ☐ FAIL ☐ SKIP |       |
| TC-014  | Password migration         | ☐ PASS ☐ FAIL ☐ SKIP |       |
| TC-015  | Health check OK            | ☐ PASS ☐ FAIL        |       |
| TC-016  | Health check degraded      | ☐ PASS ☐ FAIL ☐ SKIP |       |

### Overall Status

- **Total Tests**: 16
- **Tests Run**: ☐☐☐☐☐☐☐☐☐☐☐☐☐☐☐☐
- **Passed**: **\_** / **\_**
- **Failed**: **\_**
- **Skipped**: **\_**
- **Pass Rate**: **\_** %

### Critical Issues Found

1. ***
2. ***
3. ***

### Recommendations

---

---

---

### Sign-Off

| Role              | Name | Signature | Date |
| ----------------- | ---- | --------- | ---- |
| Developer         |      |           |      |
| QA Tester         |      |           |      |
| Security Reviewer |      |           |      |

---

**Note**: This checklist should be executed before each major release. For beta deployment, all critical tests must pass. For production deployment, all critical + important tests should pass.
