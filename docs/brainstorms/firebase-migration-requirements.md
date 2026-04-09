# Firebase Migration Requirements

**Date:** 2026-04-09
**Status:** Draft
**Scope:** Deep — full stack migration

---

## Problem

The current VendorEval AI stack (Go backend, PostgreSQL, Docker Compose with 4 containers) requires container management, database administration, and Docker infrastructure just to develop and deploy. This adds operational overhead disproportionate to the application's complexity. The team prefers Firebase as a deployment platform for its simplicity.

## Goal

Migrate VendorEval AI from Go + PostgreSQL + Docker Compose to Firebase (Firestore, Firebase Functions, Firebase Hosting, Firebase Auth) while upgrading the analysis engine from rule-based regex extraction to LLM-powered analysis.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend runtime | Firebase Functions (TypeScript) | Shares language with React frontend, strong Firestore SDK, serverless |
| Database | Firestore | Serverless document DB, no schema migrations, Firebase-native |
| Hosting | Firebase Hosting | Static SPA hosting with CDN, zero config |
| Authentication | Firebase Auth | Built-in email/password, replaces custom JWT, integrates with security rules |
| Analysis engine | Hybrid: Gemini extracts, formula scores | Gemini handles unstructured text extraction; existing weighted formula provides deterministic, explainable scoring |
| Structured output | Gemini JSON mode | Guarantees parseable extraction responses, eliminates brittle freeform parsing |
| Demo mode | Removed | Users must register; simplifies auth flow |
| Workflow automation | Drop n8n | Firebase Functions + Firestore triggers replace it natively |
| Frontend framework | Keep React 18 + Vite | Works as-is, deploys to Firebase Hosting as a static build |

## Scope

### In Scope

1. **Firebase Auth** — Replace custom JWT auth with Firebase Auth email/password. Remove demo login flow, bcrypt password handling, custom token generation, and JWT middleware. Users must register or sign in.

2. **Firestore data model** — Migrate the 6 PostgreSQL tables to Firestore collections. The relational model (evaluations -> vendors -> red_flags) maps to a nested collection structure. Key design decisions:
   - `users/{uid}` — User profiles (synced from Firebase Auth)
   - `evaluations/{evalId}` — Evaluation documents owned by a user
   - `evaluations/{evalId}/vendors/{vendorId}` — Vendor proposals as subcollection
   - `evaluations/{evalId}/recommendations/{recId}` — Recommendation per evaluation
   - `evaluations/{evalId}/chatMessages/{msgId}` — Chat history as subcollection
   - Red flags stored as an array field on vendor documents (not a separate collection) since they're always read with the vendor

3. **Firebase Functions (TypeScript)** — Rewrite all backend API endpoints as callable or HTTP functions:
   - Auth: handled by Firebase Auth (no custom endpoints needed)
   - `createEvaluation` — Create evaluation document
   - `uploadVendor` — Add vendor proposal to evaluation subcollection
   - `analyzeEvaluation` — Orchestrate LLM extraction, scoring, and recommendation
   - Comparison and recommendation data are read directly from Firestore by the client (secured by rules), not via Cloud Functions — avoids unnecessary cold-start overhead for read-only queries
   - `generateReport` — Build HTML report from evaluation data
   - `chat` — LLM-powered chat about evaluation results

4. **Hybrid analysis engine (Gemini extraction + deterministic scoring)** — Replace the rule-based regex engine with a two-stage pipeline:
   - **Stage 1 — Extraction (Gemini)**: Send each vendor's proposal text to Gemini using JSON mode (structured output). The prompt requests a typed JSON object with fields: total_cost, currency, timeline_weeks, payment_terms, sla_uptime, sla_response_time, support_type, warranty_months, strengths[], weaknesses[], red_flags[], hidden_costs[]. JSON mode guarantees parseable responses — a malformed response is a parse error, not a fuzzy-text problem.
   - **Stage 2 — Scoring (deterministic formula)**: Apply the existing weighted formula to Gemini-extracted data: Cost 25%, SLA 25%, Timeline 20%, Quality 15%, Risk 15%. Same scoring logic as the current Go backend, ported to TypeScript. Scoring is explainable and reproducible.
   - **Recommendation**: Gemini generates reasoning, negotiation tips, and risk assessment given all scored vendor data and the requirements.
   - **Chat**: Replace keyword-matching chat with Gemini conversation that has full context of the evaluation.
   - **Async pattern**: `analyzeEvaluation` must handle 5+ sequential Gemini calls (one per vendor + recommendation). To avoid Firebase Functions' 60s default timeout: the callable function sets evaluation status to `"analyzing"`, kicks off extraction as a background task (via Cloud Tasks or a Firestore-triggered function), and returns immediately. The client polls evaluation status. Each vendor extraction writes results to Firestore as it completes. After all vendors are extracted and scored, a final function generates the recommendation and sets status to `"completed"`. On any Gemini failure, set status to `"failed"` with an error message; partial vendor results already written to Firestore are preserved so the user can retry.
   - **Error handling**: If Gemini returns a rate-limit error, network timeout, or malformed JSON mid-analysis (e.g., after 2 of 4 vendors), the evaluation status is set to `"failed"`. Vendors already extracted and scored are preserved in Firestore. The user can retry the analysis, which re-processes only vendors without results.

