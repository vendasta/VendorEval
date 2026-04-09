# VendorEval AI

**Upload. Analyze. Decide. In 10 Minutes.**

VendorEval AI turns weeks of manual vendor evaluation into a 10-minute automated workflow. Upload vendor proposals and your requirements -- the system extracts pricing, timelines, SLAs, and contract terms, scores each vendor across five dimensions, flags risky clauses, and recommends the best option with negotiation tips.

Built for procurement managers, engineering leads, and anyone comparing vendor proposals who's tired of doing it in spreadsheets.

---

## What It Does

```
Requirements doc + 2-8 vendor proposals
        |
        v
  ┌─────────────────────────────────┐
  │  Extract structured data        │  costs, timelines, SLAs, payment terms,
  │  from each proposal             │  support levels, contract clauses
  ├─────────────────────────────────┤
  │  Score vendors (0-100)          │  across Cost, Timeline, Quality,
  │  across 5 dimensions            │  Risk, and SLA
  ├─────────────────────────────────┤
  │  Detect red flags               │  auto-renewal traps, liability limits,
  │  in contract language           │  escalation clauses, hidden costs
  ├─────────────────────────────────┤
  │  Generate recommendation        │  best vendor, reasoning, confidence,
  │  with negotiation strategy      │  tips, risks to watch, runner-up
  └─────────────────────────────────┘
        |
        v
  Side-by-side comparison matrix
  Radar charts + score gauges
  Exportable PDF report
  AI chat for follow-up questions
```

## Key Features

- **Automated Data Extraction** -- Pulls costs, timelines, SLAs, payment terms, and support details from unstructured proposal text using pattern matching
- **Multi-Dimensional Scoring** -- Weighted scoring across Cost (25%), SLA (25%), Timeline (20%), Quality (15%), and Risk (15%)
- **Red Flag Detection** -- Identifies auto-renewal traps, liability disclaimers, price escalation clauses, early termination fees, and hidden costs with severity ratings (Critical / High / Medium / Low)
- **Side-by-Side Comparison** -- Full comparison matrix with color-coded best/worst values across 12 metrics
- **Interactive Visualizations** -- Radar charts, score gauges, and bar charts for quick visual comparison
- **AI Chat** -- Ask follow-up questions about the evaluation ("Why did CloudForce win?", "Compare costs", "What are the biggest risks?")
- **Report Export** -- Print-ready report with executive summary, vendor breakdown, red flags, and negotiation tips
- **Client-Side File Processing** -- PDF, DOCX, and TXT files are parsed in the browser; only extracted text is sent to the server
- **Demo Mode** -- One-click demo with pre-loaded sample data to explore the full workflow

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | React 18, Vite 5, Recharts, Axios, pdfjs-dist, mammoth |
| Backend   | Go 1.22, Chi router, lib/pq, golang-jwt, bcrypt    |
| Database  | PostgreSQL 16 (pgvector)                            |
| Automation| n8n                                                 |
| Infra     | Docker Compose                                      |

---

## Quick Start

**Prerequisites:** Docker and Docker Compose

```bash
# Clone and start
git clone https://github.com/vendasta/VendorEval.git
cd VendorEval
cp .env.example .env
make up
```

That's it. Four containers start automatically:

| Service   | URL                   |
|-----------|-----------------------|
| Frontend  | http://localhost:5173 |
| Backend   | http://localhost:8080 |
| n8n       | http://localhost:5678 |

Open http://localhost:5173 and click **"Try Demo"** to see a full evaluation with sample data.

### Verify

```bash
make health    # Backend health check
make test      # End-to-end smoke test
```

### Stop

```bash
make down      # Stop containers
make clean     # Stop + remove all data
```

---

## Usage

### 1. Create an Evaluation

Click **New Evaluation** from the dashboard. Enter a title and paste your requirements (or upload a PDF/DOCX/TXT).

For best results, be specific:
```
MUST-HAVE: 24x7 support, 99.9%+ uptime, P1 response <2 hours
IMPORTANT: Budget under INR 20,00,000, Timeline 10-12 weeks
CRITERIA: Cost 25%, SLA 25%, Timeline 20%, Team 15%, Risk 15%
```

