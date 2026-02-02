# SupportSpark Architecture Guide

> **Long-lasting documentation** for architectural decisions and system design.

## System Overview

SupportSpark is a support network platform enabling users to share journey updates with their trusted support network. The architecture follows a clean separation between frontend, backend, and shared contracts.

## Architecture Principles

### 1. Type-Safe Contract-First Design

All API communication flows through shared contracts defined in `shared/routes.ts`:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ shared/      │◀────│   Server    │
│   (React)   │     │ routes.ts    │     │  (Express)  │
└─────────────┘     │ schema.ts    │     └─────────────┘
                    └──────────────┘
```

**Benefits:**

- Compile-time type checking for API calls
- Single source of truth for data shapes
- Breaking changes caught at build time

### 2. Component Hierarchy

```
┌─────────────────────────────────────────┐
│                 App.tsx                 │
│    (Routing, Auth Provider, Layout)     │
└─────────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐   ┌─────────────┐
│  Pages  │   │  Pages  │   │    Pages    │
│  (Auth) │   │ (Dash)  │   │ (Supporters)│
└─────────┘   └─────────┘   └─────────────┘
    │               │               │
    ▼               ▼               ▼
┌─────────────────────────────────────────┐
│         Custom Components               │
│  (NavBar, Dialogs, Card layouts)        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         shadcn/ui Primitives            │
│    (Button, Card, Dialog, Input)        │
└─────────────────────────────────────────┘
```

### 3. Data Flow

```
User Action
    │
    ▼
┌─────────────────────┐
│   React Component   │
│   (useMutation)     │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  TanStack Query     │
│  (Cache, Dedupe)    │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  API Request        │
│  (fetch + Zod)      │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Express Handler    │
│  (routes.ts)        │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│  Storage Layer      │
│  (IStorage impl)    │
└─────────────────────┘
```

## Key Design Decisions

### Why File-Based Storage (Development)?

- Rapid prototyping without database setup
- Easy inspection and debugging via JSON files
- Portable development environment
- Migration path to PostgreSQL via Drizzle ORM

### Why Wouter Over React Router?

- Minimal bundle size (~1KB vs ~13KB)
- Simple API sufficient for current needs
- Easy migration path if needs grow

### Why shadcn/ui?

- Copy-paste ownership (not npm dependency)
- Full customization control
- Radix primitives ensure accessibility
- Consistent with Tailwind CSS workflow

## Module Boundaries

| Module                   | Responsibility                | Dependencies      |
| ------------------------ | ----------------------------- | ----------------- |
| `client/src/pages/`      | Route-level UI, data fetching | hooks, components |
| `client/src/hooks/`      | Business logic, React Query   | shared/schema     |
| `client/src/components/` | Reusable UI elements          | ui primitives     |
| `server/routes.ts`       | HTTP handlers                 | storage, shared   |
| `server/storage.ts`      | Data persistence              | shared/schema     |
| `shared/schema.ts`       | Type definitions              | Zod               |
| `shared/routes.ts`       | API contracts                 | schema            |

## Error Handling Strategy

1. **Client Side**: React Query error boundaries + toast notifications
2. **Server Side**: Standardized error schemas from `shared/routes.ts`
3. **Validation**: Zod `safeParse` for graceful failure handling

## Security Architecture

```
┌─────────────────────────────────────────┐
│              Client Request             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Express Session Check           │
│     (express-session + Passport)        │
└─────────────────────────────────────────┘
                    │
        ┌──────────┴──────────┐
        ▼                     ▼
┌─────────────┐       ┌───────────────┐
│ Authenticated│      │ Unauthenticated│
│   Routes     │      │    Routes      │
└─────────────┘       └───────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│       Authorization Check               │
│  (Member access vs Supporter access)    │
└─────────────────────────────────────────┘
```

## Future Considerations

- **Database Migration**: Drizzle ORM configured for PostgreSQL
- **Real-time Updates**: WebSocket integration for live notifications
- **File Uploads**: S3-compatible storage for conversation attachments

---

**Last Updated**: 2026-02-01 | **Constitution Reference**: `.specify/memory/constitution.md`
