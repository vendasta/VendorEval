# Firebase Migration Plan — VendorEval AI

## Context

VendorEval AI currently runs as Go + PostgreSQL + Docker Compose (4 containers). The goal is to migrate to Firebase (Firestore, Functions, Hosting, Auth) for deployment simplicity — `firebase deploy` replaces `docker compose up`. The analysis engine is also upgraded from regex-based extraction to Gemini LLM with JSON mode, while keeping the deterministic scoring formulas.

Requirements doc: [firebase-migration-requirements.md](brainstorms/firebase-migration-requirements.md)

---

## Summary of Changes

| Current Stack | New Stack |
|---------------|-----------|
| Go 1.22 backend (single-file monolith) | Firebase Functions (TypeScript) |
| PostgreSQL 16 (6 relational tables) | Firestore (document/subcollection model) |
| Custom JWT auth (bcrypt + golang-jwt) | Firebase Auth (email/password) |
| Regex-based data extraction | Gemini LLM with JSON mode structured output |
| Template-based scoring formulas | Same deterministic formulas, ported to TypeScript |
| Keyword-matching chat | Gemini-powered conversational chat |
| Docker Compose (4 containers) | `firebase deploy` (serverless) |
| n8n workflow automation | Dropped (Firestore triggers replace it) |
| Demo login mode | Dropped (users must register) |

### New File Structure

```
VendorEval/
├── firebase.json
├── .firebaserc
├── firestore.rules
├── firestore.indexes.json
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                          # Entry point, exports all functions
│       ├── types.ts                          # TypeScript interfaces
│       ├── callables/
│       │   ├── createEvaluation.ts
│       │   ├── uploadVendor.ts
│       │   ├── analyzeEvaluation.ts
│       │   ├── chat.ts
│       │   └── generateReport.ts
│       ├── triggers/
│       │   ├── onUserCreate.ts               # Auth trigger → Firestore user profile
│       │   └── onAnalysisStart.ts            # Firestore trigger → background analysis
│       └── analysis/
│           ├── extraction.ts                 # Gemini JSON mode extraction
│           ├── scoring.ts                    # Deterministic scoring formulas
│           ├── recommendation.ts             # Gemini-enhanced recommendation
│           └── chatFallback.ts               # Keyword-matching fallback
├── frontend/
│   ├── src/
│   │   ├── lib/firebase.js                   # Firebase SDK init + emulator config
│   │   ├── api/firebase-client.js            # New API client (replaces client.js)
│   │   ├── App.jsx                           # Modified: Firebase Auth observer
│   │   ├── components/
│   │   │   ├── LoginPage.jsx                 # Modified: Firebase Auth SDK
│   │   │   ├── Dashboard.jsx                 # Modified: firebase-client imports
│   │   │   ├── UploadPage.jsx                # Modified: real-time analysis listener
│   │   │   ├── AnalysisPage.jsx              # Modified: Firestore queries
│   │   │   ├── ChatInterface.jsx             # Modified: firebase-client + auth
│   │   │   ├── Layout.jsx                    # Modified: Firebase user object
│   │   │   ├── ComparisonMatrix.jsx          # Unchanged
│   │   │   ├── RedFlagPanel.jsx              # Unchanged
│   │   │   ├── RecommendationPanel.jsx       # Unchanged
│   │   │   ├── ReportExport.jsx              # Unchanged
│   │   │   └── NotFound.jsx                  # Unchanged
│   │   └── utils/extractText.js              # Unchanged
│   └── package.json                          # Modified: +firebase, -axios
└── docs/
```

### Files Deleted

- `backend/` (entire Go backend)
- `docker-compose.yml`, `Makefile`
- `frontend/Dockerfile`, `backend/Dockerfile`
- `data/seed.sql`
- `n8n/` directory
- `.env.example`, root `package.json` + `package-lock.json`
- `frontend/src/api/client.js` (replaced by `firebase-client.js`)

---

## Phase 0: Firebase Project Setup

Create Firebase infrastructure files at the project root.

**Create:**
- `firebase.json` — configure Functions (source: `functions/`, runtime: nodejs20), Hosting (public: `frontend/dist`, SPA rewrite), Firestore (rules + indexes), emulators (Auth :9099, Functions :5001, Firestore :8080, Hosting :5000, UI :4000)
- `.firebaserc` — project ID
- `firestore.rules` — placeholder: authenticated users only
- `firestore.indexes.json` — empty indexes
- `functions/package.json` — deps: `firebase-functions`, `firebase-admin`, `@google-cloud/vertexai`; devDeps: `typescript`, `@types/node`
- `functions/tsconfig.json` — target ES2020, strict, outDir `lib/`, rootDir `src/`
- `functions/src/index.ts` — empty entry point

