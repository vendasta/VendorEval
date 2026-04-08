const puppeteer = require('puppeteer');
const path = require('path');

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1e293b;
    line-height: 1.7;
    font-size: 11pt;
  }

  .page { padding: 60px 65px; }

  /* Cover Page */
  .cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    color: #fff;
    padding: 80px 70px;
    page-break-after: always;
  }
  .cover-icon { margin-bottom: 32px; }
  .cover-title {
    font-size: 42pt;
    font-weight: 800;
    letter-spacing: -1.5px;
    margin-bottom: 12px;
  }
  .cover-subtitle {
    font-size: 16pt;
    font-weight: 300;
    color: #94a3b8;
    margin-bottom: 48px;
  }
  .cover-meta {
    font-size: 10pt;
    color: #64748b;
    border-top: 1px solid #334155;
    padding-top: 24px;
    display: flex;
    gap: 40px;
  }
  .cover-meta-item strong { color: #cbd5e1; display: block; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .cover-meta-item span { color: #94a3b8; }

  /* Section Headers */
  h1 {
    font-size: 22pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
    padding-bottom: 10px;
    border-bottom: 3px solid #3b82f6;
    display: inline-block;
  }
  h2 {
    font-size: 14pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 28px;
    margin-bottom: 10px;
  }
  h3 {
    font-size: 12pt;
    font-weight: 600;
    color: #334155;
    margin-top: 20px;
    margin-bottom: 8px;
  }

  p { margin-bottom: 12px; color: #475569; }

  .section { margin-bottom: 36px; }

  /* Highlight Box */
  .highlight-box {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 4px solid #10b981;
    border-radius: 8px;
    padding: 20px 24px;
    margin: 20px 0;
  }
  .highlight-box p { color: #166534; margin-bottom: 6px; }
  .highlight-box strong { color: #14532d; }

  .info-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-left: 4px solid #3b82f6;
    border-radius: 8px;
    padding: 20px 24px;
    margin: 20px 0;
  }
  .info-box p { color: #1e40af; margin-bottom: 6px; }

  /* Benefits Grid */
  .benefits-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 20px 0;
  }
  .benefit-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .benefit-card .icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-bottom: 12px;
  }
  .benefit-card .icon--blue { background: #dbeafe; }
  .benefit-card .icon--green { background: #dcfce7; }
  .benefit-card .icon--amber { background: #fef3c7; }
  .benefit-card .icon--purple { background: #f3e8ff; }
  .benefit-card .icon--red { background: #fee2e2; }
  .benefit-card .icon--teal { background: #ccfbf1; }
  .benefit-card h4 {
    font-size: 11pt;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 6px;
  }
  .benefit-card p {
    font-size: 10pt;
    color: #64748b;
    margin-bottom: 0;
  }

  /* Table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10pt;
  }
  th {
    background: #f8fafc;
    font-weight: 600;
    color: #0f172a;
    padding: 10px 14px;
    text-align: left;
    border-bottom: 2px solid #e2e8f0;
  }
  td {
    padding: 10px 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #475569;
  }
  tr:nth-child(even) td { background: #f8fafc; }

  /* List */
  ul, ol { margin: 10px 0 16px 24px; color: #475569; }
  li { margin-bottom: 6px; }
  li strong { color: #1e293b; }

  /* Flow Diagram */
  .flow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    margin: 24px 0;
  }
  .flow-step {
    background: #fff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px 20px;
    text-align: center;
    min-width: 130px;
  }
  .flow-step .num {
    width: 28px;
    height: 28px;
    background: #3b82f6;
    color: #fff;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .flow-step .label { font-size: 10pt; font-weight: 600; color: #0f172a; }
  .flow-step .desc { font-size: 8pt; color: #64748b; margin-top: 4px; }
  .flow-arrow { font-size: 18px; color: #94a3b8; margin: 0 8px; }

  /* Footer */
  .footer {
    text-align: center;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
    color: #94a3b8;
    font-size: 9pt;
    margin-top: 40px;
  }

  .page-break { page-break-before: always; }
</style>
</head>
<body>

<!-- ==================== COVER PAGE ==================== -->
<div class="cover">
  <div class="cover-icon">
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="12" y="4" width="48" height="64" rx="6" fill="#1e3a5f" stroke="#4ade80" stroke-width="2"/>
      <rect x="20" y="16" width="32" height="3" rx="1.5" fill="#4ade80" opacity="0.7"/>
      <rect x="20" y="24" width="28" height="3" rx="1.5" fill="#fff" opacity="0.4"/>
      <rect x="20" y="32" width="32" height="3" rx="1.5" fill="#fff" opacity="0.4"/>
      <rect x="20" y="40" width="24" height="3" rx="1.5" fill="#fff" opacity="0.4"/>
      <circle cx="56" cy="56" r="18" fill="#2563eb" stroke="#0f172a" stroke-width="3"/>
      <path d="M48 56l5 5 10-10" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <div class="cover-title">VendorEval AI</div>
  <div class="cover-subtitle">AI-Powered Vendor Evaluation &amp; Contract Intelligence Platform</div>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <strong>Document Type</strong>
      <span>Purpose &amp; Benefits Overview</span>
    </div>
    <div class="cover-meta-item">
      <strong>Audience</strong>
      <span>Procurement &amp; Contract Management Teams</span>
    </div>
    <div class="cover-meta-item">
      <strong>Date</strong>
      <span>April 2026</span>
    </div>
    <div class="cover-meta-item">
      <strong>Classification</strong>
      <span>Internal</span>
    </div>
  </div>
</div>

<!-- ==================== PAGE 2: PURPOSE ==================== -->
<div class="page">

  <div class="section">
    <h1>1. Purpose</h1>
    <p>
      <strong>VendorEval AI</strong> is an intelligent vendor evaluation platform designed to transform how procurement and contract management teams assess, compare, and select vendors. It eliminates the manual, spreadsheet-driven evaluation process and replaces it with a structured, AI-powered workflow that delivers consistent, data-driven recommendations in minutes.
    </p>

    <div class="highlight-box">
      <p><strong>Mission Statement:</strong> Enable procurement teams to make faster, more confident vendor decisions by automating proposal analysis, risk detection, and comparison — reducing evaluation time from weeks to minutes while improving decision quality.</p>
    </div>

    <h2>1.1 The Problem We Solve</h2>
    <p>Traditional vendor evaluation suffers from several critical pain points:</p>
    <ul>
      <li><strong>Time-Intensive Manual Review:</strong> Procurement teams spend 2-4 weeks reading and comparing vendor proposals line by line, extracting key data points into spreadsheets manually.</li>
      <li><strong>Inconsistent Scoring:</strong> Without a structured framework, different evaluators apply different criteria, leading to subjective and inconsistent assessments.</li>
      <li><strong>Hidden Risks Overlooked:</strong> Critical contract red flags — auto-renewal clauses, price escalation terms, liability limitations — are often buried in dense legal language and missed during review.</li>
      <li><strong>Lack of Structured Comparison:</strong> Side-by-side comparison across multiple vendors and dimensions (cost, timeline, SLA, quality, risk) is difficult to do consistently in spreadsheets.</li>
      <li><strong>No Institutional Memory:</strong> Evaluation criteria, lessons learned, and negotiation insights are lost between procurement cycles.</li>
    </ul>

    <h2>1.2 How VendorEval AI Works</h2>
    <div class="flow">
      <div class="flow-step">
        <div class="num">1</div>
        <div class="label">Upload</div>
        <div class="desc">Requirements &amp;<br>Vendor Proposals</div>
      </div>
      <div class="flow-arrow">&#10140;</div>
      <div class="flow-step">
        <div class="num">2</div>
        <div class="label">Extract</div>
        <div class="desc">AI reads &amp; extracts<br>key data points</div>
      </div>
      <div class="flow-arrow">&#10140;</div>
      <div class="flow-step">
        <div class="num">3</div>
        <div class="label">Score</div>
        <div class="desc">Multi-dimensional<br>scoring engine</div>
      </div>
      <div class="flow-arrow">&#10140;</div>
      <div class="flow-step">
        <div class="num">4</div>
        <div class="label">Recommend</div>
        <div class="desc">Winner + risks +<br>negotiation tips</div>
      </div>
      <div class="flow-arrow">&#10140;</div>
      <div class="flow-step">
        <div class="num">5</div>
        <div class="label">Decide</div>
        <div class="desc">Export reports &amp;<br>AI-assisted Q&amp;A</div>
      </div>
    </div>

    <h2>1.3 Target Users</h2>
    <table>
      <thead>
        <tr><th>Role</th><th>How They Use VendorEval AI</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Procurement Managers</strong></td><td>Upload RFP requirements and vendor proposals, run evaluations, review AI recommendations, export reports for stakeholders</td></tr>
        <tr><td><strong>Contract Managers</strong></td><td>Review red flags and contract risk analysis, verify clause-level issues, use negotiation tips before vendor discussions</td></tr>
        <tr><td><strong>Finance Leads</strong></td><td>Compare cost structures across vendors, identify hidden costs and pricing traps, validate budget alignment</td></tr>
        <tr><td><strong>Department Heads</strong></td><td>Review executive summaries and comparison matrices, make final vendor selection decisions based on data</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ==================== PAGE 3: BENEFITS ==================== -->
<div class="page page-break">
  <div class="section">
    <h1>2. Key Benefits</h1>
    <p>VendorEval AI delivers measurable value across every stage of the vendor evaluation process.</p>

    <div class="benefits-grid">
      <div class="benefit-card">
        <div class="icon icon--blue">&#9201;</div>
        <h4>90% Faster Evaluations</h4>
        <p>Reduce evaluation cycles from 2-4 weeks to under 10 minutes. AI extracts, scores, and compares vendor proposals instantly — freeing your team to focus on decision-making, not data entry.</p>
      </div>
      <div class="benefit-card">
        <div class="icon icon--green">&#9745;</div>
        <h4>Consistent, Objective Scoring</h4>
        <p>Every vendor is scored against the same 5-dimension framework (Cost, Timeline, Quality, Risk, SLA) with configurable weights. Eliminate evaluator bias and subjective scoring.</p>
      </div>
      <div class="benefit-card">
        <div class="icon icon--red">&#9888;</div>
        <h4>Automated Red Flag Detection</h4>
        <p>AI scans proposals for 8 categories of contract risks — auto-renewal traps, price escalation clauses, liability limitations, early termination penalties, vendor lock-in, and more — with severity ratings and clause citations.</p>
      </div>
      <div class="benefit-card">
        <div class="icon icon--purple">&#9733;</div>
        <h4>Data-Driven Recommendations</h4>
        <p>Get a clear winner recommendation with confidence score, detailed reasoning, runner-up comparison, and actionable negotiation tips — backed by multi-dimensional analysis.</p>
      </div>
      <div class="benefit-card">
        <div class="icon icon--amber">&#128200;</div>
        <h4>Side-by-Side Comparison</h4>
        <p>Visual comparison matrix and radar charts let stakeholders instantly see how vendors stack up across every dimension. Color-coded cells highlight best and worst values.</p>
      </div>
      <div class="benefit-card">
        <div class="icon icon--teal">&#128172;</div>
        <h4>AI-Powered Q&amp;A</h4>
        <p>Ask natural-language questions about the evaluation — "Why did Vendor A score higher?", "What are the biggest risks?" — and get instant, context-aware answers.</p>
      </div>
    </div>

    <h2>2.1 Quantified Impact</h2>
    <table>
      <thead>
        <tr><th>Metric</th><th>Before VendorEval AI</th><th>After VendorEval AI</th><th>Improvement</th></tr>
      </thead>
      <tbody>
        <tr><td>Evaluation Cycle Time</td><td>2-4 weeks</td><td>&lt; 10 minutes</td><td><strong>99% reduction</strong></td></tr>
        <tr><td>Red Flags Detected per Evaluation</td><td>1-2 (manual)</td><td>5-8 (automated)</td><td><strong>4x more coverage</strong></td></tr>
        <tr><td>Scoring Consistency</td><td>Varies by evaluator</td><td>100% consistent</td><td><strong>Standardized</strong></td></tr>
        <tr><td>Cost of Evaluation (Person-Hours)</td><td>40-80 hours</td><td>1-2 hours (review only)</td><td><strong>95% reduction</strong></td></tr>
        <tr><td>Negotiation Preparation</td><td>Ad-hoc</td><td>AI-generated tips per vendor</td><td><strong>Structured</strong></td></tr>
        <tr><td>Report Generation</td><td>4-8 hours manual</td><td>1-click export</td><td><strong>Instant</strong></td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- ==================== PAGE 4: FEATURES & SECURITY ==================== -->
<div class="page page-break">
  <div class="section">
    <h1>3. Platform Features</h1>

    <h2>3.1 Core Capabilities</h2>
    <table>
      <thead>
        <tr><th>Feature</th><th>Description</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Document Upload</strong></td><td>Upload vendor proposals as PDF, DOCX, or TXT files. AI automatically extracts text for analysis.</td></tr>
        <tr><td><strong>Requirements Matching</strong></td><td>Define your RFP requirements (must-have, important, nice-to-have) and the AI evaluates each vendor against them.</td></tr>
        <tr><td><strong>5-Dimension Scoring</strong></td><td>Cost (25%), Quality (30%), Timeline (15%), Risk (15%), SLA (15%) — weights customizable per evaluation.</td></tr>
        <tr><td><strong>Red Flag Engine</strong></td><td>Detects 8 risk categories: auto-renewal, price escalation, limited liability, termination penalties, hidden charges, weekend surcharges, shared resources, vendor lock-in.</td></tr>
        <tr><td><strong>Comparison Matrix</strong></td><td>Side-by-side table with color-coded cells (green=best, red=worst) across all metrics and vendors.</td></tr>
        <tr><td><strong>Radar Chart</strong></td><td>Multi-dimensional visual comparison showing vendor strengths and weaknesses at a glance.</td></tr>
        <tr><td><strong>AI Recommendation</strong></td><td>Winner selection with confidence score, reasoning narrative, negotiation tips, and risk summary.</td></tr>
        <tr><td><strong>AI Chat</strong></td><td>Natural-language Q&amp;A interface to explore evaluation results, ask follow-up questions, and get instant insights.</td></tr>
        <tr><td><strong>Report Export</strong></td><td>One-click professional PDF report with executive summary, comparison, red flags, and recommendations.</td></tr>
        <tr><td><strong>Multi-Vendor Support</strong></td><td>Compare up to 8 vendors simultaneously in a single evaluation.</td></tr>
      </tbody>
    </table>

    <h2>3.2 Security &amp; Access Control</h2>
    <div class="info-box">
      <p><strong>Enterprise-grade security</strong> is built into every layer of the platform.</p>
    </div>
    <ul>
      <li><strong>Authentication:</strong> Secure JWT-based authentication with bcrypt password hashing</li>
      <li><strong>Role-Based Access:</strong> User, Admin, and Demo roles with appropriate access controls</li>
      <li><strong>Data Isolation:</strong> Each user can only access their own evaluations — enforced at the API level</li>
      <li><strong>Session Management:</strong> Automatic session expiry with secure token handling</li>
      <li><strong>No External Data Sharing:</strong> The AI analysis engine runs entirely on-premises — no vendor proposal data is sent to external APIs</li>
    </ul>

    <h2>3.3 Technology Stack</h2>
    <table>
      <thead>
        <tr><th>Component</th><th>Technology</th><th>Purpose</th></tr>
      </thead>
      <tbody>
        <tr><td>Frontend</td><td>React 18, Vite</td><td>Modern, responsive user interface</td></tr>
        <tr><td>Backend API</td><td>Go (Golang)</td><td>High-performance REST API</td></tr>
        <tr><td>Database</td><td>PostgreSQL 16</td><td>Reliable data storage with JSONB support</td></tr>
        <tr><td>AI Engine</td><td>Built-in NLP</td><td>On-premises analysis — no external API dependencies</td></tr>
        <tr><td>Automation</td><td>n8n Workflows</td><td>Optional notification and webhook integrations</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>VendorEval AI &mdash; Purpose &amp; Benefits Document &mdash; April 2026 &mdash; Confidential &mdash; Internal Use Only</p>
  </div>
</div>

</body>
</html>`;

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(HTML, { waitUntil: 'networkidle0' });

  const outputPath = path.resolve(__dirname, '..', 'VendorEval_AI_Purpose_and_Benefits.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();
  console.log('PDF generated: ' + outputPath);
})();
