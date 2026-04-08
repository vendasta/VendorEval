#!/bin/bash
# Generate voiceover audio segments using macOS TTS
# Voice: Rishi (Indian English) — professional and clear

OUTDIR="/Users/vgopiraja/Downloads/Vendor/submission/voiceover"
mkdir -p "$OUTDIR"
VOICE="Rishi"
RATE=175

echo "Generating voiceover segments..."

# Segment 1: Intro
echo "Segment 1: Intro..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/01_intro.aiff" "Welcome to Vendor Eval AI — an intelligent vendor proposal evaluation tool that helps procurement managers analyze multiple vendor proposals in minutes, not weeks. Today, I'll walk you through a complete end-to-end demo — from uploading vendor proposals to getting an AI-powered recommendation."

# Segment 2: Login
echo "Segment 2: Login..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/02_login.aiff" "Let's start by logging in. We have a one-click demo mode — just click Try Demo and we're in."

# Segment 3: Dashboard
echo "Segment 3: Dashboard..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/03_dashboard.aiff" "This is the main dashboard. Here you can see all your vendor evaluations at a glance — their status, how many vendors were analyzed, and the overall result. Let's create a new evaluation."

# Segment 4: Create evaluation
echo "Segment 4: Create evaluation..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/04_create.aiff" "I'll click New Evaluation and set up our procurement scenario. We're selecting a Cloud Infrastructure vendor for Q2 2026. For requirements, I'll specify: 99.9 percent uptime, 24x7 support, budget under 20 lakh I.N.R. for Year 1, dedicated team, no auto-renewal clauses, and 2-hour priority-1 response time. These requirements will be used by the AI engine to score each vendor against what actually matters to us."

# Segment 5: Upload vendors
echo "Segment 5: Upload vendors..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/05_upload.aiff" "Now I'll upload two vendor proposals. First, Tech Solutions India — they're proposing 22.9 lakh I.N.R. for Year 1 with a 10-week timeline. Second, Cloud Force Systems — proposing 18.2 lakh I.N.R. with the same timeline but stronger SLA commitments. Notice how we simply paste the proposal text — the AI engine does all the heavy lifting of extracting structured data from unstructured text."

# Segment 6: Analysis
echo "Segment 6: Analysis..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/06_analysis.aiff" "Now the magic happens. I'll click Analyze and the built-in AI engine processes both proposals simultaneously. It performs three operations: First, data extraction — parsing costs, timelines, SLAs, and contract terms from raw text using natural language processing. Second, risk detection — scanning for red flags like auto-renewal traps, price escalation clauses, and limited liability terms. Third, scoring — evaluating each vendor on cost, quality, timeline, risk, and SLA, weighted according to our requirements. And it's done — in seconds, not weeks."

# Segment 7: Comparison
echo "Segment 7: Comparison..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/07_comparison.aiff" "The Comparison Matrix gives us a side-by-side view. Cloud Force scores 72.4 overall versus Tech Solutions at 50.6. The bar chart visualizes the score breakdown — you can see Cloud Force wins on cost, SLA, and risk. Tech Solutions actually scored well on timeline but their price escalation clause and auto-renewal trap pulled their risk score down significantly."

# Segment 8: Red flags
echo "Segment 8: Red flags..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/08_redflags.aiff" "The Red Flags panel is where Vendor Eval really saves procurement teams from costly mistakes. Tech Solutions has 6 red flags — including a critical auto-renewal clause that locks you in, a 15 percent annual price escalation, and limited liability for data loss. These are the kinds of hidden traps that cost companies lakhs. Cloud Force has only 3 flags, all medium severity — much cleaner terms."

# Segment 9: Recommendation
echo "Segment 9: Recommendation..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/09_recommendation.aiff" "The AI recommends Cloud Force Systems with 95 percent confidence. The reasoning is clear — lower cost, better SLA, fewer red flags, and no escalation clauses. It also provides negotiation tips — like requesting a 10 to 15 percent discount and using Tech Solutions bid as leverage."

# Segment 10: Chat
echo "Segment 10: Chat..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/10_chat.aiff" "The built-in chat lets you ask follow-up questions about the evaluation. I'll ask: Compare both vendors. The system responds with a structured comparison including scores, costs, and key differences — all drawn from the actual analysis data. This is like having a procurement advisor available 24/7."

# Segment 11: AI explanation
echo "Segment 11: AI explanation..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/11_ai_explanation.aiff" "Let me explain how AI powers Vendor Eval under the hood. The backend uses an intelligent NLP engine built in Go that processes vendor proposals through three AI-driven stages. Stage 1 — Extraction: Advanced regex patterns and natural language processing parse unstructured proposal text to extract structured data — costs in Indian Rupee format, SLA percentages, timeline commitments, and contract terms. Stage 2 — Risk Intelligence: A pattern-matching engine scans for 8 categories of contractual red flags, including auto-renewal traps, price escalation clauses, limited liability, and vendor lock-in indicators. Each flag is classified by severity. Stage 3 — Smart Scoring: A weighted scoring algorithm evaluates vendors across 5 dimensions — cost at 25 percent, quality at 30 percent, timeline at 15 percent, risk at 15 percent, and SLA at 15 percent."

# Segment 12: AI development + closing
echo "Segment 12: Closing..."
say -v "$VOICE" -r $RATE -o "$OUTDIR/12_closing.aiff" "The entire system is self-contained — no external API keys needed. Claude AI assisted in the complete development — from architecture design to code generation to testing. This tool transforms what traditionally takes 2 to 3 weeks of manual analysis into a 10-minute automated workflow — saving procurement teams significant time, effort, and most importantly, money by catching hidden contract risks. That's Vendor Eval AI — Upload, Analyze, Decide. In 10 minutes. Thank you for watching."

echo ""
echo "Converting to M4A format..."
# Convert AIFF to M4A (smaller, higher quality)
for f in "$OUTDIR"/*.aiff; do
    base=$(basename "$f" .aiff)
    afconvert -f m4af -d aac -b 128000 "$f" "$OUTDIR/${base}.m4a" 2>/dev/null
    echo "  Converted: ${base}.m4a"
done

# Also create a combined full voiceover
echo ""
echo "Creating combined voiceover..."
# Concatenate all AIFF files
cd "$OUTDIR"
AIFF_FILES=$(ls -1 *.aiff | sort)

# Create a file list for sox or just use cat for AIFF
# Use afconvert to combine - first concat AIFFs
cat $AIFF_FILES > combined_temp.aiff 2>/dev/null
afconvert -f m4af -d aac -b 128000 combined_temp.aiff full_voiceover.m4a 2>/dev/null
rm -f combined_temp.aiff

echo ""
echo "All voiceover segments saved to: $OUTDIR"
ls -la "$OUTDIR"/*.m4a 2>/dev/null
echo ""
echo "Done! Total segments: $(ls -1 "$OUTDIR"/*.m4a 2>/dev/null | wc -l)"
