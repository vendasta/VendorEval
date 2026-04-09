# VendorEval AI -- User Manual

## What is VendorEval AI?

VendorEval AI helps you evaluate vendor proposals in minutes instead of weeks. Upload your requirements and vendor proposals, and the system will:

- Extract key data from each proposal (pricing, timelines, SLAs, payment terms)
- Score each vendor across 5 dimensions (Cost, Timeline, Quality, Risk, SLA)
- Detect red flags and risky contract language
- Generate a side-by-side comparison matrix
- Recommend the best vendor with reasoning and negotiation tips
- Export a professional report

---

## Getting Started

### Creating an Account

1. Open VendorEval AI in your browser (default: http://localhost:5173)
2. Click the **Register** tab on the login page
3. Fill in your name, email, password (minimum 6 characters), and company name
4. Click **Register** -- you'll be taken to the Dashboard

### Demo Mode

If you want to explore without creating an account:

1. On the login page, click **"Try Demo -- No signup needed"**
2. You'll be logged in as a demo user with sample data access
3. A yellow banner at the top indicates you're in demo mode

### Signing In

1. Enter your email and password on the **Sign In** tab
2. Click **Sign In**
3. You'll be taken to the Dashboard

---

## Dashboard

The Dashboard is your home screen. It shows:

- **Stats row**: Total evaluations, completed, in progress, and failed counts
- **Search bar**: Filter evaluations by title
- **Evaluation cards**: Each card shows the evaluation title, vendor count, creation date, and status

**Status indicators:**
- **pending** -- Created but not yet analyzed
- **extracting** -- Data extraction in progress
- **scoring** -- Vendor scoring in progress
- **completed** -- Analysis finished, results available
- **failed** -- Analysis encountered an error

Click any evaluation card to view its details, or click **"New Evaluation"** to start a new one.

---

## Creating a New Evaluation

The evaluation creation wizard has 3 steps.

### Step 1: Define Requirements

1. Click **"New Evaluation"** from the Dashboard
2. Enter an **Evaluation Title** (e.g., "Cloud Infrastructure Vendor Selection Q2 2026")
3. Add your **Requirements Document**:
   - **Upload a file**: Click "Upload File" to upload a PDF, DOCX, or TXT file. Text will be extracted automatically.
   - **Paste text**: Type or paste your requirements directly into the text area.
4. Click **Continue**

**Tip:** Use the **"Load Demo Data"** button to populate the form with sample data and see how the system works.

**Writing effective requirements:**

For best results, structure your requirements clearly. The analysis engine looks for specific patterns:

```
MUST-HAVE: 24x7 support, 99.9%+ uptime, P1 response <2 hours
IMPORTANT: Budget under INR 20,00,000, Timeline 10-12 weeks
NICE-TO-HAVE: Weekend support, Slack channel
CRITERIA: Cost 25%, SLA 25%, Timeline 20%, Team 15%, Risk 15%
```

Include specific numbers where possible -- budget amounts, uptime percentages, response times, and timeline expectations help the scoring engine produce more accurate results.

### Step 2: Add Vendor Proposals

1. You start with 2 vendor slots (minimum required). Add up to 8 vendors using **"Add Another Vendor"**.
2. For each vendor:
   - Enter the **Vendor Name**
   - Upload a proposal file (PDF, DOCX, or TXT) or paste the proposal text directly
   - When you upload a file, the vendor name auto-fills from the filename
3. At least 2 vendors must have both a name and proposal text to proceed
4. Click **Continue to Review**

**Supported file formats:**
- **PDF** (.pdf) -- Text is extracted from all pages
- **Word** (.docx, .doc) -- Text is extracted from the document body
- **Plain Text** (.txt) -- Used directly as-is

**Note:** File processing happens in your browser. Files are not uploaded to the server -- only the extracted text is sent.

### Step 3: Review & Analyze

1. Review the evaluation title, requirements word count, and list of vendors
2. Confirm everything looks correct
3. Click **"Start AI Analysis"**

An overlay will appear showing the analysis progress:
- Creating evaluation
- Uploading vendors
- Extracting data
- Scoring vendors
- Generating recommendation

This typically takes 10-20 seconds. Once complete, you'll be redirected to the results page.

---

## Understanding Results

The Analysis page has a sidebar with 4 tabs: **Overview**, **Comparison**, **Red Flags**, and **AI Chat**.

### Overview Tab

The Overview tab provides a high-level summary of the evaluation results.

**Winner Banner:** A prominent banner at the top shows the recommended vendor, their overall score out of 100, and the AI's confidence percentage.

**Score Cards:** Each vendor gets a card showing:
- **Overall Score** as a circular gauge (green = 70+, amber = 40-69, red = below 40)
- **Dimension Bars** showing individual scores for Cost, Timeline, Quality, Risk, and SLA

**Radar Chart:** A multi-dimensional radar chart comparing all vendors across the 5 scoring dimensions. This makes it easy to visually identify where each vendor excels or falls short.

**Recommendation Panel:** Below the charts, the full recommendation includes:
- **Why this vendor was recommended** -- Detailed reasoning
- **Negotiation Tips** -- Actionable advice for contract negotiations
- **Risks to Watch** -- Potential concerns to monitor
- **Runner-up** -- The second-best option if available

### Comparison Tab

A detailed side-by-side comparison table showing:

| Metric                | What it shows                                    |
|-----------------------|--------------------------------------------------|
| Total Cost (Year 1)   | Extracted annual cost with currency               |
| Implementation Timeline| Duration in weeks                                |
| Payment Terms          | Payment structure (advance, milestones, etc.)     |
| SLA Uptime             | Guaranteed uptime percentage                     |
| P1 Response Time       | Critical issue response commitment               |
| Overall Score          | Weighted composite score (0-100)                 |
| Cost Score             | Cost competitiveness score                       |
| Timeline Score         | Timeline efficiency score                        |
| Quality Score          | Team and delivery quality score                  |
| Risk Score             | Contract risk assessment score                   |
| SLA Score              | Service level agreement quality score            |
| Red Flags              | Number of detected red flags                     |

**Color coding:**
- **Green** -- Best value among all vendors for that metric
- **Red** -- Worst value among all vendors for that metric

Below the table, a **bar chart** shows overall scores for a quick visual comparison.

### Red Flags Tab

Red flags are contract risks and concerning clauses detected in vendor proposals.

**Summary stats** at the top show total flags, critical count, high severity count, and number of vendors flagged.

**Filters:** Narrow results by:
- **Severity**: All, Critical, High, Medium, Low
- **Vendor**: Filter to a specific vendor

**Each flag card shows:**
- Severity badge (Critical, High, Medium, Low)
- Category (pricing, legal, timeline, SLA, compliance)
- Vendor name
- Click to expand for the full description and the specific clause text from the proposal

**Severity levels:**
- **Critical** -- Deal-breakers (e.g., no liability for data loss, auto-renewal traps)
- **High** -- Significant concerns (e.g., price escalation clauses, limited support hours)
- **Medium** -- Worth negotiating (e.g., shared resources, vague timelines)
- **Low** -- Minor notes (e.g., standard notice periods)

### AI Chat Tab

Chat with the AI about your evaluation results. The chat interface understands context about the vendors, scores, and recommendation.

**Quick action buttons** appear before your first message:
- "Why did [vendor] win?"
- "What are the biggest risks?"
- "Compare costs"
- "Negotiation tips"

You can also type free-form questions. The AI can answer about:
- Why a specific vendor was recommended
- Cost comparisons between vendors
- Red flags and risk details
- Timeline and SLA comparisons
- Negotiation strategies
- Strengths and weaknesses of specific vendors

---

## Exporting Reports

Click the **"Export Report"** button in the top-right of the Analysis page to view a printable report.

The report includes:
- Executive Summary with recommendation
- Vendor Comparison table
- Detailed Score Breakdown per vendor (Cost, Timeline, Quality, Risk, SLA, Overall)
- Strengths and weaknesses per vendor
- Red Flags per vendor with severity badges
- Negotiation Tips
- Risks to Watch

**To save as PDF:**
1. Click **"Print / Download PDF"** at the top of the report
2. In the browser print dialog, select **"Save as PDF"** as the destination
3. Click Save

The report is formatted for printing -- navigation elements are automatically hidden.

---

## Account Management

**Signing out:** Click your name/avatar in the top-right corner, then click **"Sign out"** from the dropdown menu.

**Session persistence:** Your login session is stored in the browser. You'll stay logged in until you sign out or clear your browser data. If your session expires, you'll be automatically redirected to the login page.

---

## Limits and Constraints

| Constraint                    | Limit                          |
|-------------------------------|--------------------------------|
| Vendors per evaluation        | 2 minimum, 8 maximum           |
| Password minimum length       | 6 characters                   |
| Supported file formats        | PDF, DOCX, DOC, TXT            |
| Max file size                 | 20 MB (reference)              |
| Score range                   | 0-100 per dimension            |

---

## Tips for Best Results

1. **Be specific in requirements**: Include exact budget numbers, uptime targets, timeline expectations, and response time SLAs. The engine uses these as benchmarks for scoring.

2. **Use structured proposal formats**: Vendors that clearly label sections (Pricing, Timeline, SLA, Support, Terms) will get more accurate data extraction.

3. **Include contract terms**: The red flag detector looks for auto-renewal clauses, liability limitations, escalation clauses, and early termination fees. Include the full terms section of each proposal.

4. **Compare at least 3 vendors**: While 2 is the minimum, having 3+ vendors produces more meaningful comparative analysis and more useful recommendations.

5. **Review red flags carefully**: Even the recommended vendor may have red flags. Use these as negotiation points rather than automatic disqualifiers.

---

## Troubleshooting

| Problem                            | Solution                                                          |
|------------------------------------|-------------------------------------------------------------------|
| "Analysis failed" error            | Check that all vendors have both a name and proposal text. Retry. |
| File upload shows "Extracting..." forever | The file may be image-based (scanned PDF). Use a text-based PDF or paste text manually. |
| Scores all show 0                  | Proposals may lack recognizable data patterns. Ensure proposals contain explicit numbers for costs, timelines, and SLAs. |
| Login redirects back to login page | Session may have expired. Sign in again.                          |
| Chat gives generic responses       | Ask more specific questions referencing vendor names or metrics.   |
| Report looks wrong when printing   | Use Chrome or Edge for best print-to-PDF results.                 |
