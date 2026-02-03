# Quickstart Guide: Production Readiness Fixes

**Feature**: Production Readiness - Critical Compliance Fixes  
**Date**: 2026-02-01  
**For**: Developers, DevOps, QA Engineers

## Overview

This guide walks through setting up, testing, and validating the security hardening, type safety improvements, testing infrastructure, and deployment readiness fixes. Follow these steps in order for best results.

---

## Prerequisites

**Required**:

- Node.js 18+ and npm 8+
- Git
- Windows 11 (for IIS deployment)
- VS Code (recommended) with GitHub Copilot
- PowerShell 5.1+ (for deployment scripts)

**Optional for IIS Testing**:

- IIS 10.0+ with iisnode installed
- URL Rewrite module for IIS

---

## Quick Setup (5 Minutes)

### 1. Clone and Install

```bash
# Navigate to project
cd C:\GitHub\MarkHazleton\SupportSpark

# Ensure on feature branch
git checkout 001-audit-compliance-fixes

# Install ALL dependencies (including new dev dependencies)
npm install
```

**New Dependencies Added**:

- `bcrypt` - Password hashing
- `express-rate-limit` - Rate limiting
- `vitest`, `@vitest/ui` - Testing framework
- `eslint`, `prettier` - Code quality
- `@testing-library/react`, `jsdom` - React testing
- `supertest` - API testing

### 2. Configure Environment

```bash
# Copy environment template
copy .env.example .env

# Generate secure session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env file and paste generated secret
# Set SESSION_SECRET=<generated-hex-value>
# Set NODE_ENV=development
```

**Example `.env` file**:

```bash
NODE_ENV=development
SESSION_SECRET=a1b2c3d4e5f6...  # Use your generated value
PORT=3000
```

### 3. Verify Setup

```bash
# Check TypeScript compilation
npm run type-check

# Run linting (may show violations before fixes)
npm run lint

# Run tests (after implementation)
npm test
```

---

## Development Workflow

### Run Development Server

```bash
# Start with hot reload
npm run dev
```

**Server**: http://localhost:5000 (Vite dev server proxies to Express)  
**What to Test**:

- Login with existing user (before password migration)
- Register new user (tests bcrypt hashing)
- Attempt 6 logins rapidly (tests rate limiting)

### Run Linting

```bash
# Check for violations
npm run lint

# Auto-fix style issues
npm run lint:fix

# Format all files
npm run format

# Check formatting only
npm run format:check
```

**Expected Result**: Zero violations after fixes implemented

### Run Tests

```bash
# Run all tests
npm test

# Run with UI
npm test -- --ui

# Run with coverage
npm test -- --coverage

# Watch mode during development
npm test -- --watch
```

**Coverage Targets**:

- Authentication: 80%+
- Storage: 80%+
- Overall: 70%+

### Type Checking

```bash
# Check types without emitting files
npm run type-check

# Should show zero errors after implementation
```

---

## Testing Security Features

### Test Password Hashing

**Test Registration**:

```bash
# Register a new user via API
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123","firstName":"Test"}'

# Verify password is hashed in data/users.json
# Should see: "$2b$10$..." not "SecurePass123"
```

**Test Login with Bcrypt**:

```bash
# Login with correct password
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'

# Should return user object (without password)

# Login with incorrect password
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"WrongPassword"}'

# Should return 401 Unauthorized
```

### Test Rate Limiting

**Test Attack Simulation**:

```powershell
# Run 6 failed login attempts rapidly (PowerShell)
for ($i = 1; $i -le 6; $i++) {
  Write-Host "Attempt $i:"
  curl -X POST http://localhost:5000/api/login `
    -H "Content-Type: application/json" `
    -d '{"email":"test@example.com","password":"wrong"}'
  Start-Sleep -Seconds 1
}

# 6th request should return 429 Too Many Requests
```

**Test Rate Limit Headers**:

```bash
# Check headers after login attempt
curl -v -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  2>&1 | Select-String "RateLimit"

# Should see:
# RateLimit-Limit: 5
# RateLimit-Remaining: 4
# RateLimit-Reset: <timestamp>
```

### Test Environment Validation

**Test Missing SESSION_SECRET**:

```powershell
# Temporarily remove SESSION_SECRET
$env:SESSION_SECRET = ""

# Try to start server
npm start

# Should fail with error:
# ❌ Missing required environment variables: SESSION_SECRET
# See .env.example for configuration details

# Restore SESSION_SECRET
$env:SESSION_SECRET = "your-secret-here"
```

---

## Testing Type Safety

### Verify TypeScript Compilation

```bash
# Should compile with zero errors
npm run type-check
```

**Common Pre-Fix Errors** (should not appear after fixes):

- `Parameter 'req' implicitly has an 'any' type`
- `Parameter 'res' implicitly has an 'any' type`
- `Type 'any' is not assignable to type...`

