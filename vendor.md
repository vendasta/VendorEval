# CLAUDE.md — Vendor Proposal Evaluator AI Agent
## BE10X AI Hackathon · Deadline: 31st March 2026, 11:59 PM
### Tagline: Upload. Analyze. Decide. In 10 Minutes.

---

## ONE-COMMAND BUILD INSTRUCTION

Read this entire file first. Then execute ALL steps in sequence without stopping,
without asking questions, and without pausing. Fix all errors automatically.

```bash
claude --dangerously-skip-permissions "Read CLAUDE.md and build the complete Vendor Proposal Evaluator AI Agent end-to-end"
```

---

## PRODUCT OVERVIEW

**What it does:**
A procurement manager uploads 2–8 vendor proposal PDFs + a requirements document
→ AI reads every page of every proposal
→ Extracts: pricing, timelines, SLA terms, red flag clauses, hidden costs, payment terms
→ Scores each vendor against the requirements (0–100)
→ Generates a side-by-side comparison matrix
→ Highlights risky contract language with severity tags
→ Recommends the best vendor with specific reasoning
→ Exports a professional PDF/HTML report in 10 minutes

**Who it's for:**
Procurement managers, EMs, operations heads, startup founders — anyone who evaluates
vendors at a company and currently does it manually in Excel over 2–3 weeks.

---

## PROJECT STRUCTURE

```
vendor-evaluator/
├── CLAUDE.md
├── docker-compose.yml
├── .env.example
├── .env
├── Makefile
│
├── backend/
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   └── cmd/server/main.go        ← entire backend in one file
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/client.js
│       └── components/
│           ├── LoginPage.jsx
│           ├── Dashboard.jsx
│           ├── UploadPage.jsx
│           ├── AnalysisPage.jsx
│           ├── ComparisonMatrix.jsx
│           ├── RedFlagPanel.jsx
│           ├── RecommendationPanel.jsx
│           ├── ReportExport.jsx
│           └── ChatInterface.jsx
│
├── data/
│   ├── seed.sql
│   └── sample_proposals/         ← demo PDF files for hackathon demo
│       ├── vendor_a_proposal.txt  ← text file simulating PDF content
│       ├── vendor_b_proposal.txt
│       └── requirements.txt
│
├── scripts/
│   ├── generate_voiceover.js
│   ├── take_screenshots.js
│   ├── generate_summary.js
│   └── prepare_submission.sh
│
└── n8n/workflows/
    └── vendor_evaluation_workflow.json
```

---

## STEP 1 — ENVIRONMENT FILES

### File: `.env.example`
```env
OPENAI_API_KEY=sk-your-openai-key-here
DATABASE_URL=postgres://vendor:vendor@localhost:5432/vendoreval?sslmode=disable
JWT_SECRET=vendor-evaluator-secret-2026
PORT=8080
FRONTEND_URL=http://localhost:5173
MAX_PDF_SIZE_MB=20
MAX_VENDORS=8
```

### File: `.env`
Copy from `.env.example` automatically.

---

## STEP 2 — DATABASE SCHEMA

### File: `data/seed.sql`

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    company    VARCHAR(100),
    role       VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Evaluation sessions
CREATE TABLE IF NOT EXISTS evaluations (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          INT REFERENCES users(id),
    title            VARCHAR(255) NOT NULL,
    status           VARCHAR(30) DEFAULT 'pending',
    -- pending | extracting | scoring | completed | failed
    requirements_text TEXT,
    requirements_file VARCHAR(255),
    vendor_count     INT DEFAULT 0,
    winner_vendor_id UUID,
    created_at       TIMESTAMP DEFAULT NOW(),
    completed_at     TIMESTAMP
);

