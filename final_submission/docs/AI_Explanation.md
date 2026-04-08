# How AI Powers VendorEval — Detailed Technical Explanation

## Overview

VendorEval AI uses artificial intelligence at two levels:
1. **Product AI** — The built-in analysis engine that powers the vendor evaluation features
2. **Development AI** — Claude AI used to design, build, and test the entire application

---

## 1. Product AI: The Built-in Analysis Engine

### Stage 1: NLP-Based Data Extraction

When a vendor proposal (raw text) is uploaded, the AI extraction engine processes it through multiple parsing layers:

**Cost Extraction:**
- Handles Indian Rupee formats: `INR 22,90,000`, `Rs. 8,50,000`, `18.2 lakh`
- Identifies Year 1 totals, setup fees, monthly costs
- Uses contextual regex: looks for amounts near keywords like "total", "year 1", "setup"
- Falls back to largest amount detected if no contextual match

**SLA Extraction:**
- Finds uptime percentages near keywords like "uptime", "availability", "SLA"
- Extracts response times (hours/minutes) near "P1", "critical", "response time"
- Uses windowed search: looks for numbers within 200 characters of relevant keywords

**Timeline Extraction:**
- Parses "X weeks" and "X months" patterns
- Converts months to weeks for standardized comparison

**Contract Terms:**
- Identifies payment terms (monthly, quarterly, milestone-based)
- Detects support type (24/7, business hours, dedicated)

### Stage 2: Red Flag Detection (Pattern Intelligence)

The engine scans proposals against 8 categories of contractual risk:

| Category | Keywords Detected | Severity |
|----------|------------------|----------|
| Auto-renewal | "auto-renewal", "automatically renew" | Critical |
| Price escalation | "escalation clause", "annual increase", "% escalation" | Critical |
| Limited liability | "limited liability", "not liable", "liability cap" | High |
| Termination fees | "early termination", "exit fee", "cancellation fee" | High |
| Hidden charges | "additional charge", "surcharge", "not included" | Medium |
| Weekend charges | "weekend support", "after-hours charge" | Medium |
| Shared resources | "shared resource", "part-time", "shared devops" | Medium |
| Vendor lock-in | "proprietary format", "data lock", "vendor lock" | High |

For each detected flag:
- Extracts the surrounding clause text (50 chars before, 100 after) as evidence
- Classifies severity (critical > high > medium > low)
- Groups by category for structured reporting

### Stage 3: Weighted Scoring Algorithm

Each vendor is scored on 5 dimensions (0-100):

**Cost Score (25% weight):**
```
If cost/budget <= 70%  → 95
If cost/budget <= 85%  → 85
If cost/budget <= 100% → 70
If cost/budget <= 120% → 45
If cost/budget > 120%  → 25
```

**Quality Score (30% weight):**
- Base: 60
- +5 per strength identified
- -5 per weakness identified
- +10 for 24/7 support
- Clamped to [10, 100]

**Timeline Score (15% weight):**
- <= 8 weeks → 90
- <= 12 weeks → 75
- <= 16 weeks → 60
- > 16 weeks → 40

**Risk Score (15% weight):**
- Base: 95
- -20 per critical red flag
- -12 per high red flag
- -3 per medium/low red flag
- -5 per hidden cost
- Minimum: 10

**SLA Score (15% weight):**
- 99.99%+ uptime → 98
- 99.9%+ uptime → 90
- 99.5%+ uptime → 70
- 99.0%+ uptime → 55
- < 99% → 35
- +10 bonus for 1-hour response time

**Overall Score** = Weighted average of all five dimensions.

### Stage 4: Recommendation Engine

The recommendation engine:
1. Sorts vendors by overall score (descending)
2. Selects the winner (highest score)
3. Calculates confidence: `min(50 + score_difference * 3, 95)`
4. Generates reasoning by comparing winner vs runner-up on each dimension
5. Produces negotiation tips based on:
   - Quoted cost (suggest 10-15% discount)
   - Timeline (request penalty clauses)
   - Competition (use other bids as leverage)
6. Compiles risk summary from all critical/high flags across vendors

### Stage 5: Intelligent Chat

The chat interface uses keyword matching to provide data-driven responses:
- "compare" / "vs" → Side-by-side vendor comparison with scores
- "red flag" / "risk" → Detailed flag listing by vendor
- "cost" / "price" → Pricing breakdown and most cost-effective vendor
- "recommend" / "best" → Winner with confidence and reasoning
- "negotiate" / "deal" → Negotiation strategies
- "score" / "rating" → Scoring methodology explanation
- "strength" / "weakness" → Vendor pros/cons
- "summary" → Full evaluation overview

---

## 2. Development AI: How Claude Built This

### Architecture Design
Claude AI designed the complete system architecture:
- **Backend**: Go with Chi router, JWT auth, PostgreSQL
- **Frontend**: React 18 with Vite, Axios, Recharts
- **Database**: PostgreSQL with JSONB columns for flexible AI outputs
- **Containerization**: Docker Compose for 4 services

### Code Generation
Claude generated:
- 1700+ lines of Go backend code (API handlers, auth, DB, analysis engine)
- 9 React components (LoginPage, Dashboard, UploadPage, AnalysisPage, ComparisonMatrix, RedFlagPanel, RecommendationPanel, ChatInterface, ReportExport)
- SQL schema with proper relationships and constraints
- Docker configuration for local and container deployment

### Algorithm Design
Claude designed the AI analysis algorithms:
- Regex patterns for Indian currency parsing
- Red flag detection rules from procurement domain knowledge
- Weighted scoring model reflecting real procurement priorities
- Recommendation logic with confidence scoring

### Testing & Debugging
Claude performed:
- End-to-end API testing (create evaluation → upload vendors → analyze → verify results)
- Compilation verification (go build, go vet)
- Integration testing between frontend and backend
- Bug identification and fixing

### This Document
This explanation, the voiceover script, and all submission materials were generated by Claude AI, demonstrating the complete AI-assisted development workflow.

---

## Summary

VendorEval AI demonstrates how AI can be applied practically to solve a real business problem. The AI is not just a wrapper around an LLM API — it's a purpose-built analysis engine that uses NLP techniques, pattern matching, and algorithmic scoring to deliver actionable procurement intelligence. The entire application was designed and built with AI assistance, showcasing how modern AI tools can accelerate the full software development lifecycle from concept to production.
