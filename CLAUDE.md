# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VendorEval AI is a vendor proposal evaluation platform. Procurement managers upload vendor proposals (as text/PDF), define requirements, and the system extracts data, scores vendors, flags risks, generates comparisons, and recommends a winner. Built for the BE10X AI Hackathon.

## Build & Run

Everything runs via Docker Compose (4 services: postgres, backend, frontend, n8n):

```bash
make up          # docker compose up -d --build (starts all services)
make down        # stop services
make clean       # stop services + remove volumes + delete submission/
make logs        # tail all container logs
make health      # curl backend health endpoint
make test        # end-to-end smoke test: creates demo token, evaluation, uploads vendor
make demo        # get a demo auth token
```

Services after `make up`:
- **Frontend**: http://localhost:5173 (Vite dev server, proxies `/api` to backend)
- **Backend**: http://localhost:8080
- **PostgreSQL**: localhost:5432 (pgvector/pg16, db=vendoreval, user=vendor, pw=vendor)
- **n8n**: http://localhost:5678 (admin/vendoreval123)

## Architecture

### Backend (Go, single-file monolith)

`backend/cmd/server/main.go` (~2100 lines) contains the entire backend: models, middleware, handlers, extraction engine, scoring, recommendation, chat, and report generation. Uses chi router, lib/pq for Postgres, golang-jwt for auth, bcrypt for passwords.

**No external AI API is used.** The analysis engine is rule-based: regex extraction for costs/timelines/SLAs, keyword matching for red flags and hidden costs, weighted scoring formulas. All analysis logic is in `extract*`, `score*`, and `generate*` functions.

Key API routes (all under JWT auth except health/auth):
- `POST /api/auth/{register,login,demo}` — auth endpoints
- `POST /api/evaluations` — create evaluation session
- `POST /api/evaluations/{id}/upload-vendor` — submit vendor proposal text
- `POST /api/evaluations/{id}/analyze` — run extraction + scoring + recommendation
- `GET /api/evaluations/{id}/comparison` — side-by-side vendor matrix
- `GET /api/evaluations/{id}/recommendation` — AI recommendation
- `GET /api/evaluations/{id}/report` — full HTML report
- `POST /api/evaluations/{id}/chat` — chat about the evaluation results

The database schema is in `data/seed.sql` (tables: users, evaluations, vendors, red_flags, recommendations, chat_messages). Tables are also created programmatically in `createTables()` at startup.

### Frontend (React 18 + Vite)

SPA with react-router-dom. Auth state stored in localStorage (`vendoreval_token`, `vendoreval_user`). API client in `frontend/src/api/client.js` (axios with JWT interceptor). PDF/DOCX text extraction happens client-side via pdfjs-dist and mammoth.

Routes: `/login`, `/` (Dashboard), `/upload`, `/evaluation/:id` (AnalysisPage).

App.jsx provides AuthContext, ToastContext, and ErrorBoundary at the root.

### Supporting directories

- `data/sample_proposals/` — demo vendor proposal text files and requirements
- `scripts/` — demo recording, screenshot capture, voiceover generation (puppeteer-based)
- `n8n/workflows/` — n8n automation workflow JSON
- `submission/` and `final_submission/` — hackathon submission artifacts (docs, bundled code)

## Environment

Copy `.env.example` to `.env`. The `OPENAI_API_KEY` in the example is vestigial — the backend uses a built-in rule-based engine, not an external API. `JWT_SECRET` and `DATABASE_URL` are the only required config (both have defaults in docker-compose.yml).

## Development Notes

- The backend is a single Go file. To rebuild after changes: `make build` or `make up`.
- The frontend runs Vite in dev mode inside Docker with hot reload.
- The root `package.json` only has puppeteer (used by scripts/, not the app).
- Vite proxies `/api` requests to the backend at `http://localhost:8080`.