-- Individual vendor proposals
CREATE TABLE IF NOT EXISTS vendors (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id     UUID REFERENCES evaluations(id),
    name              VARCHAR(255) NOT NULL,
    file_name         VARCHAR(255),
    raw_text          TEXT,
    -- Extracted fields
    total_cost        DECIMAL(15,2),
    currency          VARCHAR(10) DEFAULT 'INR',
    timeline_weeks    INT,
    payment_terms     TEXT,
    sla_uptime        VARCHAR(50),
    sla_response_time VARCHAR(50),
    warranty_months   INT,
    support_type      VARCHAR(100),
    -- Scores (0-100)
    overall_score     DECIMAL(5,2),
    cost_score        DECIMAL(5,2),
    timeline_score    DECIMAL(5,2),
    quality_score     DECIMAL(5,2),
    risk_score        DECIMAL(5,2),
    sla_score         DECIMAL(5,2),
    -- AI outputs
    summary           TEXT,
    strengths         JSONB,
    weaknesses        JSONB,
    red_flags         JSONB,
    hidden_costs      JSONB,
    extracted_data    JSONB,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Red flags per vendor
CREATE TABLE IF NOT EXISTS red_flags (
    id            SERIAL PRIMARY KEY,
    vendor_id     UUID REFERENCES vendors(id),
    severity      VARCHAR(20), -- critical | high | medium | low
    category      VARCHAR(50), -- pricing | legal | timeline | sla | compliance
    description   TEXT,
    clause_text   TEXT,
    page_reference VARCHAR(50)
);

-- AI recommendation per evaluation
CREATE TABLE IF NOT EXISTS recommendations (
    id                SERIAL PRIMARY KEY,
    evaluation_id     UUID REFERENCES evaluations(id),
    recommended_vendor_id UUID REFERENCES vendors(id),
    reasoning         TEXT,
    confidence_score  DECIMAL(5,2),
    alternatives      JSONB,
    risks             JSONB,
    negotiation_tips  JSONB,
    created_at        TIMESTAMP DEFAULT NOW()
);

-- Chat history per evaluation
CREATE TABLE IF NOT EXISTS chat_messages (
    id            SERIAL PRIMARY KEY,
    evaluation_id UUID REFERENCES evaluations(id),
    role          VARCHAR(20), -- user | assistant
    content       TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Demo users
INSERT INTO users (name, email, password, company, role) VALUES
  ('Demo Procurement Manager', 'demo@vendoreval.ai',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'Acme Corp', 'demo'),
  ('Admin', 'admin@vendoreval.ai',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'VendorEval', 'admin')
ON CONFLICT (email) DO NOTHING;
```

### File: `data/sample_proposals/vendor_a_proposal.txt`
```
VENDOR PROPOSAL — TechSolutions India Pvt Ltd
Project: Cloud Infrastructure Setup & Support
Date: March 2026

EXECUTIVE SUMMARY
TechSolutions India proposes to deliver complete cloud infrastructure migration
and 24x7 support services for Acme Corp.

PRICING
- One-time Setup Fee: INR 8,50,000
- Monthly Managed Services: INR 1,20,000/month
- Annual Contract Value: INR 22,90,000
- Payment Terms: 40% advance, 30% at midpoint, 30% on completion
- Price Lock: 18 months, after which 15% annual escalation clause applies

TIMELINE
- Project Kickoff: Week 1
- Infrastructure Setup: Weeks 1-6
- Testing & UAT: Weeks 7-9
- Go-Live: Week 10
- NOTE: Timeline subject to change based on client responsiveness

SLA COMMITMENTS
- Uptime Guarantee: 99.5%
- Critical Issue Response: 4 hours
- Standard Issue Response: 48 hours
- Penalty for SLA breach: 2% credit per month, capped at 10% of monthly fee

SUPPORT
- Business hours support: 9AM-6PM IST Monday to Friday
- Weekend support: Additional charges apply (not specified in this proposal)

TEAM
- 1 Project Manager
- 2 Senior Cloud Engineers
- 1 DevOps Engineer (shared resource)

TERMS & CONDITIONS
- All disputes subject to arbitration in Bangalore
- Client responsible for all third-party software licenses
- TechSolutions not liable for data loss during migration
- Contract auto-renews unless 90-day notice given
- Early termination fee: 6 months of monthly charges
```

### File: `data/sample_proposals/vendor_b_proposal.txt`
```
VENDOR PROPOSAL — CloudForce Systems
Project: Cloud Infrastructure and DevOps Services
Date: March 2026

OVERVIEW
CloudForce Systems offers enterprise-grade cloud infrastructure services
with guaranteed delivery and transparent pricing.

PRICING
- Setup & Migration: INR 6,80,000
- Monthly Support Retainer: INR 95,000/month
- Year 1 Total: INR 18,20,000
- Payment Terms: 25% advance, balance monthly
- No hidden escalation clauses — fixed pricing for 24 months
- All third-party licenses included in the quote

TIMELINE
- Week 1-2: Discovery and planning
- Week 3-7: Infrastructure build
- Week 8-9: Testing
- Week 10: Go-live
- Timeline guarantee: penalty of INR 50,000 per week delay

SLA
- Uptime: 99.9%
- P1 Response: 1 hour, Resolution: 4 hours
- P2 Response: 2 hours, Resolution: 24 hours
- SLA penalty: 5% credit, no cap

SUPPORT
- 24x7 support included
- Dedicated Slack channel for client
- Monthly review calls

TEAM
- Dedicated Project Manager
- 3 Cloud Engineers (dedicated, not shared)
- 1 Security Specialist

TERMS
- 30-day notice for termination after year 1
- No early termination fee in first 6 months
- Data migration fully covered under contract
- Liability cap: 3x annual contract value
```

### File: `data/sample_proposals/requirements.txt`
```
REQUIREMENTS DOCUMENT — Cloud Infrastructure Vendor Selection
Company: Acme Corp
Date: March 2026

MUST-HAVE REQUIREMENTS (weighted 60%)
1. 24x7 support coverage
2. 99.9% or higher uptime SLA
3. P1 incident response within 2 hours
4. Fixed pricing for minimum 18 months
5. Dedicated (not shared) resources
6. Data migration fully covered
7. No auto-renewal traps

IMPORTANT REQUIREMENTS (weighted 30%)
1. Timeline of 10-12 weeks maximum
2. Total Year 1 cost under INR 20,00,000
3. Monthly payment flexibility
4. Security specialist on team
5. Penalty clauses for delays

NICE-TO-HAVE (weighted 10%)
1. Weekend support included
2. Slack or real-time communication channel
3. All third-party licenses included
4. References from similar-sized companies

EVALUATION CRITERIA
- Cost competitiveness: 25%
- SLA and reliability: 25%
- Timeline and delivery: 20%
- Team quality and resources: 15%
- Contract terms and risk: 15%
```

---

## STEP 3 — BACKEND (Golang)

### File: `backend/go.mod`
```
module github.com/vendoreval/backend

go 1.22

require (
    github.com/go-chi/chi/v5 v5.0.12
    github.com/go-chi/cors v1.2.1
    github.com/golang-jwt/jwt/v5 v5.2.1
    github.com/google/uuid v1.6.0
    github.com/lib/pq v1.10.9
    github.com/sashabaranov/go-openai v1.24.0
    golang.org/x/crypto v0.22.0
)
```

### File: `backend/cmd/server/main.go`

Build the complete backend with ALL of the following:

#### Models:
```go
type User struct {
    ID      int    `json:"id"`
    Name    string `json:"name"`
    Email   string `json:"email"`
    Company string `json:"company"`
    Role    string `json:"role"`
}

type Evaluation struct {
    ID               string    `json:"id"`
    UserID           int       `json:"user_id"`
    Title            string    `json:"title"`
    Status           string    `json:"status"`
    RequirementsText string    `json:"requirements_text"`
    VendorCount      int       `json:"vendor_count"`
    WinnerVendorID   *string   `json:"winner_vendor_id"`
    CreatedAt        time.Time `json:"created_at"`
    CompletedAt      *time.Time `json:"completed_at"`
}

type Vendor struct {
    ID             string   `json:"id"`
    EvaluationID   string   `json:"evaluation_id"`
    Name           string   `json:"name"`
    FileName       string   `json:"file_name"`
    TotalCost      float64  `json:"total_cost"`
    Currency       string   `json:"currency"`
    TimelineWeeks  int      `json:"timeline_weeks"`
    PaymentTerms   string   `json:"payment_terms"`
    SLAUptime      string   `json:"sla_uptime"`
    SLAResponse    string   `json:"sla_response_time"`
    OverallScore   float64  `json:"overall_score"`
    CostScore      float64  `json:"cost_score"`
    TimelineScore  float64  `json:"timeline_score"`
    QualityScore   float64  `json:"quality_score"`
    RiskScore      float64  `json:"risk_score"`
    SLAScore       float64  `json:"sla_score"`
    Summary        string   `json:"summary"`
    Strengths      []string `json:"strengths"`
    Weaknesses     []string `json:"weaknesses"`
    RedFlags       []RedFlag `json:"red_flags"`
    HiddenCosts    []string `json:"hidden_costs"`
}

type RedFlag struct {
    Severity    string `json:"severity"` // critical|high|medium|low
    Category    string `json:"category"`
    Description string `json:"description"`
    ClauseText  string `json:"clause_text"`
}

type Recommendation struct {
    EvaluationID        string   `json:"evaluation_id"`
    RecommendedVendor   *Vendor  `json:"recommended_vendor"`
    Reasoning           string   `json:"reasoning"`
    ConfidenceScore     float64  `json:"confidence_score"`
    NegotiationTips     []string `json:"negotiation_tips"`
    Risks               []string `json:"risks"`
}

type UploadRequest struct {
    Title            string `json:"title"`
    RequirementsText string `json:"requirements_text"`
}

type ChatRequest struct {
    EvaluationID string `json:"evaluation_id"`
    Message      string `json:"message"`
}

type ExtractionResult struct {
    VendorName     string    `json:"vendor_name"`
    TotalCost      float64   `json:"total_cost"`
    Currency       string    `json:"currency"`
    TimelineWeeks  int       `json:"timeline_weeks"`
    PaymentTerms   string    `json:"payment_terms"`
    SLAUptime      string    `json:"sla_uptime"`
    SLAResponse    string    `json:"sla_response_time"`
    WarrantyMonths int       `json:"warranty_months"`
    SupportType    string    `json:"support_type"`
    Strengths      []string  `json:"strengths"`
    Weaknesses     []string  `json:"weaknesses"`
    HiddenCosts    []string  `json:"hidden_costs"`
    RedFlags       []RedFlag `json:"red_flags"`
    Summary        string    `json:"summary"`
}

type ScoringResult struct {
    OverallScore  float64 `json:"overall_score"`
    CostScore     float64 `json:"cost_score"`
    TimelineScore float64 `json:"timeline_score"`
    QualityScore  float64 `json:"quality_score"`
    RiskScore     float64 `json:"risk_score"`
    SLAScore      float64 `json:"sla_score"`
}
```

#### Routes:
```
Public:
POST /api/auth/register
POST /api/auth/login
POST /api/auth/demo      ← instant demo login
GET  /health

Protected (JWT):
POST /api/evaluations                    ← create evaluation session
GET  /api/evaluations                    ← list user's evaluations
GET  /api/evaluations/:id                ← get full evaluation with vendors
POST /api/evaluations/:id/upload-vendor  ← upload vendor proposal text/PDF
POST /api/evaluations/:id/analyze        ← trigger full AI analysis
GET  /api/evaluations/:id/comparison     ← comparison matrix data
GET  /api/evaluations/:id/recommendation ← AI recommendation
GET  /api/evaluations/:id/report         ← HTML report for export
POST /api/evaluations/:id/chat           ← chat about this evaluation
GET  /api/evaluations/:id/vendors        ← list all vendors in evaluation
```

#### Key handler implementations:

**POST /api/evaluations/:id/upload-vendor**
- Accept multipart form with: vendor_name (string) + content (text body or file)
- If file uploaded: read file content as text (handle .txt and basic text extraction)
- Store raw text in vendors table
- Return vendor_id
- Support up to 8 vendors per evaluation

**POST /api/evaluations/:id/analyze**
- Get evaluation + all uploaded vendors + requirements text
- For each vendor, call `extractVendorData()` — see AI prompt below
- For each vendor, call `scoreVendor()` — see scoring prompt below
- Call `generateRecommendation()` with all vendor scores
- Update evaluation status to "completed"
- Return full analysis results

**extractVendorData(vendorText, requirementsText) → ExtractionResult**
```
Call OpenAI GPT-4o with this prompt:

"You are a procurement expert and contract analyst.

Extract the following information from this vendor proposal:

VENDOR PROPOSAL:
{vendor_text}

REQUIREMENTS:
{requirements_text}

Return ONLY valid JSON (no markdown):
{
  "vendor_name": "company name from proposal",
  "total_cost": 850000,
  "currency": "INR",
  "timeline_weeks": 10,
  "payment_terms": "40% advance, 30% midpoint, 30% completion",
  "sla_uptime": "99.5%",
  "sla_response_time": "4 hours for critical",
  "warranty_months": 12,
  "support_type": "Business hours only, 9AM-6PM",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "hidden_costs": ["Weekend support charged extra", "15% annual escalation after 18 months"],
  "red_flags": [
    {
      "severity": "critical",
      "category": "legal",
      "description": "No liability for data loss during migration",
      "clause_text": "TechSolutions not liable for data loss during migration"
    },
    {
      "severity": "high",
      "category": "pricing",
      "description": "Auto-renewal trap with 90-day notice required",
      "clause_text": "Contract auto-renews unless 90-day notice given"
    }
  ],
  "summary": "2-3 sentence plain English summary of this vendor"
}"
```

**scoreVendor(vendor ExtractionResult, requirements string) → ScoringResult**
```
Call GPT-4o-mini with this prompt:

"You are a procurement scoring expert.

Score this vendor proposal against the requirements. Each score is 0-100.

VENDOR DATA: {vendor_json}
REQUIREMENTS: {requirements_text}

Scoring rules:
- cost_score: 100 if cheapest, proportionally lower for more expensive
- timeline_score: 100 if meets/beats requirement, lower for delays
- quality_score: based on team size, dedications, experience signals
- risk_score: 100 = no risk, lower for each red flag (critical = -25, high = -15, medium = -8)
- sla_score: 100 if meets all SLA requirements, lower for gaps

Return ONLY valid JSON:
{
  'overall_score': 76.5,
  'cost_score': 82,
  'timeline_score': 90,
  'quality_score': 75,
  'risk_score': 55,
  'sla_score': 70
}"
```

**generateRecommendation(vendors []Vendor, requirements string) → Recommendation**
```
Call GPT-4o with this prompt:

"You are a senior procurement director making a final vendor recommendation.

EVALUATED VENDORS:
{vendors_json_with_scores}

REQUIREMENTS:
{requirements_text}

Analyze all vendors and provide your recommendation.

Return ONLY valid JSON:
{
  'recommended_vendor_name': 'CloudForce Systems',
  'confidence_score': 87,
  'reasoning': '3-4 sentence explanation of why this vendor wins',
  'negotiation_tips': [
    'Push for 99.9% uptime guarantee in writing',
    'Request dedicated PM at no extra cost',
    'Negotiate payment to 20% advance'
  ],
  'risks': [
    'Verify team availability before signing',
    'Get SLA penalties in writing'
  ],
  'runner_up': 'TechSolutions India',
  'runner_up_reason': 'Would consider if CloudForce raises price significantly'
}"
```

**GET /api/evaluations/:id/report**
- Generate complete HTML report
- Include: evaluation summary, comparison table, red flags per vendor, scores, recommendation, negotiation tips
- Return as HTML string for browser rendering and print-to-PDF

**POST /api/evaluations/:id/chat**
```
System prompt:
"You are a procurement advisor helping evaluate vendor proposals.

Evaluation context:
Title: {title}
Requirements: {requirements_text}

Vendor scores:
{vendors_summary}

Recommendation: {recommended_vendor} ({confidence}% confidence)
Reasoning: {reasoning}

Answer questions about this evaluation concisely and specifically.
Use the actual data from the proposals. Under 150 words per response."
```

---

## STEP 4 — FRONTEND (React)

### File: `frontend/package.json`
```json
{
  "name": "vendor-evaluator-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "recharts": "^2.12.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.0"
  }
}
```

### File: `frontend/src/components/LoginPage.jsx`

Build login page with:
- Left panel (60%): dark navy background (#0f1b2d)
  - Large document/checklist icon
  - "VendorEval AI" title in white
  - Tagline: "Upload. Analyze. Decide. In 10 Minutes."
  - 3 feature bullets:
    - "Read 8 vendor proposals simultaneously"
    - "Extract pricing, SLAs, and red flags automatically"
    - "AI recommends the best vendor with reasoning"
- Right panel (40%): white
  - Sign In / Register tabs
  - "Try Demo — No signup needed" button (navy background, white text, full width, prominent)
  - Small text: "Loads a real cloud vendor evaluation instantly"

### File: `frontend/src/components/Dashboard.jsx`

Main dashboard after login:
- Header: VendorEval AI logo, user name, logout
- If demo user: yellow "DEMO MODE" banner
- "New Evaluation" button (primary CTA)
- List of past evaluations (cards): title, vendor count, status badge, date, "View Results" button
- Empty state when no evaluations: illustration + "Start your first vendor evaluation"
- Each evaluation card shows: colored status badge (pending=gray, analyzing=blue, completed=green)

### File: `frontend/src/components/UploadPage.jsx`

3-step upload wizard:

**Step 1 — Evaluation setup:**
- Input: Evaluation title (e.g. "Cloud Infrastructure Vendor Selection Q2 2026")
- Large textarea: Paste requirements document text
- OR: Upload requirements as .txt file
- "Continue" button

**Step 2 — Upload vendor proposals:**
- Title: "Upload Vendor Proposals (2–8 vendors)"
- For each vendor: Vendor name input + large textarea for proposal text
- "Add Another Vendor" button (up to 8)
- Remove vendor button per row
- Progress indicator: "3 vendors added"
- "Load Demo Data" button — pre-fills with vendor_a and vendor_b sample data

**Step 3 — Analyze:**
- Summary: "You're evaluating 3 vendors against your requirements"
- List vendor names with checkmarks
- "Start AI Analysis" button (large, prominent)
- Analysis progress: animated steps showing "Extracting data from Vendor A... Scoring... Generating recommendation..."

### File: `frontend/src/components/AnalysisPage.jsx`

Main results page with 4 tabs:

**Tab 1 — Overview:**
- Winner banner at top: green card showing recommended vendor + confidence score + 1-line reason
- Score cards for each vendor (side by side): overall score as large number, color-coded
- Radar/spider chart comparing all vendors across 5 dimensions (recharts RadarChart)

**Tab 2 — Comparison Matrix:**
See ComparisonMatrix.jsx

**Tab 3 — Red Flags:**
See RedFlagPanel.jsx

**Tab 4 — AI Chat:**
See ChatInterface.jsx

**Export button:** "Download Report" → opens ReportExport

### File: `frontend/src/components/ComparisonMatrix.jsx`

Side-by-side comparison table:
- Rows: Total Cost, Timeline, Payment Terms, SLA Uptime, P1 Response Time, Support Hours,
  Team Size, Dedicated Resources, Overall Score, Red Flags Count
- Columns: one per vendor
- Color coding: green = best in category, amber = acceptable, red = below requirement
- Score bars below each vendor name (recharts BarChart)
- "Winner" badge on recommended vendor column header

### File: `frontend/src/components/RedFlagPanel.jsx`

Red flags display:
- Filter by severity: All | Critical | High | Medium | Low
- Filter by vendor: All | Vendor A | Vendor B...
- Each red flag card:
  - Severity badge (red=critical, orange=high, amber=medium, blue=low)
  - Category tag (pricing, legal, timeline, sla, compliance)
  - Description text
  - Clause text in monospace block (the exact problematic language)
  - Vendor name
- Summary stats at top: "X critical flags across Y vendors"

### File: `frontend/src/components/RecommendationPanel.jsx`

Recommendation display:
- Large winner card: vendor name, confidence score (%), overall score
- "Why we recommend this vendor" — reasoning paragraph
- Negotiation tips list (numbered, actionable)
- Risks to watch list
- Runner-up mention with brief reason
- "Proceed with this vendor" CTA button

### File: `frontend/src/components/ChatInterface.jsx`

AI chat about the evaluation:
- Initial message: "I've analyzed [N] vendor proposals. [Winner] scores highest at [score]/100. Ask me anything about this evaluation."
- Quick chips:
  - "Why did [Winner] win?"
  - "What are the biggest risks?"
  - "Compare pricing across vendors"
  - "What should I negotiate?"
  - "Show me all critical red flags"
- Text input + Send button
- POST /api/evaluations/:id/chat
- Streaming response display

### File: `frontend/src/components/ReportExport.jsx`

HTML report that renders as a printable page:
- Company header with evaluation title and date
- Executive summary
- Recommendation box (highlighted)
- Comparison table (all vendors, all metrics)
- Red flags section per vendor
- Scores breakdown
- Negotiation tips
- Footer: "Generated by VendorEval AI"
- Print button triggers browser print (saves as PDF)

---

## STEP 5 — DOCKER COMPOSE

### File: `docker-compose.yml`
```yaml
version: "3.9"

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: vendoreval_postgres
    environment:
      POSTGRES_DB: vendoreval
      POSTGRES_USER: vendor
      POSTGRES_PASSWORD: vendor
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./data/seed.sql:/docker-entrypoint-initdb.d/seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vendor"]
      interval: 5s
      retries: 10

  backend:
    build: ./backend
    container_name: vendoreval_backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://vendor:vendor@postgres:5432/vendoreval?sslmode=disable
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      JWT_SECRET: ${JWT_SECRET:-vendor-secret}
      PORT: 8080
    depends_on:
      postgres:
        condition: service_healthy
    restart: on-failure

  frontend:
    build: ./frontend
    container_name: vendoreval_frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  n8n:
    image: n8nio/n8n:latest
    container_name: vendoreval_n8n
    ports:
      - "5678:5678"
    environment:
      N8N_BASIC_AUTH_ACTIVE: "true"
      N8N_BASIC_AUTH_USER: admin
      N8N_BASIC_AUTH_PASSWORD: vendoreval123
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  pg_data:
  n8n_data:
```

---

## STEP 6 — N8N WORKFLOW

### File: `n8n/workflows/vendor_evaluation_workflow.json`
```json
{
  "name": "Vendor Evaluation Automation",
  "nodes": [
    {
      "name": "Webhook - New Evaluation",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "vendor-eval", "method": "POST" },
      "position": [240, 300]
    },
    {
      "name": "Extract All Vendor Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://backend:8080/api/evaluations/{{$json.evaluation_id}}/analyze",
        "method": "POST",
        "headers": { "Authorization": "Bearer {{$json.token}}" }
      },
      "position": [460, 300]
    },
    {
      "name": "Check for Critical Red Flags",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "number": [{ "value1": "={{$json.critical_flags}}", "operation": "largerEqual", "value2": 1 }]
        }
      },
      "position": [680, 300]
    },
    {
      "name": "Send Critical Flag Alert Email",
      "type": "n8n-nodes-base.gmail",
      "parameters": {
        "to": "{{$json.user_email}}",
        "subject": "⚠ Critical Issues Found in Vendor Proposals",
        "message": "VendorEval AI found {{$json.critical_flags}} critical red flags. Review before proceeding: http://localhost:5173/evaluation/{{$json.evaluation_id}}"
      },
      "position": [900, 200]
    },
    {
      "name": "Send Completion Notification",
      "type": "n8n-nodes-base.gmail",
      "parameters": {
        "to": "{{$json.user_email}}",
        "subject": "Vendor Evaluation Complete — {{$json.winner}} Recommended",
        "message": "Your evaluation is ready. Recommended vendor: {{$json.winner}} ({{$json.confidence}}% confidence). View full report: http://localhost:5173/evaluation/{{$json.evaluation_id}}"
      },
      "position": [900, 400]
    }
  ],
  "connections": {
    "Webhook - New Evaluation": { "main": [[{ "node": "Extract All Vendor Data" }]] },
    "Extract All Vendor Data": { "main": [[{ "node": "Check for Critical Red Flags" }]] },
    "Check for Critical Red Flags": {
      "main": [
        [{ "node": "Send Critical Flag Alert Email" }],
        [{ "node": "Send Completion Notification" }]
      ]
    }
  }
}
```

---

## STEP 7 — SUBMISSION SCRIPTS

### File: `scripts/generate_voiceover.js`
```js
import fs from 'fs'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SCRIPT = `
Welcome to VendorEval AI — the intelligent vendor proposal evaluator.
Upload. Analyze. Decide. In 10 minutes.

Here is the problem. A procurement manager receives 6 vendor proposals in PDF format.
They spend two to three weeks reading every page, building comparison spreadsheets,
and still make decisions based on gut feel. Wrong vendor selected. Project overruns.
Company loses money.

VendorEval AI solves this completely.

Watch what happens. We click Try Demo and instantly see a live cloud infrastructure
vendor evaluation — two vendors have already been analyzed.

The dashboard shows immediately: CloudForce Systems wins with a score of 84 out of 100
and 87 percent confidence. The AI has already done the work.

We click the Comparison Matrix tab. Every metric is side by side — pricing, SLA commitments,
timeline, payment terms, support hours. CloudForce is 18 lakh cheaper than TechSolutions
and includes 24 by 7 support with no extra charges.

Now the Red Flags tab. The AI found 3 critical issues in TechSolutions proposal —
no liability for data loss during migration, a 90-day auto-renewal trap, and
a 15 percent annual price escalation clause buried in the fine print.
These are exactly the clauses a busy procurement manager would miss at 11pm.

Finally, we ask the AI directly — what should I negotiate with CloudForce?
The AI responds with 3 specific negotiation points backed by the proposal data.

The entire analysis: 10 minutes. Not 3 weeks.
This saves 40 hours of manual work per evaluation, eliminates hidden cost surprises,
and reduces wrong vendor selection by giving every decision-maker the same data.

VendorEval AI. Built for the BE10X AI Hackathon 2026.
`

