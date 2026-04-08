# VendorEval AI - Demo Voiceover Script
## Duration: ~4 minutes | Synced to screen recording

---

### INTRO (0:00 - 0:20) [Show: Login Page]

"Welcome to VendorEval AI — an intelligent vendor proposal evaluation tool that helps procurement managers analyze multiple vendor proposals in minutes, not weeks.

Today, I'll walk you through a complete end-to-end demo — from uploading vendor proposals to getting an AI-powered recommendation."

---

### LOGIN (0:20 - 0:30) [Action: Click "Try Demo"]

"Let's start by logging in. We have a one-click demo mode — just click Try Demo and we're in."

---

### DASHBOARD (0:30 - 0:45) [Show: Dashboard]

"This is the main dashboard. Here you can see all your vendor evaluations at a glance — their status, how many vendors were analyzed, and the overall result. Let's create a new evaluation."

---

### CREATE EVALUATION (0:45 - 1:15) [Action: Click New, fill form]

"I'll click New Evaluation and set up our procurement scenario. We're selecting a Cloud Infrastructure vendor for Q2 2026.

For requirements, I'll specify: 99.9 percent uptime, 24x7 support, budget under 20 lakh INR for Year 1, dedicated team, no auto-renewal clauses, and 2-hour priority-1 response time.

These requirements will be used by the AI engine to score each vendor against what actually matters to us."

---

### UPLOAD VENDORS (1:15 - 1:50) [Action: Upload 2 vendor proposals]

"Now I'll upload two vendor proposals. First, TechSolutions India — they're proposing 22.9 lakh INR for Year 1 with a 10-week timeline.

Second, CloudForce Systems — proposing 18.2 lakh INR with the same timeline but stronger SLA commitments.

Notice how we simply paste the proposal text — the AI engine does all the heavy lifting of extracting structured data from unstructured text."

---

### ANALYSIS (1:50 - 2:15) [Action: Click Analyze, wait for results]

"Now the magic happens. I'll click Analyze and the built-in AI engine processes both proposals simultaneously. It performs three operations:

First, data extraction — parsing costs, timelines, SLAs, and contract terms from raw text using natural language processing.

Second, risk detection — scanning for red flags like auto-renewal traps, price escalation clauses, and limited liability terms.

Third, scoring — evaluating each vendor on cost, quality, timeline, risk, and SLA, weighted according to our requirements.

And it's done — in seconds, not weeks."

---

### COMPARISON MATRIX (2:15 - 2:40) [Show: Comparison tab with chart]

"The Comparison Matrix gives us a side-by-side view. CloudForce scores 72.4 overall versus TechSolutions at 50.6.

The bar chart visualizes the score breakdown — you can see CloudForce wins on cost, SLA, and risk. TechSolutions actually scored well on timeline but their price escalation clause and auto-renewal trap pulled their risk score down significantly."

---

### RED FLAGS (2:40 - 3:05) [Show: Red Flags tab]

"The Red Flags panel is where VendorEval really saves procurement teams from costly mistakes.

TechSolutions has 6 red flags — including a critical auto-renewal clause that locks you in, a 15 percent annual price escalation, and limited liability for data loss. These are the kinds of hidden traps that cost companies lakhs.

CloudForce has only 3 flags, all medium severity — much cleaner terms."

---

### RECOMMENDATION (3:05 - 3:25) [Show: Recommendation tab]

"The AI recommends CloudForce Systems with 95 percent confidence. The reasoning is clear — lower cost, better SLA, fewer red flags, and no escalation clauses.

It also provides negotiation tips — like requesting a 10-15 percent discount and using TechSolutions' bid as leverage."

---

### AI CHAT (3:25 - 3:50) [Show: Chat tab, ask a question]

"The built-in chat lets you ask follow-up questions about the evaluation. I'll ask: Compare both vendors.

The system responds with a structured comparison including scores, costs, and key differences — all drawn from the actual analysis data. This is like having a procurement advisor available 24/7."

---

### HOW AI POWERS THIS (3:50 - 4:30) [Show: Architecture or back to dashboard]

"Let me explain how AI powers VendorEval under the hood.

The backend uses an intelligent NLP engine built in Go that processes vendor proposals through three AI-driven stages:

Stage 1 — Extraction: Advanced regex patterns and natural language processing parse unstructured proposal text to extract structured data — costs in Indian Rupee format, SLA percentages, timeline commitments, and contract terms.

Stage 2 — Risk Intelligence: A pattern-matching engine scans for 8 categories of contractual red flags, including auto-renewal traps, price escalation clauses, limited liability, and vendor lock-in indicators. Each flag is classified by severity — critical, high, medium, or low.

Stage 3 — Smart Scoring: A weighted scoring algorithm evaluates vendors across 5 dimensions — cost at 25 percent, quality at 30 percent, timeline at 15 percent, risk at 15 percent, and SLA at 15 percent. The weights reflect real procurement priorities.

The entire system is self-contained — no external API keys needed. AI was used in designing the analysis algorithms, crafting the extraction patterns, and building the recommendation logic. Claude AI assisted in the complete development — from architecture design to code generation to testing.

This tool transforms what traditionally takes 2-3 weeks of manual analysis into a 10-minute automated workflow — saving procurement teams significant time, effort, and most importantly, money by catching hidden contract risks."

---

### CLOSING (4:30 - 4:40) [Show: Dashboard]

"That's VendorEval AI — Upload, Analyze, Decide. In 10 minutes. Thank you for watching."

---

## NOTES FOR RECORDING:
- Speak at a moderate, professional pace
- Pause briefly between sections while performing screen actions
- Ensure all clicks and typing are visible on screen
- No recording capture symbols should be visible in the final video
- Record at 1440x900 resolution for crisp screenshots
- Use QuickTime Player (File > New Screen Recording) for clean capture with no UI overlay
