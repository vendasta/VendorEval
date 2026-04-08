#!/usr/bin/env python3
"""Clone voice from GopiVoice.mpeg and generate voiceover using ElevenLabs."""
import os
import subprocess
from elevenlabs.client import ElevenLabs

API_KEY = os.environ.get("ELEVENLABS_API_KEY", "sk_0a25f1fcc46d91df3012f84248a1d494c19fc288605f6711")
VOICE_FILE = os.path.join(os.path.dirname(__file__), "..", "GopiVoice.mpeg")
OUTDIR = os.path.join(os.path.dirname(__file__), "..", "submission", "voiceover_cloned")
os.makedirs(OUTDIR, exist_ok=True)

client = ElevenLabs(api_key=API_KEY)

# Step 1: Clone voice using Instant Voice Cloning
print("Step 1: Cloning your voice from GopiVoice.mpeg...")
with open(VOICE_FILE, "rb") as f:
    voice = client.voices.ivc.create(
        name="Gopi Voice",
        description="Cloned voice for VendorEval AI demo voiceover",
        files=[f],
    )
print(f"  Voice cloned! ID: {voice.voice_id}")

# Step 2: Generate voiceover segments
segments = [
    ("01_intro", "Welcome to VendorEval AI — an intelligent vendor proposal evaluation tool that helps procurement managers analyze multiple vendor proposals in minutes, not weeks. Today, I'll walk you through a complete end-to-end demo — from uploading vendor proposals to getting an AI-powered recommendation."),

    ("02_login", "Let's start by logging in. We have a one-click demo mode — just click Try Demo and we're in."),

    ("03_dashboard", "This is the main dashboard. Here you can see all your vendor evaluations at a glance — their status, how many vendors were analyzed, and the overall result. Let's create a new evaluation."),

    ("04_create", "I'll click New Evaluation and set up our procurement scenario. We're selecting a Cloud Infrastructure vendor for Q2 2026. For requirements, I'll specify: 99.9 percent uptime, 24 by 7 support, budget under 20 lakh INR for Year 1, dedicated team, no auto-renewal clauses, and 2-hour priority-1 response time. These requirements will be used by the AI engine to score each vendor against what actually matters to us."),

    ("05_upload", "Now I'll upload two vendor proposals. First, TechSolutions India — they're proposing 22.9 lakh INR for Year 1 with a 10-week timeline. Second, CloudForce Systems — proposing 18.2 lakh INR with the same timeline but stronger SLA commitments. Notice how we simply paste the proposal text — the AI engine does all the heavy lifting of extracting structured data from unstructured text."),

    ("06_analysis", "Now the magic happens. I'll click Analyze and the built-in AI engine processes both proposals simultaneously. It performs three operations. First, data extraction — parsing costs, timelines, SLAs, and contract terms from raw text using natural language processing. Second, risk detection — scanning for red flags like auto-renewal traps, price escalation clauses, and limited liability terms. Third, scoring — evaluating each vendor on cost, quality, timeline, risk, and SLA, weighted according to our requirements. And it's done — in seconds, not weeks."),

    ("07_comparison", "The Comparison Matrix gives us a side-by-side view. CloudForce scores 72.4 overall versus TechSolutions at 50.6. The bar chart visualizes the score breakdown — you can see CloudForce wins on cost, SLA, and risk. TechSolutions actually scored well on timeline but their price escalation clause and auto-renewal trap pulled their risk score down significantly."),

    ("08_redflags", "The Red Flags panel is where VendorEval really saves procurement teams from costly mistakes. TechSolutions has 6 red flags — including a critical auto-renewal clause that locks you in, a 15 percent annual price escalation, and limited liability for data loss. These are the kinds of hidden traps that cost companies lakhs. CloudForce has only 3 flags, all medium severity — much cleaner terms."),

    ("09_recommendation", "The AI recommends CloudForce Systems with 95 percent confidence. The reasoning is clear — lower cost, better SLA, fewer red flags, and no escalation clauses. It also provides negotiation tips — like requesting a 10 to 15 percent discount and using TechSolutions' bid as leverage."),

    ("10_chat", "The built-in chat lets you ask follow-up questions about the evaluation. I'll ask: Compare both vendors. The system responds with a structured comparison including scores, costs, and key differences — all drawn from the actual analysis data. This is like having a procurement advisor available 24 by 7."),

    ("11_ai_explanation", "Let me explain how AI powers VendorEval under the hood. The backend uses an intelligent NLP engine built in Go that processes vendor proposals through three AI-driven stages. Stage 1 — Extraction: Advanced regex patterns and natural language processing parse unstructured proposal text to extract structured data — costs in Indian Rupee format, SLA percentages, timeline commitments, and contract terms. Stage 2 — Risk Intelligence: A pattern-matching engine scans for 8 categories of contractual red flags, including auto-renewal traps, price escalation clauses, limited liability, and vendor lock-in indicators. Each flag is classified by severity — critical, high, medium, or low. Stage 3 — Smart Scoring: A weighted scoring algorithm evaluates vendors across 5 dimensions — cost at 25 percent, quality at 30 percent, timeline at 15 percent, risk at 15 percent, and SLA at 15 percent. The weights reflect real procurement priorities."),

    ("12_closing", "The entire system is self-contained — no external API keys needed. Claude AI assisted in the complete development — from architecture design to code generation to testing. This tool transforms what traditionally takes 2 to 3 weeks of manual analysis into a 10-minute automated workflow — saving procurement teams significant time, effort, and most importantly, money by catching hidden contract risks. That's VendorEval AI — Upload, Analyze, Decide. In 10 minutes. Thank you for watching."),
]

print("\nStep 2: Generating voiceover segments in your voice...")
for name, text in segments:
    print(f"  Generating {name}...")
    audio = client.generate(
        text=text,
        voice=voice,
        model="eleven_multilingual_v2",
    )
    outfile = os.path.join(OUTDIR, f"{name}.mp3")
    with open(outfile, "wb") as f:
        for chunk in audio:
            f.write(chunk)
    print(f"    Saved: {name}.mp3")

# Step 3: Combine all segments
print("\nStep 3: Combining into full voiceover...")
files = sorted([f for f in os.listdir(OUTDIR) if f.endswith('.mp3') and not f.startswith('full')])
concat_list = os.path.join(OUTDIR, "concat.txt")
with open(concat_list, 'w') as f:
    for fn in files:
        f.write(f"file '{fn}'\n")

subprocess.run([
    'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
    '-i', concat_list,
    '-c:a', 'libmp3lame', '-b:a', '192k',
    os.path.join(OUTDIR, 'full_voiceover.mp3')
], cwd=OUTDIR, capture_output=True)

os.remove(concat_list)

# Show durations
print("\nDurations:")
for fn in files + ['full_voiceover.mp3']:
    fpath = os.path.join(OUTDIR, fn)
    result = subprocess.run(['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', fpath], capture_output=True, text=True)
    dur = float(result.stdout.strip()) if result.stdout.strip() else 0
    print(f"  {fn}: {dur:.1f}s ({dur/60:.1f}min)")

print(f"\nDone! Your voice cloned voiceover is at: submission/voiceover_cloned/full_voiceover.mp3")
