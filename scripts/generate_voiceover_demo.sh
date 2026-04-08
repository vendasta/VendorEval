#!/bin/bash
# Generate voiceover using macOS 'say' command and merge with timing

set -e
cd "$(dirname "$0")/.."

AUDIO_DIR="demo_audio"
OUTPUT="demo_voiceover.m4a"
VOICE="Reed (English (US))"  # High quality macOS voice

mkdir -p "$AUDIO_DIR"

echo "Generating voiceover segments..."

# Each segment: filename, start_seconds, text
generate() {
  local id="$1"
  local text="$2"
  echo "  Generating: $id"
  say -v "$VOICE" -r 170 -o "$AUDIO_DIR/${id}.aiff" "$text"
  # Convert to m4a
  ffmpeg -y -i "$AUDIO_DIR/${id}.aiff" -c:a aac -b:a 128k "$AUDIO_DIR/${id}.m4a" 2>/dev/null
  rm "$AUDIO_DIR/${id}.aiff"
}

generate "s01" "Welcome to VendorEval AI. Let's walk through a live evaluation of two IT security vendors. We'll start by logging in with the demo account."
generate "s02" "This is the dashboard. It shows all your evaluations at a glance, with stats for completed, in progress, and failed evaluations. Let's create a new one."
generate "s03" "Step one. Define your requirements. We'll enter the evaluation title and paste the RFP requirements for an enterprise IT security and SOC engagement."
generate "s04" "We've entered the evaluation title."
generate "s05" "The requirements document covers must-haves like twenty four seven SOC monitoring, SIEM, endpoint protection for twenty five hundred endpoints, and a budget of one point five crore."
generate "s06" "Step two. Add vendor proposals. You can upload PDF, DOCX, or TXT files, or paste the proposal text directly."
generate "s07" "Vendor one is CyberShield India, offering a full twenty four seven dedicated SOC with CrowdStrike EDR and Microsoft Sentinel SIEM."
generate "s08" "Vendor two is SecureNet Solutions, offering a sixteen by five hybrid SOC model with SentinelOne and Splunk."
generate "s09" "Step three. Review. We can see both vendors are loaded and ready. Let's start the AI analysis."
generate "s10" "The AI is now extracting data, scoring each vendor, detecting red flags, and generating the recommendation."
generate "s11" "Here are the results. CyberShield India is the recommended vendor with a high overall score and strong confidence rating."
generate "s12" "The score cards show each vendor's overall score with a visual gauge, along with dimension level bars for cost, timeline, quality, risk, and SLA."
generate "s13" "The radar chart provides a multi-dimensional comparison. Notice how CyberShield dominates on quality, SLA, and risk."
generate "s14" "Below we have the detailed recommendation with the AI's reasoning explaining exactly why CyberShield was selected."
generate "s15" "The platform also generates specific negotiation tips, like asking for volume discounts or timeline guarantees."
generate "s16" "The comparison tab shows a detailed side-by-side matrix. Green cells highlight the best value, red cells flag the worst. CyberShield leads on nearly every dimension."
generate "s17" "The bar chart gives a clear visual summary of the overall scores."
generate "s18" "The red flags tab is critical for contract managers. It shows total flags detected, filtered by severity. SecureNet has significantly more contract risks."
generate "s19" "Click any flag to expand it and see the exact clause text from the proposal. This makes it easy to discuss specific concerns with the vendor."
generate "s20" "Multiple red flags are detected. From price escalation clauses to early termination penalties and limited liability caps."
generate "s21" "The AI chat lets you ask natural language questions about the evaluation. Let's ask why CyberShield was recommended."
generate "s22" "Typing our question."
generate "s23" "The AI provides a detailed, context-aware answer, comparing both vendors across dimensions and highlighting the key differentiators."
generate "s24" "Finally, the export report generates a professional PDF-ready document with executive summary, comparisons, red flags, and negotiation tips."
generate "s25" "The report includes all the data your team needs to make a confident, well-informed vendor decision."
generate "s26" "That's VendorEval AI. Upload, analyze, and decide. In minutes, not weeks."

echo ""
echo "Merging segments with timing..."

# Build a concat file with silence gaps matching the video timing
# Timings (start seconds): 0, 4, 8, 11, 13, 17, 20, 23, 26, 30, 33, 38, 42, 46, 50, 53, 58, 61, 65, 69, 72, 75, 77, 82, 86, 89
STARTS=(0 4 8 11 13 17 20 23 26 30 33 38 42 46 50 53 58 61 65 69 72 75 77 82 86 89)
SEGMENTS=(s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24 s25 s26)

# Generate silence files and build filter
INPUT_ARGS=""
FILTER=""
LABELS=""
idx=0
prev_end=0

for i in "${!SEGMENTS[@]}"; do
  seg="${SEGMENTS[$i]}"
  start="${STARTS[$i]}"

  # Calculate gap before this segment
  gap=$((start - prev_end))

  if [ "$gap" -gt 0 ]; then
    # Add silence input
    INPUT_ARGS="$INPUT_ARGS -f lavfi -t $gap -i anullsrc=r=44100:cl=mono"
    LABELS="${LABELS}[$idx]"
    idx=$((idx + 1))
  fi

  # Add segment
  INPUT_ARGS="$INPUT_ARGS -i $AUDIO_DIR/${seg}.m4a"
  LABELS="${LABELS}[$idx]"
  idx=$((idx + 1))

  # Get duration of this segment
  dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/${seg}.m4a" 2>/dev/null)
  dur_int=$(echo "$dur" | awk '{printf "%d", $1 + 0.5}')
  prev_end=$((start + dur_int))
done

# Concat all
FILTER="${LABELS}concat=n=$idx:v=0:a=1[out]"
eval ffmpeg -y $INPUT_ARGS -filter_complex "$FILTER" -map "[out]" -c:a aac -b:a 128k "$OUTPUT" 2>/dev/null

echo "Voiceover saved: $OUTPUT"

# Cleanup
rm -rf "$AUDIO_DIR"
echo "Done!"
