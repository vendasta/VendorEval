# VendorEval AI — Project Report
### Intelligent Vendor Proposal Evaluator
**Upload. Analyze. Decide. In 10 Minutes.**

**Submitted for:** BE10X Weekly AI Generalist Hackathon (Batch 6)
**Submission Date:** March 2026
**Author:** Gopi Raja V

---

## 1. Problem Statement

### The Real-World Pain
Procurement teams in mid-to-large companies spend **2-3 weeks** manually reviewing vendor proposals for every major purchase decision. The process involves:

- Reading through 50+ page proposals from multiple vendors
- Comparing pricing across inconsistent formats (lakh vs monthly vs milestone)
- Manually creating comparison spreadsheets
- Identifying hidden contractual risks buried in fine print
- Making subjective decisions without standardized scoring

### The Cost of Getting It Wrong
One missed clause — an auto-renewal trap, a 15% annual price escalation, or a limited liability term — can cost a company **lakhs in unexpected fees**. Most procurement teams don't have the time or expertise to catch these traps across every proposal.

### Who Faces This Problem?
- **Procurement Managers** evaluating vendor proposals regularly
- **Startup Founders/CTOs** making vendor decisions without a procurement team
- **Finance Teams** validating vendor pricing and catching hidden costs
- **SMBs** that can't afford procurement consultants

---

## 2. Solution Overview

**VendorEval AI** is a full-stack web application that automates the entire vendor proposal evaluation pipeline:

1. **Upload** vendor proposals (plain text)
2. **AI Analysis** extracts data, detects risks, scores vendors
3. **Compare** vendors side-by-side with visualizations
4. **Decide** with AI-powered recommendations and negotiation tips

### Key Features

| Feature | Description |
|---------|-------------|
| **NLP Data Extraction** | Parses costs, SLAs, timelines from unstructured text |
| **Red Flag Detection** | Scans for 8 categories of contractual risks |
| **Weighted Scoring** | Scores vendors across 5 dimensions (Cost, Quality, Timeline, Risk, SLA) |
| **Comparison Matrix** | Side-by-side table + bar chart visualization |
| **AI Recommendation** | Winner with confidence score + reasoning |
| **Negotiation Tips** | Actionable tips based on analysis |
| **AI Chat** | Ask follow-up questions about the evaluation |
| **PDF Report** | Downloadable evaluation report |
| **Demo Mode** | One-click demo with sample data |

---

## 3. Technical Architecture

### System Components