### 2. Add Vendor Proposals

Add 2-8 vendors. Upload proposal files or paste text directly. The system accepts PDF, DOCX, and TXT formats.

### 3. Analyze

Click **Start AI Analysis**. In ~15 seconds the system extracts data, scores vendors, detects red flags, and generates a recommendation.

### 4. Review Results

Four tabs on the results page:

- **Overview** -- Winner banner, score cards with gauges, radar chart, full recommendation with negotiation tips
- **Comparison** -- Side-by-side matrix of all metrics with best/worst highlighting and bar chart
- **Red Flags** -- Filterable list of contract risks by severity and vendor
- **AI Chat** -- Ask questions about the evaluation results

### 5. Export

Click **Export Report** for a print-ready document covering the full analysis.

---

## Project Structure

```
VendorEval/
├── backend/
│   ├── cmd/server/main.go    # Entire backend: API, analysis engine, scoring
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Auth context, routing, toast system
│   │   ├── api/client.js      # Axios client with JWT interceptor
│   │   ├── utils/extractText.js  # Client-side PDF/DOCX text extraction
│   │   └── components/
│   │       ├── LoginPage.jsx         # Sign in, register, demo login
│   │       ├── Dashboard.jsx         # Evaluation list with search/stats
│   │       ├── UploadPage.jsx        # 3-step creation wizard
│   │       ├── AnalysisPage.jsx      # Results hub with tabbed navigation
│   │       ├── ComparisonMatrix.jsx  # Side-by-side table + bar chart
│   │       ├── RedFlagPanel.jsx      # Filterable red flag cards
│   │       ├── RecommendationPanel.jsx # Recommendation + tips + risks
│   │       ├── ChatInterface.jsx     # AI chat with quick actions
│   │       └── ReportExport.jsx      # Print-ready report view
│   ├── Dockerfile
│   └── package.json
├── data/
│   ├── seed.sql               # Database schema + demo users
│   └── sample_proposals/      # Demo vendor proposal text files
├── n8n/workflows/             # n8n automation workflow
├── scripts/                   # Demo recording and submission scripts
├── docker-compose.yml
├── Makefile
└── docs/
    ├── APPLICATION.md         # Technical architecture & API reference
    ├── USER_MANUAL.md         # End-user guide
    └── ADMIN_GUIDE.md         # Deployment & operations guide
```

---

## How the Analysis Engine Works

The backend uses a rule-based analysis engine (no external AI APIs required):

**Extraction** -- Regex patterns pull structured data from proposal text: costs (`INR X,XX,XXX`, `Total: $X`), timelines (`X weeks`), SLA uptime (`99.X%`), response times (`P1: X hours`), payment terms, and support details.

**Red Flag Detection** -- Keyword matching identifies risky contract language: auto-renewal clauses, liability limitations, price escalation, data loss disclaimers, early termination penalties. Each flag gets a severity rating and category.

**Scoring** -- Five dimension scores (0-100) based on:
- **Cost**: Ratio of vendor cost to requirements budget cap
- **Timeline**: Shorter is better, bonus for delay penalty clauses
- **Quality**: Team size, dedicated resources, certifications
- **Risk**: Starts at 100, deducted per red flag by severity
- **SLA**: Uptime percentage and response time commitments

**Overall Score** = Cost (25%) + SLA (25%) + Timeline (20%) + Quality (15%) + Risk (15%)

**Recommendation** -- Vendors ranked by overall score. Generates reasoning, confidence score, negotiation tips, risks to watch, and identifies the runner-up.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Application Docs](docs/APPLICATION.md) | Technical architecture, API reference, database schema, configuration |
| [User Manual](docs/USER_MANUAL.md) | End-user guide with step-by-step workflows |
| [Admin Guide](docs/ADMIN_GUIDE.md) | Deployment, database management, n8n setup, monitoring |

---

## License

This project was built for the BE10X AI Hackathon.