**Verify:** `firebase emulators:start` starts all 4 emulators, UI at localhost:4000

---

## Phase 1: Firebase Auth

Replace custom JWT auth with Firebase Auth. Remove demo login.

**What this replaces from the Go backend:**
- `handleRegister` — bcrypt password hashing, INSERT into users, JWT creation
- `handleLogin` — bcrypt compare, JWT creation
- `handleDemoLogin` — hardcoded demo user lookup
- `createToken` / `jwtMiddleware` — JWT token generation and verification

**Create:**
- `frontend/src/lib/firebase.js` — init Firebase app, export `auth`, `db`, `functions`; connect to emulators when `VITE_USE_EMULATORS=true`
- `frontend/.env.local` — Firebase config vars (`VITE_FIREBASE_*`, `VITE_USE_EMULATORS=true`)
- `functions/src/triggers/onUserCreate.ts` — on Auth user creation, write profile to `users/{uid}`

**Modify:**
- `frontend/package.json` — add `firebase` dependency
- `frontend/src/App.jsx` — replace localStorage token/user with `onAuthStateChanged` listener; AuthContext provides `{user, loading, logout}` where `user` is Firebase Auth user; ProtectedRoute checks `user` not `token`
- `frontend/src/components/LoginPage.jsx` — use `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`; remove demo login button and handler entirely
- `frontend/src/components/Layout.jsx` — use `user.displayName` instead of `user.name`; `signOut(auth)` for logout; remove demo banner
- `frontend/src/components/ChatInterface.jsx` — replace `localStorage.getItem('vendoreval_user')` with `useAuth()` for user name

**Verify:** Register -> sign in -> sign out -> sign back in. No localStorage token. User profile in Firestore emulator.

---

## Phase 2: Firestore Data Layer + CRUD Functions

Create Firestore collections and callable Functions for evaluation/vendor CRUD. Build the new Firebase API client for the frontend.

**Firestore data model:**

```
users/{uid}
  ├── name, email, company, createdAt

evaluations/{evalId}
  ├── userId, title, status, requirementsText, vendorCount,
  │   winnerVendorId, createdAt, completedAt
  │
  ├── vendors/{vendorId}
  │     ├── name, proposalText, totalCost, currency, timelineWeeks,
  │     │   paymentTerms, slaUptime, slaResponseTime, supportType
  │     ├── overallScore, costScore, timelineScore, qualityScore, riskScore, slaScore
  │     ├── summary, strengths[], weaknesses[], redFlags[], hiddenCosts[]
  │
  ├── recommendations/{recId}
  │     ├── recommendedVendor{}, reasoning, confidenceScore,
  │     │   negotiationTips[], risks[], runnerUp
  │
  └── chatMessages/{msgId}
        ├── role, content, createdAt
```

Red flags are stored as an array on vendor documents (always read together), not as a separate collection.

**Create:**
- `functions/src/types.ts` — TypeScript interfaces: `Evaluation`, `Vendor`, `RedFlag`, `Recommendation`, `ChatMessage`, `ExtractionResult`, `ScoringResult` (mirror Go structs with camelCase)
- `functions/src/callables/createEvaluation.ts` — validate auth, create doc with status `'draft'`
- `functions/src/callables/uploadVendor.ts` — validate auth + ownership, create vendor in subcollection, increment vendorCount
- `functions/src/callables/generateReport.ts` — read eval + vendors + recommendation, build HTML report (port `buildReportHTML` from Go backend)
- `frontend/src/api/firebase-client.js` — new API client exporting same function signatures as current `api/client.js`, backed by Firestore reads + callable Functions. Maps camelCase Firestore fields to snake_case for component compatibility. Also exports `onEvaluationStatusChange(id, callback)` for real-time listeners.

**Modify:**
- `firestore.rules` — full rules: users can only CRUD their own evaluations; subcollections inherit parent ownership check via `get()` on parent evaluation doc
- `functions/src/index.ts` — export all callables + triggers
- `frontend/src/components/Dashboard.jsx` — import from `firebase-client` instead of `api/client`
- `frontend/src/components/UploadPage.jsx` — import from `firebase-client`
- `frontend/src/components/AnalysisPage.jsx` — import from `firebase-client`

**Design note:** Comparison and recommendation data are read directly from Firestore by the client (secured by rules), not via Cloud Functions — avoids cold-start overhead for read-only queries.

**Verify:** Create evaluation -> upload 2 vendors -> verify docs in Firestore emulator. Dashboard shows the evaluation. Security rules block cross-user access.

---