5. **Frontend updates** — Modify the React app to use Firebase SDK instead of the Axios API client. Five components contain data-fetching and auth logic that must be updated (not just `api/client.js`):
   - **`api/client.js`**: Replace entirely — remove Axios instance, JWT interceptor. Replace with Firebase SDK helpers (Firestore queries + callable Functions).
   - **`LoginPage.jsx`**: Replace `login()`, `register()`, `demoLogin()` calls with Firebase Auth SDK (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`). Remove demo login button and flow.
   - **`App.jsx`**: Replace localStorage token management with Firebase Auth state observer (`onAuthStateChanged`). AuthContext provides Firebase user object instead of custom token/user.
   - **`Dashboard.jsx`**: Replace `getEvaluations()` API call with Firestore query (`collection('evaluations').where('userId', '==', uid)`).
   - **`AnalysisPage.jsx`**: Replace `getEvaluation()`, `getComparison()`, `getRecommendation()`, `getVendors()` API calls with Firestore document/subcollection reads. Add real-time listener for evaluation status (to show analysis progress).
   - **`UploadPage.jsx`**: Replace `createEvaluation()`, `uploadVendor()`, `analyzeEvaluation()` API calls with callable Functions. Update analysis overlay to poll evaluation status from Firestore instead of awaiting a single API response.
   - **`ChatInterface.jsx`**: Replace `chatMessage()` API call with callable Function. Replace `localStorage.getItem('vendoreval_user')` (line 29) with Firebase Auth `currentUser`.
   - **Presentational components** (ComparisonMatrix, RedFlagPanel, RecommendationPanel, ReportExport, Layout, NotFound) receive data as props and need no structural changes.

6. **Firebase Hosting** — Deploy the Vite production build (`npm run build`) as a static site. Configure rewrites to serve `index.html` for all routes (SPA).

7. **Firestore Security Rules** — Users can only read/write their own evaluations. Subcollections inherit parent evaluation ownership.

### Out of Scope

- Migrating existing PostgreSQL data to Firestore (fresh start)
- Changing the UI design or component structure
- Adding new features beyond the current feature set
- Multi-tenant or team/organization support
- File storage (proposals are still text-extracted client-side and sent as strings)
- Offline support or Firestore persistence

## Non-Goals

- Maintaining backward compatibility with the Go/PostgreSQL stack
- Supporting both deployment targets simultaneously
- Preserving the n8n workflow automation

## Success Criteria

1. `firebase deploy` starts the entire application (no Docker, no containers)
2. All current user flows work: register, login, demo, create evaluation, upload vendors, analyze, view results (overview/comparison/red flags/chat), export report
3. Analysis produces higher-quality extraction and scoring than the regex engine on unstructured proposals
4. Local development requires only `firebase emulators:start` (or Functions + Hosting emulators)
5. No custom auth token management — Firebase Auth handles sessions end-to-end

## Open Questions

1. **Gemini model selection** — Which Gemini model to use for extraction and chat? Gemini 2.5 Flash for cost efficiency vs. Gemini 2.5 Pro for quality? Could use Flash for extraction (high volume, structured output) and Pro for recommendation/chat (lower volume, nuanced reasoning).
2. **Rate limiting / cost control** — Gemini API calls cost money per evaluation (5+ calls per analysis). Options: per-user daily evaluation cap, require Blaze plan billing, or accept unbounded cost initially and add limits if needed.

## Risks

- **Firestore data modeling** — The current relational schema with foreign keys maps naturally to subcollections, but queries across evaluations (e.g., "all vendors with critical red flags") become harder without relational joins. This is acceptable since the app always queries within a single evaluation.
- **LLM latency** — Gemini calls for extraction + scoring + recommendation will likely be slower than the current in-process regex engine. The analysis step may take 30-60 seconds instead of 10-20. Mitigated by the async pattern: the client sees progressive status updates as each vendor is processed.
- **LLM cost** — Each evaluation with 4 vendors could consume significant tokens. Extraction prompts with full proposal text are large. Mitigated partially by using JSON mode (smaller, more focused responses) and potentially using Flash for extraction.
- **Cold starts** — Firebase Functions have cold start latency. The first request after idle may be slow. Mitigated for the analysis path by the async pattern (user isn't waiting on a single HTTP response). For other callable functions (chat, report), cold starts of 1-3s are acceptable.
- **Partial analysis failure** — If Gemini fails mid-analysis (after some vendors processed), the async pattern preserves partial results and allows retry. The retry logic must detect which vendors already have results and skip them.
