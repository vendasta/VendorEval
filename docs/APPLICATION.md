# VendorEval AI -- Application Documentation

## Overview

VendorEval AI is a vendor proposal evaluation platform that automates the procurement analysis workflow. Users upload vendor proposals and requirements, and the system extracts structured data, scores vendors across multiple dimensions, detects contract red flags, generates side-by-side comparisons, and recommends the best vendor with reasoning.

**Target users:** Procurement managers, engineering managers, operations leads, and founders who evaluate vendor proposals.

---

## Architecture

### System Components

```
                 ┌─────────────┐
                 │   Browser    │
                 └──────┬──────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
    ┌──────▼──────┐     │     ┌──────▼──────┐
    │   Frontend  │     │     │     n8n      │
    │  React/Vite │     │     │  Automation  │
    │  :5173      │     │     │  :5678       │
    └──────┬──────┘     │     └──────┬──────┘
           │            │            │
           └────────────┼────────────┘
                        │
                 ┌──────▼──────┐
                 │   Backend   │
                 │   Go/Chi    │
                 │   :8080     │
                 └──────┬──────┘
                        │
                 ┌──────▼──────┐
                 │  PostgreSQL  │
                 │  pgvector    │
                 │  :5432       │
                 └─────────────┘
```

### Service Details

| Service    | Technology          | Port | Purpose                              |
|------------|---------------------|------|--------------------------------------|
| Frontend   | React 18 + Vite 5   | 5173 | SPA user interface                   |
| Backend    | Go 1.22 + Chi       | 8080 | REST API, analysis engine            |
| PostgreSQL | pgvector/pg16       | 5432 | Persistent storage                   |
| n8n        | n8n (latest)        | 5678 | Workflow automation (optional)       |

### Backend Architecture

The backend is a single-file Go application (`backend/cmd/server/main.go`, ~2100 lines) organized into these logical sections:

1. **Models** (lines ~30-150): Go structs for User, Evaluation, Vendor, RedFlag, Recommendation, ChatMessage
2. **Middleware & Helpers** (lines ~150-230): JWT auth middleware, JSON response helpers, user context extraction
3. **Database Init** (lines ~230-350): Connection setup, table creation, demo user seeding
4. **Auth Handlers** (lines ~350-465): Register, login, demo login
5. **Evaluation CRUD** (lines ~465-630): Create, list, get evaluations; upload vendor proposals
6. **Analysis Engine** (lines ~630-1300): The core -- handles the `/analyze` endpoint which orchestrates extraction, scoring, and recommendation
7. **Extraction Functions** (lines ~860-1180): Regex-based parsers for cost, timeline, uptime, response time, payment terms, support type, red flags, hidden costs, strengths, weaknesses
8. **Scoring Engine** (lines ~1183-1295): Weighted scoring across 5 dimensions (cost, timeline, quality, risk, SLA) producing 0-100 scores
9. **Recommendation Generator** (lines ~1295-1390): Sorts vendors by score, generates reasoning, negotiation tips, and risk analysis
10. **Comparison & Report** (lines ~1390-1785): Comparison matrix data, HTML report generation
11. **Chat Engine** (lines ~1786-2035): Keyword-based conversational responses about evaluation results
12. **Server Setup** (lines ~2036-2108): Health check, router configuration, server startup

### Analysis Engine Details

The analysis engine is entirely rule-based (no external AI API calls):

**Data Extraction** uses regex patterns to pull structured data from proposal text:
- **Cost**: Matches patterns like `INR X,XX,XXX`, `Total: $X`, `Year 1 Total: X`
- **Timeline**: Matches `X weeks`, `X months`, `timeline: X`
- **SLA Uptime**: Matches `99.X%`, `uptime: X%`
- **Response Time**: Matches `P1: X hour`, `Critical Response: X`
- **Red Flags**: Keyword matching for auto-renewal, liability limits, escalation clauses, data loss disclaimers, early termination fees
- **Hidden Costs**: Detects extra charges, additional fees, surcharges
- **Strengths/Weaknesses**: Pattern matching for positive/negative indicators

**Scoring** applies weighted formulas across 5 dimensions:
- **Cost Score**: Based on ratio to budget cap from requirements (under 70% = 100, scales down)
- **Timeline Score**: Shorter timelines score higher, bonus for delay penalties
- **Quality Score**: Based on team size, dedicated resources, certifications
- **Risk Score**: Starts at 100, deducted per red flag (critical: -25, high: -15, medium: -8, low: -4)
- **SLA Score**: Based on uptime percentage and response time

**Overall Score** = weighted average: Cost 25%, SLA 25%, Timeline 20%, Quality 15%, Risk 15%

### Frontend Architecture

**Framework:** React 18 with Vite 5 (no TypeScript, no CSS framework -- custom CSS design system)

**Routing** (react-router-dom v6):
| Route              | Component      | Auth Required | Description                     |
|--------------------|----------------|---------------|---------------------------------|
| `/login`           | LoginPage      | No            | Sign in, register, or demo      |
| `/`                | Dashboard      | Yes           | List all evaluations            |
| `/upload`          | UploadPage     | Yes           | 3-step wizard to create eval    |
| `/evaluation/:id`  | AnalysisPage   | Yes           | Results with tabbed navigation  |
| `*`                | NotFound       | No            | 404 page                        |

**State Management:**
- `AuthContext` (App.jsx): Provides `user`, `token`, `loginUser()`, `logout()` to all components. Token stored in localStorage as `vendoreval_token`.
- `ToastContext` (App.jsx): Global toast notifications with auto-dismiss.
- No external state library -- each page manages its own data fetching via `useEffect`.

