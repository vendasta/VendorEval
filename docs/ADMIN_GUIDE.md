# VendorEval AI -- Admin Guide

## Prerequisites

- Docker and Docker Compose
- Git
- (Optional) Go 1.22+ and Node.js 20+ for standalone development

---

## Deployment

### Quick Start

```bash
git clone <repository-url>
cd VendorEval

# Copy and configure environment
cp .env.example .env
# Edit .env -- set JWT_SECRET to a strong random value for production

# Start all services
make up
```

This builds and starts 4 containers:
- `vendoreval_postgres` -- PostgreSQL 16 with pgvector extension
- `vendoreval_backend` -- Go API server
- `vendoreval_frontend` -- Vite React dev server
- `vendoreval_n8n` -- n8n workflow engine

### Verify Deployment

```bash
# Check backend health
make health
# Expected: {"status":"ok","database":"ok","timestamp":"..."}

# Run smoke test (creates evaluation end-to-end)
make test
```

### Service URLs

| Service   | URL                     | Credentials                |
|-----------|-------------------------|----------------------------|
| Frontend  | http://localhost:5173   | Register or use demo login |
| Backend   | http://localhost:8080   | API only (JWT auth)        |
| PostgreSQL| localhost:5432          | vendor / vendor            |
| n8n       | http://localhost:5678   | admin / vendoreval123      |

---

## Configuration

### Environment Variables

Create a `.env` file in the project root. Docker Compose reads this automatically.

```env
# Required for production -- change from defaults
JWT_SECRET=your-strong-random-secret-here

# Database (defaults work with the included postgres container)
DATABASE_URL=postgres://vendor:vendor@postgres:5432/vendoreval?sslmode=disable

# Backend
PORT=8080

# Reference values (used in documentation, not enforced by backend)
MAX_PDF_SIZE_MB=20
MAX_VENDORS=8
```

**Important:** The `OPENAI_API_KEY` in `.env.example` is vestigial. The analysis engine is entirely rule-based and makes no external API calls.

### Changing Ports

To change service ports, edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8080:8080"    # Change left side for host port
  frontend:
    ports:
      - "5173:5173"    # Change left side for host port
  postgres:
    ports:
      - "5432:5432"    # Change left side for host port
```

If you change the backend port, also update the Vite proxy target in `frontend/vite.config.js` or set `VITE_API_URL`.

---

## Database Management

### Schema

The schema is defined in `data/seed.sql` and also created programmatically by the backend on startup (`createTables()` function). Tables:

- `users` -- User accounts
- `evaluations` -- Evaluation sessions with status tracking
- `vendors` -- Vendor proposals with extracted data, scores, strengths, weaknesses, red flags
- `red_flags` -- Individual red flags per vendor
- `recommendations` -- AI recommendation per evaluation
- `chat_messages` -- Chat history per evaluation

### Default Users

Two demo users are seeded on startup:

| Name                      | Email                  | Role  | Password |
|---------------------------|------------------------|-------|----------|
| Demo Procurement Manager  | demo@vendoreval.ai     | demo  | password |
| Admin                     | admin@vendoreval.ai    | admin | password |

(Both use the bcrypt hash for "password")

### Connecting to the Database

```bash
# Via Docker
docker exec -it vendoreval_postgres psql -U vendor -d vendoreval

# Direct (if port is exposed)
psql postgres://vendor:vendor@localhost:5432/vendoreval
```

### Useful Queries

```sql
-- Count evaluations by status
SELECT status, COUNT(*) FROM evaluations GROUP BY status;

-- List all users
SELECT id, name, email, role, created_at FROM users;

-- Find evaluations with critical red flags
SELECT e.id, e.title, COUNT(rf.id) as critical_flags
FROM evaluations e
JOIN vendors v ON v.evaluation_id = e.id
JOIN red_flags rf ON rf.vendor_id = v.id
WHERE rf.severity = 'critical'
GROUP BY e.id, e.title;

-- Check vendor scores for a specific evaluation
SELECT name, overall_score, cost_score, timeline_score, quality_score, risk_score, sla_score
FROM vendors WHERE evaluation_id = '<eval-uuid>';
```

### Backup and Restore

```bash
# Backup
docker exec vendoreval_postgres pg_dump -U vendor vendoreval > backup.sql

# Restore
docker exec -i vendoreval_postgres psql -U vendor vendoreval < backup.sql
```

### Reset Database

```bash
# Remove all data (including volumes)
make clean

# Restart with fresh database
make up
```

---

## n8n Workflow Automation

The included n8n instance provides optional workflow automation for vendor evaluations.

### Importing the Workflow

1. Open http://localhost:5678
2. Log in with admin / vendoreval123
3. Go to Workflows > Import from File
4. Select `n8n/workflows/vendor_evaluation_workflow.json`

### Workflow Overview

The workflow automates the evaluation pipeline:

1. **Webhook trigger** (`POST /webhook/vendor-eval`) -- Receives `{evaluation_id, token}`
2. **Analyze** -- Calls `POST /api/evaluations/{id}/analyze` on the backend
3. **Check for critical red flags** -- Conditional branch
4. **Notification** -- Sends alerts when critical flags are found (configure notification node for email/Slack)
5. **Generate report** -- Triggers report generation

### Triggering the Workflow

```bash
curl -X POST http://localhost:5678/webhook/vendor-eval \
  -H "Content-Type: application/json" \
  -d '{"evaluation_id": "<uuid>", "token": "<jwt-token>"}'
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
# Response: {"status":"ok","database":"ok","timestamp":"2026-04-09T10:00:00Z"}
```

The health endpoint verifies both the server and database connection. Use this for load balancer health checks or monitoring.

### Container Logs

```bash
# All services
make logs

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Container Status

```bash
docker compose ps
```

---

## Troubleshooting

### Backend won't start

**"connection refused" to postgres:**
The backend depends on Postgres being healthy (healthcheck configured). If Postgres is slow to start, the backend container will restart automatically (`restart: on-failure`). Check Postgres logs:
```bash
docker compose logs postgres
```

**Port already in use:**
```bash
# Find what's using the port
lsof -i :8080
# Change the port in docker-compose.yml
```

### Frontend proxy errors

If the frontend shows network errors when calling the API:
1. Verify the backend is running: `make health`
2. Check that Vite proxy is configured correctly in `frontend/vite.config.js`
3. Inside Docker, the proxy target should be `http://backend:8080` (service name). Outside Docker, use `http://localhost:8080`.

### Database connection issues

```bash
# Verify Postgres is running
docker compose ps postgres

# Test connection
docker exec vendoreval_postgres pg_isready -U vendor

# Check if tables exist
docker exec vendoreval_postgres psql -U vendor -d vendoreval -c "\dt"
```

### Rebuilding from scratch

```bash
# Stop everything, remove volumes, rebuild
make clean
make up
```

---

## Production Considerations

The default configuration is for development. For production deployment:

1. **JWT_SECRET**: Set to a strong, unique random value (not the default `vendor-secret`)
2. **Database credentials**: Change from the default `vendor/vendor`
3. **HTTPS**: Put a reverse proxy (nginx, Caddy) in front with TLS
4. **Frontend build**: Replace the Vite dev server with a production build served by nginx:
   ```bash
   cd frontend && npm run build
   # Serve dist/ with nginx or similar
   ```
5. **Database backups**: Set up automated pg_dump on a schedule
6. **Persistent volumes**: The Docker Compose file already defines named volumes (`pg_data`, `n8n_data`) for data persistence