### Test API Type Safety

```typescript
// In VS Code, hover over API responses to see types
import { api } from "@shared/routes";

// Should show full type, not 'any'
const listResponse = api.conversations.list.responses[200];
// Type: z.ZodArray<z.ZodObject<...>> (full conversation schema)
```

---

## Running Test Suite

### Unit Tests

```bash
# Run specific test file
npm test -- server/storage.test.ts

# Run tests matching pattern
npm test -- --grep "authentication"

# Run with verbose output
npm test -- --reporter=verbose
```

### Integration Tests

```bash
# Run API integration tests
npm test -- server/routes.test.ts

# Tests cover:
# - Login flow with bcrypt
# - Registration with password hashing
# - Rate limiting behavior
# - Session management
```

### React Component Tests

```bash
# Run component tests
npm test -- client/src

# Tests cover:
# - useAuth hook
# - useConversations hook
# - Auth page component
```

### Coverage Report

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
start coverage/index.html  # Windows
# or
open coverage/index.html   # Mac/Linux

# Check coverage metrics:
# - Statements: Should be 80%+ for server/routes.ts
# - Branches: Should be 75%+ for authentication logic
# - Functions: Should be 80%+ for core functions
```

---

## Building for Production

### Create Production Build

```bash
# Build both client and server
npm run build

# Output in dist/ directory:
# dist/
# ├── index.cjs           # Server bundle (CommonJS for iisnode)
# ├── public/             # Client static files
# ├── web.config          # IIS configuration
# └── data/               # Empty data directory structure
```

### Validate Build

```bash
# Check build artifacts exist
dir dist\index.cjs
dir dist\public\index.html
dir dist\web.config

# Validate web.config contains iisnode handler
Select-String -Path dist\web.config -Pattern "iisnode"

# Should output: <add name="iisnode" path="index.cjs" ...>
```

### Test Production Build Locally

```bash
# Set production environment
$env:NODE_ENV = "production"
$env:SESSION_SECRET = "production-secret-here"

# Install production dependencies only
cd dist
npm install --production

# Start server
node index.cjs

# Test at http://localhost:3000
```

---

## IIS Deployment

### Prerequisites

1. **Install iisnode**:

   ```powershell
   # Download from: https://github.com/Azure/iisnode/releases
   # Run installer: iisnode-full-v0.2.26-x64.msi
   ```

2. **Install URL Rewrite**:

   ```powershell
   # Download from: https://www.iis.net/downloads/microsoft/url-rewrite
   # Or use Web Platform Installer
   ```

3. **Create IIS Website**:
   ```powershell
   # In IIS Manager:
   # - Right-click Sites → Add Website
   # - Site name: SupportSpark
   # - Physical path: C:\inetpub\wwwroot\supportspark
   # - Port: 80 (or configure binding as needed)
   ```

### Deploy to IIS

```powershell
# 1. Build the application
npm run build

# 2. Copy dist/ contents to IIS directory
$sitePath = "C:\inetpub\wwwroot\supportspark"
Copy-Item -Recurse -Force dist\* $sitePath

# 3. Run deployment script (configures permissions)
.\script\deploy-iis.ps1 -SitePath $sitePath

# Script performs:
# - Creates data directory with proper permissions
# - Configures IIS_IUSRS write access
# - Validates web.config
# - Initializes data structure
```

### Configure Environment Variables in IIS

**Option 1: IIS Configuration Editor (Recommended)**

```powershell
# 1. Open IIS Manager
# 2. Select "SupportSpark" website
# 3. Double-click "Configuration Editor"
# 4. Section: system.webServer/iisnode
# 5. Expand "environmentVariables" collection
# 6. Add items:
#    - Name: SESSION_SECRET, Value: <your-secure-secret>
#    - Name: NODE_ENV, Value: production
```

**Option 2: web.config (Less Secure)**

```xml
<!-- In dist/web.config -->
<iisnode>
  <environmentVariables>
    <add name="NODE_ENV" value="production" />
    <add name="SESSION_SECRET" value="your-secret-here" />
  </environmentVariables>
</iisnode>
```

### Test IIS Deployment

```powershell
# 1. Restart IIS
iisreset

# 2. Test website
Start-Process "http://localhost/supportspark"

# 3. Check logs
Get-Content "C:\inetpub\wwwroot\supportspark\iisnode\*.log" -Tail 50

# 4. Verify data directory permissions
icacls "C:\inetpub\wwwroot\supportspark\data"
# Should show: IIS_IUSRS:(OI)(CI)(M)
```

### Troubleshooting IIS

**Issue: 500 Internal Server Error**

```powershell
# Check iisnode logs
Get-Content "C:\inetpub\wwwroot\supportspark\iisnode\*.log" -Tail 100

