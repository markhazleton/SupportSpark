# SupportSpark

## Overview

SupportSpark is a support network platform designed to help people going through difficult times share updates with their trusted support network. The application provides a calm, distraction-free space where members can post journey updates and supporters can read and respond with encouragement through threaded conversations.

Key features:

- Member-to-supporter relationship management with invitation system
- Threaded conversation updates for sharing personal journeys
- Role-based access (members create updates, supporters view and respond)
- Demo mode for showcasing functionality

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom calming color palette (teal/sage theme)
- **Animations**: Framer Motion for page transitions and UI animations
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints with typed contracts defined in shared/routes.ts
- **Authentication**: Passport.js with Local Strategy, express-session with MemoryStore
- **Build Tool**: Vite for development, esbuild for production bundling

### Data Storage

- **Primary Storage**: File-based JSON storage (data/ directory)
  - users.json: User accounts
  - supporters.json: Member-supporter relationships
  - conversations/: Individual conversation files with index.json and meta.json
- **Database Schema**: Drizzle ORM with PostgreSQL configured (ready for migration from file storage)
- **Schema Location**: shared/schema.ts using Zod for validation

### Project Structure

```
client/           # React frontend
  src/
    components/   # Reusable UI components
    hooks/        # Custom React hooks (auth, conversations, supporters)
    pages/        # Route components
    lib/          # Utilities and query client
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  storage.ts      # File-based storage implementation
shared/           # Shared types and contracts
  schema.ts       # Zod schemas for data models
  routes.ts       # API contract definitions
data/             # JSON file storage
```

### Authentication Flow

- Session-based authentication using express-session
- Passport Local Strategy for email/password login
- Protected routes check authentication state via /api/auth/user endpoint
- Client-side auth state managed through React Query

### API Contract Pattern

The shared/routes.ts file defines a typed API contract with:

- HTTP method, path, and response schemas for each endpoint
- Zod schemas for request/response validation
- Helper function buildUrl() for constructing parameterized URLs

## External Dependencies

### UI Framework

- **Radix UI**: Full suite of accessible, unstyled primitives (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled components using Radix + Tailwind
- **Lucide React**: Icon library

### Data & Forms

- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management
- **Zod**: Schema validation for forms and API contracts

### Database (configured but using file storage)

- **Drizzle ORM**: Type-safe ORM configured for PostgreSQL
- **drizzle-kit**: Database migration tooling
- **DATABASE_URL**: Environment variable for PostgreSQL connection

### Authentication

- **Passport.js**: Authentication middleware
- **passport-local**: Username/password strategy
- **express-session**: Session management
- **memorystore**: In-memory session store (development)

### Build & Development

- **Vite**: Development server with HMR
- **esbuild**: Production bundling
- **tsx**: TypeScript execution for Node.js
