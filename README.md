# AI Site Builder 🚀

## Overview
AI-powered website builder that generates full websites from natural language prompts using Google Gemini AI. Users can create, edit, preview, and publish modular websites with a drag-and-drop interface, credit-based system, and Stripe payments.

**Monorepo structure**: React frontend + Express/Prisma backend.

## ✨ Features
- **AI Generation**: Create websites from prompts using Gemini (generates HTML/CSS/JS components)
- **Modular Components**: Hero, features, navbar, etc. with editable HTML/CSS/JS
- **Real-time Preview**: Live preview of assembled site
- **User Projects**: Save, version, publish projects
- **Auth & Sessions**: Better Auth (email/password + OAuth)
- **Credits System**: Free tier (20 credits) + paid plans via Stripe
- **Chat Interface**: Conversation history with AI
- **Responsive Design**: TailwindCSS + modern UI
- **Database**: PostgreSQL with Prisma ORM

## 🏗️ Architecture Diagram

```mermaid
graph TB
    subgraph Client [Frontend - React + Vite]
        A[App.tsx] --> B[Router]
        B --> C[Home/Preview/Projects]
        C --> D[EditorPanel/Sidebar/ProjectPreview]
        D --> E[Axiom API Calls]
    end

    subgraph Server [Backend - Express + Prisma]
        F[API Routes] --> G[userRoutes]
        F --> H[projectRoutes]
        F --> I[Auth Handler]
        H --> J[GenerationController - Gemini AI]
        J --> K[Gemini API]
        G --> L[Prisma - Postgres DB]
        F --> M[Stripe Webhook]
    end

    subgraph DB [Database]
        N[User] --> O[WebsiteProject]
        O --> P[Component]
        O --> Q[Version]
        O --> R[Conversation]
        N --> S[Transaction/Session/Account]
    end

    subgraph External [External Services]
        T[Stripe Payments]
        U[Google Gemini]
        V[Postgres DB]
    end

    E -.-> F
    L --> V
    M <--> T
    J <--> U
```

## 🛠️ Tech Stack

### Frontend (`client/`)
| Category | Tech |
|----------|------|
| Framework | React 19 + React Router |
| Styling | TailwindCSS 4 + Tailwind Merge + CVA |
| Build | Vite 7 |
| UI/Icons | Lucide React + Sonner (toasts) |
| HTTP | Axios |
| Auth UI | Better Auth UI |
| TypeScript | 5.9 |

### Backend (`server/`)
| Category | Tech |
|----------|------|
| Framework | Express 5 |
| DB/ORM | Prisma 7 + PostgreSQL + pg adapter |
| Auth | Better Auth 1.4 |
| AI | @google/generative-ai 0.24 |
| Payments | Stripe 20 |
| Runtime | TSX + Nodemon |

### Deployment
- Frontend: Vercel (`client/vercel.json`)
- Backend: Vercel (`server/vercel.json`)

## 📋 Prerequisites
- Node.js 20+
- PostgreSQL 15+ (local or cloud like Neon/Supabase)
- Google Gemini API key
- Stripe secret key + webhook secret
- .env files (see below)

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repo> site-builder
cd site-builder
```

### 2. Environment Setup
Create `.env` in root and `server/`:

**Root `.env`:**
```
# Shared
DATABASE_URL='postgresql://user:pass@localhost:5432/sitebuilder'
GOOGLE_GEMINI_API_KEY='your-gemini-key'
STRIPE_SECRET_KEY='sk_test_...'
STRIPE_WEBHOOK_SECRET='whsec_...'
```

**server/.env** (copy from root or duplicate vars)

### 3. Database Setup
```bash
cd server
npx prisma generate
npx prisma db push  # or migrate
```

### 4. Install Dependencies
```bash
# Client
cd client
npm install

# Server
cd ../server
npm install
```

### 5. Run Development
```bash
# Terminal 1 - Server
cd server
npm run server  # http://localhost:3000

# Terminal 2 - Client
cd client
npm run dev     # http://localhost:5173
```

**Access**: Will Update Soon

## 🔌 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/*` | Auth (sign up/in/out) |
| GET/POST | `/api/user/*` | User profile, projects |
| GET/POST/DELETE | `/api/project/*` | Create/list/update projects |
| POST | `/api/project/generate` | AI generate components |
| POST | `/api/stripe` | Stripe webhook |

## 🗂️ Project Structure
```
site-builder/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/       # Routes: Home, Projects, Editor
│   │   ├── components/  # EditorPanel, Sidebar, Navbar
│   │   └── configs/     # Axios, Auth
│   ├── public/
│   └── package.json
├── server/              # Express API
│   ├── controllers/     # User, Project, Generation, Stripe
│   ├── routes/          # User/Project routes
│   ├── prisma/          # Schema + migrations
│   ├── lib/             # Auth, Prisma client
│   └── server.ts
├── prisma/schema.prisma # Shared models
├── TODO.md              # Current tasks
└── README.md            # This file
```

## 🌐 Environment Variables
| Key | Description | Required |
|-----|-------------|----------|
| `DATABASE_URL` | Postgres connection | Yes |
| `GOOGLE_GEMINI_API_KEY` | Gemini AI API | Yes |
| `STRIPE_SECRET_KEY` | Stripe payments | Yes (prod) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | Yes (prod) |
| `TRUSTED_ORIGINS` | CORS allowed origins | No |

## 📄 License
ISC

## 🙌 Support
Built with ❤️ using modern stack. Issues? Open a GitHub issue.