const mp3 = await client.audio.speech.create({ model: 'tts-1-hd', voice: 'onyx', input: SCRIPT, speed: 0.95 })
const buffer = Buffer.from(await mp3.arrayBuffer())
fs.mkdirSync('../submission', { recursive: true })
fs.writeFileSync('../submission/voiceover.mp3', buffer)
console.log('Voiceover saved to submission/voiceover.mp3')
```

### File: `scripts/take_screenshots.js`
```js
import puppeteer from 'puppeteer'
import fs from 'fs'

const DIR = '../submission/screenshots'
fs.mkdirSync(DIR, { recursive: true })

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

// 1. Login page
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' })
await page.screenshot({ path: `${DIR}/01-login-page.png` })

// 2. Demo login + dashboard
const res = await fetch('http://localhost:8080/api/auth/demo', { method: 'POST' })
const { token } = await res.json()
await page.evaluateOnNewDocument(t => localStorage.setItem('vendoreval_token', t), token)
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' })
await page.waitForTimeout(2000)
await page.screenshot({ path: `${DIR}/02-dashboard.png` })

// 3-7: Navigate to demo evaluation results
// (Screenshots of: comparison matrix, red flags, recommendation, chat, report)

await browser.close()
console.log('All screenshots saved')
```

### File: `scripts/prepare_submission.sh`
```bash
#!/bin/bash
mkdir -p submission/screenshots submission/code
cp -r backend frontend n8n data CLAUDE.md docker-compose.yml submission/code/
node scripts/generate_summary.js
echo "Submission folder ready. Record demo video next."
echo "Form URL: https://forms.gle/WC61fKj5vLybGJtC7"
```

---

## STEP 8 — VALIDATION CHECKS

After build, run these automatically:

```bash
# 1. Backend health
curl -s http://localhost:8080/health
# Expected: {"status":"ok"}

