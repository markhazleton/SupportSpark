<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

# SupportSpark

> A compassionate support network platform helping people share updates with their trusted circle during life's challenging moments.

SupportSpark provides a **calm, distraction-free space** where members can post journey updates while supporters read and respond with encouragement through threaded conversations. Whether navigating health challenges, life transitions, or personal journeys, SupportSpark keeps your support network informed and connected.

---

## Why SupportSpark?

During difficult times, keeping loved ones updated can be exhausting. SupportSpark solves this by:

- **One update, many readers** — Post once, reach everyone who cares
- **Role-based access** — Members create updates; supporters view and respond
- **Threaded conversations** — Organized, meaningful dialogue instead of scattered messages
- **Invitation-only network** — You control exactly who sees your journey
- **Calming design** — A peaceful teal/sage interface designed for sensitive moments

---

## Features

### For Members (Update Creators)
- Create and manage journey conversations
- Post updates with text and images
- Invite trusted supporters via email
- Control supporter access (accept/reject)
- View supporter engagement

### For Supporters
- Receive invitations from members
- Read journey updates in real-time
- Reply with encouragement and support
- Threaded replies for organized conversations

### Platform Features
- **Demo Mode** — Explore functionality without creating an account
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Accessible UI** — Built on Radix primitives for WCAG compliance
- **Type-Safe** — End-to-end TypeScript with Zod runtime validation

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + Vite | Modern, fast UI with HMR |
| **UI Library** | shadcn/ui + Radix | Accessible, customizable components |
| **Styling** | Tailwind CSS 4 | Utility-first, calming design system |
| **Animations** | Framer Motion | Smooth, purposeful transitions |
| **State** | TanStack React Query | Server state with caching |
| **Routing** | Wouter | Lightweight client routing |
| **Backend** | Express 5 | RESTful API server |
| **Auth** | Passport.js + Sessions | Secure authentication |
| **Validation** | Zod | Runtime type safety |
| **Language** | TypeScript (strict) | Full type coverage |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **pnpm**

### Installation

```bash
# Clone the repository
git clone https://github.com/MarkHazleton/SupportSpark.git
cd SupportSpark

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | TypeScript type checking |

---

## Deployment

### Windows 11 + IIS (Production)

SupportSpark is designed for production deployment on **Windows 11 with IIS**. The application uses **iisnode** to host the Node.js backend through IIS.

#### Automated Deployment

Use the PowerShell deployment script:

```powershell
# Run as Administrator
.\script\deploy-iis.ps1
```

This script will:
- Build the application
- Copy files to `C:\inetpub\supportspark`
- Install production dependencies
- Set folder permissions
- Create and configure IIS site

#### Manual Deployment

See the comprehensive [IIS Deployment Guide](docs/domain/deployment-iis.md) for:
- Prerequisites (IIS, iisnode, URL Rewrite)
- Step-by-step deployment instructions
- SSL/TLS configuration
- Database setup for production
- Troubleshooting guide

#### Build Output

The build process (`npm run build`) creates:
- `dist/index.cjs` — Compiled Express server (CommonJS for iisnode)
- `dist/public/` — Frontend static files
- `dist/web.config` — IIS configuration with URL rewrite rules

For other deployment options (Docker, cloud platforms), see the constitution principle VIII for build requirements.

---

## Project Structure

```
SupportSpark/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   └── ui/         # shadcn/ui primitives
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Route components
│   │   └── lib/            # Utilities
│   └── public/             # Static assets
│
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route handlers
│   └── storage.ts          # Data persistence layer
│
├── shared/                 # Shared code
│   ├── schema.ts           # Zod schemas (single source of truth)
│   └── routes.ts           # API contracts
│
├── data/                   # JSON storage (development)
│   ├── users.json
│   ├── supporters.json
│   └── conversations/
│
├── docs/                   # Documentation
│   ├── domain/             # Architectural docs
│   └── copilot/            # Session-based docs
│
└── .specify/memory/
    └── constitution.md     # Project governance
```

---

## API Overview

All API endpoints follow the contract pattern defined in `shared/routes.ts`:

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/logout` | POST | End session |
| `/api/auth/user` | GET | Get current user |

### Conversations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations` | GET | List user's conversations |
| `/api/conversations` | POST | Create new conversation |
| `/api/conversations/:id` | GET | Get conversation details |
| `/api/conversations/:id/messages` | POST | Add message/reply |

### Supporters
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/supporters` | GET | List supporters |
| `/api/supporters/invite` | POST | Invite by email |
| `/api/supporters/:id` | PUT | Accept/reject invitation |

---

## Development Guidelines

This project follows strict development principles defined in the [Constitution](.specify/memory/constitution.md):

### Core Principles

1. **Type Safety** — TypeScript strict mode, Zod for runtime validation
2. **Testing** — All features require tests (Vitest)
3. **UI Components** — Use shadcn/ui primitives exclusively
4. **Security** — bcrypt for passwords, env vars for secrets
5. **API Contracts** — Define all routes in `shared/routes.ts`
6. **State Management** — TanStack React Query for server state
7. **Code Style** — ESLint + Prettier enforcement

### Adding New Features

1. Define Zod schema in `shared/schema.ts`
2. Add route contract in `shared/routes.ts`
3. Implement handler in `server/routes.ts`
4. Create React component using shadcn/ui
5. Write tests
6. Document in appropriate `/docs` folder

---

## Documentation

| Document | Purpose |
|----------|---------|
| [Constitution](.specify/memory/constitution.md) | Project governance and principles |
| [Architecture](docs/domain/architecture.md) | System design and data flow |
| [Patterns](docs/domain/development-patterns.md) | Common development patterns |
| [IIS Deployment](docs/domain/deployment-iis.md) | Windows 11 + IIS deployment guide |
| [Copilot Instructions](.github/copilot-instructions.md) | AI assistant context |

---

## Environment Variables

```bash
# Required for production
SESSION_SECRET=your-secure-session-secret

# Optional: Database (when migrating from file storage)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

---

## Roadmap

- [ ] **Testing Infrastructure** — Vitest configuration
- [ ] **Production Database** — PostgreSQL via Drizzle ORM
- [ ] **Real-time Updates** — WebSocket notifications
- [ ] **File Uploads** — S3-compatible image storage
- [ ] **Email Notifications** — Supporter invitation emails
- [ ] **Mobile App** — React Native companion

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Ensure code follows [Constitution](.specify/memory/constitution.md) principles
4. Write/update tests
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) — Beautiful, accessible components
- [Radix UI](https://www.radix-ui.com/) — Unstyled, accessible primitives
- [TanStack Query](https://tanstack.com/query) — Powerful data synchronization
- [Zod](https://zod.dev/) — TypeScript-first schema validation

---

<p align="center">
  <strong>Built with care for those navigating life's challenges.</strong>
</p>