**API Client** (`frontend/src/api/client.js`):
- Axios instance with `/api` base URL
- Request interceptor adds JWT Bearer token from localStorage
- Response interceptor redirects to `/login` on 401

**Client-Side File Processing** (`frontend/src/utils/extractText.js`):
- PDF text extraction via `pdfjs-dist`
- DOCX text extraction via `mammoth`
- Also supports plain text (.txt, .csv)
- Text is extracted in the browser, then sent to the backend as a string

### Database Schema

Six tables in PostgreSQL:

| Table             | Purpose                                          |
|-------------------|--------------------------------------------------|
| `users`           | User accounts (id, name, email, password, role)  |
| `evaluations`     | Evaluation sessions with status tracking         |
| `vendors`         | Vendor proposals with extracted data and scores   |
| `red_flags`       | Individual red flags per vendor                  |
| `recommendations` | AI recommendation per evaluation                 |
| `chat_messages`   | Chat history per evaluation                      |

**Evaluation status flow:** `pending` -> `extracting` -> `scoring` -> `completed` (or `failed`)

**Relationships:**
- `evaluations.user_id` -> `users.id`
- `vendors.evaluation_id` -> `evaluations.id`
- `red_flags.vendor_id` -> `vendors.id`
- `recommendations.evaluation_id` -> `evaluations.id`
- `recommendations.recommended_vendor_id` -> `vendors.id`
- `chat_messages.evaluation_id` -> `evaluations.id`

---

## API Reference

All endpoints return JSON. Authenticated endpoints require `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint               | Body                                          | Response                        |
|--------|------------------------|-----------------------------------------------|---------------------------------|
| POST   | `/api/auth/register`   | `{name, email, password, company}`            | `{user, token}`                 |
| POST   | `/api/auth/login`      | `{email, password}`                           | `{user, token}`                 |
| POST   | `/api/auth/demo`       | (none)                                        | `{user, token}`                 |

### Evaluations (all require auth)

| Method | Endpoint                               | Body / Params                              | Response                                |
|--------|----------------------------------------|--------------------------------------------|-----------------------------------------|
| POST   | `/api/evaluations`                     | `{title, requirements_text}`               | `{evaluation: {id, ...}}`              |
| GET    | `/api/evaluations`                     | --                                         | `{evaluations: [...]}`                 |
| GET    | `/api/evaluations/{id}`                | --                                         | `{evaluation: {...}, vendors: [...]}`  |
| POST   | `/api/evaluations/{id}/upload-vendor`  | `{vendor_name, content}`                   | `{vendor: {id, ...}}`                 |
| POST   | `/api/evaluations/{id}/analyze`        | --                                         | `{evaluation, vendors, recommendation}` |
| GET    | `/api/evaluations/{id}/vendors`        | --                                         | `{vendors: [...]}`                     |
| GET    | `/api/evaluations/{id}/comparison`     | --                                         | `{vendors: [...], matrix: {...}}`      |
| GET    | `/api/evaluations/{id}/recommendation` | --                                         | `{recommendation: {...}}`              |
| GET    | `/api/evaluations/{id}/report`         | --                                         | `{report_html: "..."}`                |
| POST   | `/api/evaluations/{id}/chat`           | `{message: "..."}`                         | `{content: "..."}`                     |

### Health Check

| Method | Endpoint   | Response                            |
|--------|------------|-------------------------------------|
| GET    | `/health`  | `{status: "ok", database: "ok"}`   |

---

## Configuration

### Environment Variables

| Variable         | Default                                              | Description                          |
|------------------|------------------------------------------------------|--------------------------------------|
| `DATABASE_URL`   | `postgres://vendor:vendor@postgres:5432/vendoreval`  | PostgreSQL connection string         |
| `JWT_SECRET`     | `vendor-secret`                                      | Secret for signing JWT tokens        |
| `PORT`           | `8080`                                               | Backend server port                  |
| `OPENAI_API_KEY` | (unused)                                             | Vestigial -- not used by the engine  |
| `FRONTEND_URL`   | `http://localhost:5173`                              | Frontend URL (for CORS)             |
| `MAX_PDF_SIZE_MB`| `20`                                                 | Max upload size (reference only)     |
| `MAX_VENDORS`    | `8`                                                  | Max vendors per evaluation           |

### Vite Proxy

The frontend Vite config (`frontend/vite.config.js`) proxies `/api` requests to the backend:
```
/api/* -> http://localhost:8080/api/*
```
This is configured via `VITE_API_URL` environment variable (defaults to `http://localhost:8080`).

---

## n8n Workflow Automation

An optional n8n workflow (`n8n/workflows/vendor_evaluation_workflow.json`) provides automation:

1. **Webhook trigger**: Receives evaluation ID and auth token
2. **Analyze**: Calls the backend `/analyze` endpoint
3. **Check critical flags**: Branches based on whether critical red flags were found
4. **Notification**: Sends alerts for critical findings (configurable)
5. **Report generation**: Triggers report export

Access n8n at http://localhost:5678 (credentials: admin / vendoreval123).

---

## Build & Deployment

### Docker Compose (recommended)

```bash
# Start all services
make up          # or: docker compose up -d --build

# Stop services
make down        # or: docker compose down

# Full reset (removes data volumes)
make clean       # or: docker compose down -v
```

### Backend (standalone)

```bash
cd backend
go build -o server ./cmd/server
DATABASE_URL="postgres://..." JWT_SECRET="..." ./server
```

### Frontend (standalone)

```bash
cd frontend
npm install
npm run dev      # dev server with HMR at :5173
npm run build    # production build to dist/
```

### Smoke Test

```bash
make test        # Creates demo token, evaluation, uploads vendor, verifies flow
make health      # Checks backend health endpoint
```
