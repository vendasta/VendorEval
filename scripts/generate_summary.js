import fs from 'fs'

const summary = `
VENDOREVAL AI — Submission Summary
====================================

Project: VendorEval AI — Intelligent Vendor Proposal Evaluator
Hackathon: BE10X AI Hackathon 2026

Problem: Procurement managers spend 2-3 weeks manually comparing 5-8 vendor proposals
in spreadsheets, missing hidden costs and risky contract clauses.

Solution: AI-powered vendor proposal evaluator that reads proposals, extracts structured
data, scores vendors, identifies red flags, and recommends the best vendor in 10 minutes.

Tech Stack:
- Frontend: React + Vite + Recharts
- Backend: Go (Chi router)
- Database: PostgreSQL with pgvector
- AI: OpenAI GPT-4o + GPT-4o-mini
- Automation: n8n workflow
- Infrastructure: Docker Compose

Key Features:
1. Upload 2-8 vendor proposals
2. AI extracts pricing, SLA, timeline, payment terms, hidden costs
3. Scores each vendor across 5 dimensions (0-100)
4. Identifies red flags with severity tags
5. Generates side-by-side comparison matrix
6. Recommends best vendor with reasoning and negotiation tips
7. AI chat for follow-up questions
8. Professional HTML/PDF report export
9. n8n workflow for automated notifications

Impact:
- Saves 40 hours of manual work per evaluation
- Eliminates hidden cost surprises
- Reduces wrong vendor selection risk
`

fs.mkdirSync('../submission', { recursive: true })
fs.writeFileSync('../submission/summary.txt', summary)
console.log('Summary saved to submission/summary.txt')