## Phase 3: Analysis Engine (Gemini + Scoring)

The core of the migration. Two-stage hybrid pipeline: Gemini extracts structured data, deterministic formula scores.

**What this replaces from the Go backend:**
- All regex extraction functions (`extractTotalCost`, `extractTimeline`, `extractUptime`, etc.)
- `extractVendorData` — orchestrates extraction
- `scoreVendor` — deterministic scoring formulas
- `generateRecommendation` — recommendation generation
- `handleAnalyze` — synchronous analysis handler

**Create:**

### `functions/src/analysis/extraction.ts`
- `extractVendorData(proposalText, requirementsText): Promise<ExtractionResult>`
- Calls Gemini (Vertex AI, `gemini-2.5-flash`) with JSON mode structured output
- Prompt requests a typed JSON object matching `ExtractionResult`: totalCost, currency, timelineWeeks, paymentTerms, slaUptime, slaResponseTime, supportType, warrantyMonths, strengths[], weaknesses[], redFlags[], hiddenCosts[]
- JSON mode guarantees parseable responses — malformed response is a parse error, not fuzzy-text
- Falls back gracefully: missing fields default to 0 / "Unknown" / empty arrays

### `functions/src/analysis/scoring.ts`
- `scoreVendor(vendor, requirementsText): ScoringResult`
- **Exact port** of Go scoring formulas. Every threshold and weight must match:

| Dimension | Weight | Formula |
|-----------|--------|---------|
| Cost | 25% | Ratio to budget: <=0.7 -> 95, 0.7-0.85 -> 85, 0.85-1.0 -> 70, 1.0-1.2 -> 45, >1.2 -> 25 |
| Timeline | 15% | <=8wk -> 90, 8-12 -> 75, 12-16 -> 60, >16 -> 40 |
| Quality | **30%** | Base 60, +5/strength, -5/weakness, +10 for 24/7 support. Ceiling 100, floor 10 |
| Risk | 15% | Base 95, -20/critical, -12/high, -3/other flag, -5/hidden cost. Floor 10 |
| SLA | 15% | Uptime: >=99.99 -> 98, >=99.9 -> 90, >=99.5 -> 70, >=99 -> 55, >0 -> 35. +10 for 1hr response |

**Overall = Cost\*0.25 + Timeline\*0.15 + Quality\*0.30 + Risk\*0.15 + SLA\*0.15**

All scores rounded to 1 decimal place: `Math.round(score * 10) / 10`

Also ports budget parsing helpers: `parseINR`, regex for INR/lakh/year1 amounts from requirements text.

### `functions/src/analysis/recommendation.ts`
- `generateRecommendation(vendors, requirementsText): Promise<Recommendation>`
- Deterministic: sort by overallScore descending, confidence = `min(50 + scoreDiff * 3, 95)` (single vendor defaults to 75)
- Gemini-enhanced: richer reasoning, contextual negotiation tips, risk assessment
- Falls back to template-based reasoning (port of Go logic) if Gemini call fails

### `functions/src/callables/analyzeEvaluation.ts`
- Callable function: validates auth/ownership, sets status to `'analyzing'`, returns immediately
- The actual processing happens in the background trigger (below)

### `functions/src/triggers/onAnalysisStart.ts`
- Firestore `onUpdate` trigger on `evaluations/{evalId}`
- Fires when status changes to `'analyzing'`
- Configured with `timeoutSeconds: 540, memory: '1GB'` (9-minute max for multi-vendor analysis)
- Pipeline:
  1. Read all vendors from subcollection
  2. For each vendor in parallel (`Promise.all`): Gemini extract -> score -> write results to vendor doc
  3. After all vendors: generate recommendation -> write to recommendations subcollection
  4. Set status `'completed'`, winnerVendorId, completedAt
  5. **On failure:** set status `'failed'`, preserve partial vendor results. On retry, skip vendors that already have scores.

**Modify:**
- `functions/src/index.ts` — export `analyzeEvaluation` callable + `onAnalysisStart` trigger
- `frontend/src/api/firebase-client.js` — implement `analyzeEvaluation(id)` calling the callable

**Verify:** Create evaluation with demo data -> analyze -> vendor docs have scores + redFlags -> recommendation doc exists -> status is `'completed'`. Test failure: interrupt mid-analysis, verify partial results preserved, retry completes remaining vendors.

---

## Phase 4: Chat + Report