# Common causes:
# 1. Missing SESSION_SECRET: Configure environment variable
# 2. Data directory permissions: Run deploy-iis.ps1 script
# 3. Missing dependencies: npm install --production in site directory
```

**Issue: 404 for API routes**

```powershell
# Verify URL Rewrite module installed
Get-WindowsFeature | Where-Object {$_.Name -like "*rewrite*"}

# Check web.config has rewrite rules
Select-String -Path "C:\inetpub\wwwroot\supportspark\web.config" -Pattern "rewrite"
```

**Issue: Data file write errors**

```powershell
# Check data directory permissions
icacls "C:\inetpub\wwwroot\supportspark\data"

# Re-run deployment script if needed
.\script\deploy-iis.ps1 -SitePath "C:\inetpub\wwwroot\supportspark"
```

---

## Validation Checklist

### Security Validation

- [ ] Passwords stored as hashes in `data/users.json`
- [ ] Login accepts correct password, rejects incorrect
- [ ] 6th login attempt within 15min returns 429
- [ ] Rate limit headers present in responses
- [ ] Server fails to start without SESSION_SECRET
- [ ] No passwords appear in server logs

### Type Safety Validation

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run lint` passes with zero violations
- [ ] All `any` types have explicit justification comments
- [ ] API responses properly typed (no `z.custom<any>()`)
- [ ] AuthenticatedRequest used for protected routes

### Testing Validation

- [ ] `npm test` passes all tests
- [ ] Coverage report shows 80%+ for auth/storage
- [ ] Integration tests verify authentication flow
- [ ] Unit tests verify password hashing
- [ ] Hook tests verify React Query integration

### Code Quality Validation

- [ ] `npm run lint:fix` auto-fixes all style issues
- [ ] `npm run format` formats all files consistently
- [ ] Code follows import order (external → @shared → @/ → relative)
- [ ] Pre-commit hooks block non-compliant commits (if configured)

### Deployment Validation

- [ ] `npm run build` completes successfully
- [ ] `dist/` contains index.cjs, public/, web.config, data/
- [ ] web.config validated (contains iisnode handler)
- [ ] Production build starts locally with proper environment
- [ ] IIS deployment script runs without errors
- [ ] Data directory has IIS_IUSRS permissions
- [ ] Website loads in IIS and handles requests

---

## Common Issues & Solutions

### "Module 'bcrypt' not found"

```bash
# Reinstall dependencies
npm install
```

### "Cannot find module '@/components/ui/button'"

```typescript
// Check tsconfig.json has path aliases
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

### "ENOENT: no such file or directory, open 'data/users.json'"

```bash
# Create data directory structure
npm run init-data  # If script exists
# OR manually:
mkdir data
echo [] > data/users.json
echo [] > data/supporters.json
```

### Tests Hang or Timeout

```bash
# Check Vitest configuration
# Ensure test environment is correct for each test type

# Server tests should NOT use 'jsdom'
# React tests MUST use 'jsdom'

# Use per-file environment configuration if needed
```

### Linting Errors After Auto-Fix

```bash
# Some errors require manual fixes
npm run lint

# Review errors, fix manually, then:
npm run lint:fix
```

---

## Next Steps After Setup

1. **Review Documentation**:
   - [research.md](./research.md) - Technology decisions
   - [data-model.md](./data-model.md) - Schema changes
   - [contracts/security-updates.md](./contracts/security-updates.md) - API changes

2. **Begin Implementation**:
   - Run `/speckit.tasks` to generate detailed task breakdown
   - Start with highest priority (P1) tasks
   - Write tests first (TDD approach)

3. **Continuous Validation**:
   - Run `npm run validate` before commits
   - Check test coverage regularly
   - Monitor linting violations

4. **Deployment Preparation**:
   - Test in IIS staging environment
   - Document any environment-specific configuration
   - Plan user communication for password migration

---

## Support Resources

**Documentation**:

- [SupportSpark Constitution](../../.documentation/memory/constitution.md)
- [Site Audit Results](../../.documentation/copilot/audit/2026-02-01_results.md)
- [Feature Specification](./spec.md)

**Tools**:

- Vitest UI: `npm test -- --ui` (http://localhost:51204)
- Coverage Report: `coverage/index.html`
- ESLint Viewer: VS Code Problems panel

**Commands Reference**:

```bash
npm run dev          # Start development server
npm test             # Run tests
npm test -- --ui     # Interactive test UI
npm run lint         # Check linting
npm run lint:fix     # Auto-fix linting
npm run format       # Format all files
npm run type-check   # Check TypeScript
npm run build        # Build for production
npm run validate     # Run all checks
```

---

**Status**: ✅ READY - Follow this guide for development and deployment

**Estimated Setup Time**:

- Initial setup: 5-10 minutes
- Understanding workflow: 15 minutes
- First test run: 5 minutes
- IIS deployment (production): 30 minutes