```
┌──────────────────────────────────────────────────┐
│                   FRONTEND                        │
│            React 18 + Vite + Recharts             │
│     Login | Dashboard | Upload Wizard | Analysis  │
│  Comparison | Red Flags | Recommendation | Chat   │
│                  Port 5173                        │
└──────────────────┬───────────────────────────────┘
                   │ REST API (/api/*)
┌──────────────────▼───────────────────────────────┐
│                   BACKEND                         │
│              Go (Golang) + Chi Router             │
│    JWT Auth | Built-in NLP Analysis Engine         │
│   Extraction | Scoring | Recommendation | Chat    │
│                  Port 8080                        │
└──────────────────┬───────────────────────────────┘
                   │ SQL
┌──────────────────▼───────────────────────────────┐
│                 DATABASE                          │
│          PostgreSQL with JSONB columns             │
│  users | evaluations | vendors | recommendations  │
│              chat_messages                        │
│                  Port 5432                        │
└──────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Vite, Recharts, Axios | SPA with data visualization |
| Backend | Go 1.22, Chi Router | REST API + AI analysis engine |
| Database | PostgreSQL 16 | Structured storage with JSONB |
| Auth | JWT + bcrypt | Secure authentication |
| Container | Docker Compose | 4-service deployment |

---

## 4. How AI Powers VendorEval

### Stage 1: NLP-Based Data Extraction

When a vendor proposal is uploaded, the AI extraction engine parses it through multiple layers:

**Cost Extraction:**
- Handles Indian Rupee formats: `INR 22,90,000`, `Rs. 8,50,000`, `18.2 lakh`
- Identifies Year 1 totals, setup fees, monthly costs
- Uses contextual regex — looks for amounts near keywords like "total", "year 1"

**SLA Extraction:**
- Finds uptime percentages near keywords like "uptime", "availability", "SLA"
- Extracts response times near "P1", "critical", "response time"
- Uses windowed search (200-character context)

**Timeline & Terms:**
- Parses "X weeks" and "X months" patterns
- Detects payment terms, support type (24/7, business hours)

### Stage 2: Red Flag Detection (Pattern Intelligence)

The engine scans for **8 categories** of contractual risk:

| Category | Severity | Example Detection |
|----------|----------|-------------------|
| Auto-renewal | Critical | "contract auto-renews unless 90-day notice" |
| Price escalation | Critical | "15% annual increase", "escalation clause" |
| Limited liability | High | "vendor not liable for data loss" |
| Termination fees | High | "early termination fee applies" |
| Hidden charges | Medium | "additional charges for weekend support" |
| Weekend surcharges | Medium | "after-hours support at extra cost" |
| Shared resources | Medium | "shared DevOps engineer" |
| Vendor lock-in | High | "proprietary data format" |

Each flag includes:
- **Severity classification** (critical/high/medium/low)
- **Category** for organized reporting
- **Clause text** extracted as evidence

### Stage 3: Weighted Scoring Algorithm

Vendors are scored on 5 dimensions (0-100 each):

| Dimension | Weight | Scoring Logic |
|-----------|--------|---------------|
| **Cost** | 25% | Budget ratio: ≤70% → 95, ≤85% → 85, ≤100% → 70, >120% → 25 |
| **Quality** | 30% | Base 60 + strengths(+5) - weaknesses(-5) + 24/7 support(+10) |
| **Timeline** | 15% | ≤8wk → 90, ≤12wk → 75, ≤16wk → 60, >16wk → 40 |
| **Risk** | 15% | Base 95 - critical(-20) - high(-12) - medium(-3) - hidden costs(-5) |
| **SLA** | 15% | 99.99% → 98, 99.9% → 90, 99.5% → 70, 99.0% → 55 |

**Overall Score** = Weighted average across all dimensions.

### Stage 4: Recommendation Engine

1. Ranks vendors by overall score
2. Selects winner (highest score)
3. Calculates confidence: `min(50 + score_gap × 3, 95)`
4. Generates reasoning by comparing winner vs runner-up
5. Produces negotiation tips and risk summary

### Stage 5: Intelligent Chat

Keyword-aware chat for follow-up Q&A:
- "compare" → Side-by-side vendor comparison
- "red flags" → Detailed risk listing
- "cost" → Pricing breakdown
- "recommend" → Winner with reasoning
- "negotiate" → Negotiation strategies
- "scores" → Scoring methodology

---

## 5. Demo Walkthrough

### Step 1: Login
One-click demo mode — no registration required. Logs in as "Demo Procurement Manager".

### Step 2: Dashboard
Shows all evaluations with status, vendor count, and results at a glance.

### Step 3: Create Evaluation
3-step wizard:
1. **Setup** — Enter title and requirements document
2. **Upload Vendors** — Paste proposal text for each vendor
3. **Analyze** — AI processes all proposals

### Step 4: Analysis Results

**Overview Tab:**
- Vendor scores displayed prominently (e.g., CloudForce: 72.4 vs TechSolutions: 50.6)
- AI recommendation with confidence percentage

**Comparison Tab:**
- Side-by-side metrics table (cost, timeline, SLA, scores)
- Bar chart visualization of scores

**Red Flags Tab:**
- Severity summary (9 total: 2 critical, 4 high, 2 medium)
- Filterable by vendor and severity
- Clause text evidence for each flag

**AI Chat Tab:**
- Ask questions about the evaluation
- Quick action buttons for common queries

### Step 5: Export Report
Downloadable HTML report with all analysis data.

---

## 6. Demo Results

Using the sample vendor proposals:

| Metric | TechSolutions India | CloudForce Systems |
|--------|--------------------|--------------------|
| **Year 1 Cost** | INR 22,90,000 | INR 18,20,000 |
| **Timeline** | 10 weeks | 10 weeks |
| **SLA Uptime** | 99.5% | 99.9% |
| **P1 Response** | 4 hours | 1 hour |
| **Overall Score** | 50.6/100 | 72.4/100 |
| **Red Flags** | 6 (2 critical) | 3 (0 critical) |

**Winner: CloudForce Systems** — 95% confidence
- Lower cost by INR 4,70,000
- Better SLA (99.9% vs 99.5%)
- No auto-renewal or escalation clauses
- TechSolutions flagged for: auto-renewal trap, 15% escalation, limited liability

---

## 7. Impact & Usefulness

| Metric | Before VendorEval | After VendorEval |
|--------|-------------------|------------------|
| **Evaluation Time** | 2-3 weeks | Under 10 minutes |
| **Team Required** | 3-4 people | 1 person |
| **Missed Red Flags** | Common | Zero (8 categories scanned) |
| **Cost** | INR 50K-2L per consultant | Free (self-contained) |
| **Bias** | Subjective decisions | Objective, data-driven scoring |
| **Consistency** | Varies by reviewer | Standardized methodology |

---

## 8. How AI Helped Build This

### Claude AI (Anthropic) was used throughout:

**Architecture Design:**
- Designed the full-stack architecture (Go + React + PostgreSQL)
- Selected optimal libraries and frameworks

**Algorithm Design:**
- Created NLP extraction patterns for Indian currency formats
- Designed red flag detection rules from procurement domain knowledge
- Built weighted scoring model reflecting real procurement priorities

**Code Generation:**
- 1,700+ lines of Go backend (API handlers, auth, DB, analysis engine)
- 9 React components (Login, Dashboard, Upload, Analysis, Comparison, Red Flags, Recommendation, Chat, Report)
- SQL schema with JSONB columns for flexible AI outputs

**Testing & Quality:**
- End-to-end API testing
- Compilation and integration verification
- Bug identification and fixing

**Documentation:**
- Demo voiceover script
- Google Form submission answers
- This project report

### AI Tools Used:
- **Claude AI** — Architecture, code generation, algorithm design
- **Claude Code CLI** — Primary development environment
- **Whisper AI** — Voice transcription for video sync
- **Microsoft Edge Neural TTS** — Backup voiceover generation
- **Custom NLP Engine** — Built-in analysis (no external API dependency)

---

## 9. Future Enhancements

- **PDF Upload** — Parse vendor proposals from PDF/DOCX files directly
- **LLM Integration** — Optional OpenAI/Claude API for deeper semantic analysis
- **Multi-language** — Support proposals in Hindi, Tamil, and other Indian languages
- **Team Collaboration** — Multiple reviewers with role-based access
- **Historical Analytics** — Track vendor performance across evaluations
- **Email Notifications** — Automated alerts via n8n workflow integration

---

## 10. Conclusion

VendorEval AI demonstrates how AI can solve a **real, costly business problem** — vendor evaluation — by combining NLP extraction, pattern-based risk detection, and algorithmic scoring into a self-contained, easy-to-use web application.

The tool was designed and built entirely with AI assistance, showcasing the full potential of AI-powered software development. It saves procurement teams weeks of work, catches hidden contract risks that humans commonly miss, and provides objective, data-driven recommendations.

**VendorEval AI — Upload. Analyze. Decide. In 10 Minutes.**

---

*Built with Claude AI | BE10X AI Generalist Hackathon Batch 6 | March 2026*