**Create:**
- `functions/src/callables/chat.ts` — callable: load evaluation context (vendors with scores, recommendation), build Gemini system prompt with full eval context, load last 20 chat messages for conversation history, call Gemini, store both user message and assistant response in chatMessages subcollection, return response
- `functions/src/analysis/chatFallback.ts` — port of Go keyword-matching `generateChatResponse` as fallback if Gemini fails. 10 keyword branches (compare, redFlag, cost, sla, recommend, negotiate, score, strength, weakness, summary) implemented as a dispatch map.

**Modify:**
- `functions/src/index.ts` — export `chat` callable
- `frontend/src/api/firebase-client.js` — implement `chatMessage(id, message)` and `getReport(id)`
- `frontend/src/components/ChatInterface.jsx` — import from `firebase-client`

**Verify:** On a completed evaluation, use AI Chat tab. Quick actions and free-form questions work. Chat messages stored in Firestore.

---

## Phase 5: Real-time Analysis UX + Cleanup

The current `UploadPage` blocks on a synchronous API call during analysis. In the Firebase version, `analyzeEvaluation` returns immediately and the frontend must listen for Firestore status changes.

**Modify:**
- `frontend/src/components/UploadPage.jsx` — rewrite `handleAnalyze`: after calling `analyzeEvaluation` (returns immediately), use `onEvaluationStatusChange(evalId, callback)` Firestore real-time listener to update the analysis overlay progressively. On `'completed'` -> navigate to results. On `'failed'` -> show error with retry option.
- `frontend/src/components/AnalysisPage.jsx` — if evaluation status is `'analyzing'`, show progress indicator. Use `onSnapshot` on vendors subcollection for progressive vendor loading as each vendor completes.
- `frontend/vite.config.js` — remove `/api` proxy config (no backend to proxy to)
- Delete `frontend/src/api/client.js` + remove `axios` from `frontend/package.json`

**Verify:** Full end-to-end: register -> create evaluation -> upload -> analyze (watch progressive overlay) -> view all result tabs -> chat -> export report. No console errors. No axios references.

---

## Phase 6: Deploy + Cleanup

**Modify:**
- `CLAUDE.md` — rewrite for Firebase architecture
- `README.md` — update quick start, tech stack, architecture
- `.gitignore` — add `functions/lib/`, `.firebase/`, `frontend/.env.local`

**Delete:**
- `backend/` (entire Go backend)
- `docker-compose.yml`, `Makefile`
- `frontend/Dockerfile`, `backend/Dockerfile`
- `data/seed.sql`
- `n8n/` directory
- `.env.example`, root `package.json` + `package-lock.json`

**Deploy:**
```bash
cd functions && npm run build
cd ../frontend && npm run build
firebase deploy
```

**Verify:** Full user flow on production Firebase URL. Firestore security rules block cross-user access via REST API.

---

## Dependency Graph

```
Phase 0: Firebase Setup
    │
Phase 1: Auth Migration
    │
Phase 2: Firestore Data Layer + CRUD Functions
    │
Phase 3: Analysis Engine (Gemini + Scoring)
    │
Phase 4: Chat + Report Functions
    │
Phase 5: Frontend Real-time Updates + Cleanup
    │
Phase 6: Deploy + Remove Docker
```

Each phase produces a working (if incomplete) application. After Phase 2, users can register, create evaluations, and upload vendors. After Phase 3, the full analysis pipeline works. Phase 4 adds chat and reports. Phase 5 polishes the real-time UX. Phase 6 deploys and cleans up.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Scoring formula parity** | Wrong scores if TypeScript port diverges from Go | Unit test against demo vendor data (TechSolutions India + CloudForce Systems); compare all 6 scores per vendor against known Go output |
| **Gemini extraction quality** | Different field values than regex engine | JSON mode enforces structure; scoring is deterministic on extracted values. Test against demo proposals with known expected values. |
| **Analysis timeout** | Firebase Functions 9-min max; 5+ sequential Gemini calls | Process vendors in parallel with `Promise.all`. Each Gemini call completes in 5-15s. |
| **Cold start latency** | First chat/report request slow after idle | Typing indicator provides UX feedback. Consider `minInstances: 1` for production. |
| **Partial analysis failure** | Gemini rate limit or timeout mid-analysis | Async pattern preserves completed vendor results. Retry skips already-processed vendors. |
| **Frontend field name mapping** | Firestore camelCase vs component snake_case | `firebase-client.js` maps fields; presentational components unchanged. |

---

## Open Questions for Team Review

1. **Gemini model selection** — Gemini 2.5 Flash (cheaper, faster) for extraction vs. Gemini 2.5 Pro (more capable) for recommendation/chat? Or Flash for everything?
2. **Rate limiting** — Should we add per-user daily evaluation caps to control Gemini API costs? If so, what limit?
3. **Firebase project** — Which GCP project/Firebase project should this deploy to?