# 2. Demo login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/demo | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: $TOKEN"

# 3. Create evaluation
EVAL=$(curl -s -X POST http://localhost:8080/api/evaluations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Eval","requirements_text":"Need 99.9% uptime, 24x7 support, under 20L"}')
EVAL_ID=$(echo $EVAL | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# 4. Upload vendor
curl -s -X POST http://localhost:8080/api/evaluations/$EVAL_ID/upload-vendor \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vendor_name":"CloudForce","content":"Uptime 99.9%, Cost 18L, 24x7 support included"}'

# 5. Run analysis
curl -s -X POST http://localhost:8080/api/evaluations/$EVAL_ID/analyze \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Score:', d['vendors'][0]['overall_score'])"

# 6. Frontend loads
curl -s http://localhost:5173 | grep -c "VendorEval"
```

---

## STEP 9 — DEMO FLOW (Hackathon Video Script)

Follow this exact sequence for the 5-minute demo recording:

**0:00–0:30 — Problem statement (voice only)**
"A procurement manager gets 6 vendor proposals. Spends 3 weeks in spreadsheets.
Still misses the auto-renewal clause. VendorEval AI does this in 10 minutes."

**0:30–1:00 — Login page**
Show login page. Click "Try Demo". Load demo evaluation instantly.

**1:00–2:00 — Overview tab**
Show winner banner: CloudForce recommended, 84/100, 87% confidence.
Show radar chart comparing both vendors. Point out score gap.

**2:00–3:00 — Comparison Matrix**
Scroll through every metric. Highlight: CloudForce 18L cheaper, 24x7 included,
TechSolutions has extra weekend charges hidden.

**3:00–4:00 — Red Flags tab**
Show 3 critical red flags in TechSolutions. Read out the exact clause text.
"This is what VendorEval found that a human would miss at 11pm."

**4:00–4:30 — AI Chat**
Type: "What should I negotiate with CloudForce?"
Show AI response with 3 specific, data-backed tips.

**4:30–5:00 — Export Report + n8n workflow**
Click Download Report. Show the professional HTML report.
Switch to n8n. Show the webhook workflow. "When analysis completes, auto-emails
the manager with critical flag alerts."

---

## HACKATHON FORM ANSWERS

**Project name:** VendorEval AI — Intelligent Vendor Proposal Evaluator

**Problem:** Procurement managers and EMs receive 5–8 vendor proposals and spend 2–3 weeks manually comparing them in spreadsheets. They miss hidden costs, auto-renewal traps, and risky contract clauses buried in fine print. Wrong vendor selections cause project overruns, budget shocks, and operational failures.

**Who it's for:** Procurement managers, Engineering Managers, Operations heads, Startup founders — anyone evaluating vendors at a company of 20–500 people.

**How AI is used:** GPT-4o reads every vendor proposal and extracts structured data (pricing, SLA, timeline, payment terms, hidden costs) using structured JSON output. A second AI pass scores each vendor against the requirements document across 5 dimensions. A third pass generates a recommendation with reasoning, negotiation tips, and risk flags. An AI chat interface answers follow-up questions about the evaluation using full context.

**Tools used:** OpenAI GPT-4o + GPT-4o-mini, n8n workflow automation, React frontend, Golang backend, PostgreSQL, Docker

**How it helps:** Saves 40 hours of manual vendor review work per evaluation. Eliminates hidden cost surprises (the system caught a 15% annual escalation clause in the demo). Reduces wrong vendor selection risk. Gives every decision-maker the same structured data regardless of their experience level.

---

## COMPLETION CONFIRMATION

When all steps complete, print:

```
╔═══════════════════════════════════════════════════════════════╗
║          VENDOREVAL AI — SYSTEM READY                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Frontend    →  http://localhost:5173                        ║
║  Backend     →  http://localhost:8080                        ║
║  n8n         →  http://localhost:5678                        ║
║                                                               ║
║  Demo login  →  Click "Try Demo" on login page              ║
║  Demo data   →  2 vendors pre-loaded, analysis ready        ║
║                                                               ║
║  VALIDATED:                                                   ║
║  ✓ Auth working                                              ║
║  ✓ Vendor upload working                                     ║
║  ✓ AI analysis returns scores                                ║
║  ✓ Red flags extracted                                       ║
║  ✓ Recommendation generated                                  ║
║  ✓ Chat responding                                           ║
║  ✓ Report exports as HTML                                    ║
║                                                               ║
║  Hackathon deadline: 31 March 2026, 11:59 PM                ║
╚═══════════════════════════════════════════════════════════════╝
```
