#!/bin/bash
# V3: Fix low volume + overlapping by trimming each segment to its slot and concatenating with silence
set -e
cd "$(dirname "$0")/.."

AUDIO_DIR="demo_audio"
FINAL_AUDIO="demo_voiceover.m4a"
VOICE="Reed (English (US))"
RATE=180
VIDEO_DURATION=109

mkdir -p "$AUDIO_DIR"
echo "=== Generating voiceover V3 (no overlap, proper volume) ==="

gen() {
  local id="$1" text="$2"
  echo "  TTS: $id"
  say -v "$VOICE" -r $RATE -o "$AUDIO_DIR/${id}.aiff" "$text"
  # Convert to 44.1kHz stereo AAC with volume boost
  ffmpeg -y -i "$AUDIO_DIR/${id}.aiff" -ar 44100 -ac 2 -c:a aac -b:a 192k -af "volume=1.8" "$AUDIO_DIR/${id}.m4a" 2>/dev/null
  rm "$AUDIO_DIR/${id}.aiff"
}

# Generate all segments
gen "s01" "Welcome to VendorEval AI. Lets walk through a live evaluation of two IT security vendors."
gen "s02" "This is the dashboard showing all evaluations with stats. Lets create a new one."
gen "s03" "Step one, define your requirements."
gen "s04" "We enter the title and paste the RFP requirements."
gen "s05" "The requirements cover twenty four seven SOC monitoring, SIEM, endpoint protection, and a budget of one point five crore."
gen "s06" "Step two, add vendor proposals. Upload PDF, DOCX, or paste text."
gen "s07" "Vendor one is CyberShield India, a dedicated twenty four seven SOC with CrowdStrike and Sentinel."
gen "s08" "Vendor two is SecureNet Solutions, a sixteen by five hybrid SOC with SentinelOne and Splunk."
gen "s09" "Step three, review. Both vendors loaded. Lets start the AI analysis."
gen "s10" "The AI extracts data, scores vendors, detects red flags, and generates the recommendation."
gen "s11" "CyberShield India is recommended with a score of eighty four point two and ninety five percent confidence."
gen "s12" "Score cards show overall scores with gauges and dimension bars for cost, timeline, quality, risk, and SLA."
gen "s13" "The radar chart shows CyberShield dominates on quality, SLA, and risk."
gen "s14" "The recommendation explains why CyberShield was selected."
gen "s15" "Negotiation tips and risks help your team prepare for vendor discussions."
gen "s16" "The comparison matrix shows green for best, red for worst. CyberShield leads on nearly every metric."
gen "s17" "The bar chart gives a clear visual of overall scores."
gen "s18" "Red flags show SecureNet has significantly more contract risks."
gen "s19" "Click any flag to see the exact clause. Price escalation, termination penalties, limited liability."
gen "s20" "The AI chat answers natural language questions about the evaluation."
gen "s21" "Lets ask why CyberShield was recommended."
gen "s22" "A detailed answer comparing both vendors and highlighting key differentiators."
gen "s23" "Export generates a professional report ready for stakeholders."
gen "s24" "Vendor comparison, scores, red flags, negotiation tips, everything your team needs."
gen "s25" "That's VendorEval AI. Upload, analyze, decide. In minutes, not weeks."

echo ""
echo "=== Building timeline (trim + pad + concat) ==="

# Scene start times (seconds) - must match video exactly
SEGS=(s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24 s25)
STARTS=(0 4 9 12 15 20 23 27 31 36 40 46 51 56 60 64 70 73 78 83 87 90 97 102 106)

# For each segment: trim to fit its time slot, then pad with silence to fill the slot exactly
CONCAT_LIST="$AUDIO_DIR/concat.txt"
> "$CONCAT_LIST"

for i in "${!SEGS[@]}"; do
  seg="${SEGS[$i]}"
  start="${STARTS[$i]}"

  # Calculate slot duration (time until next segment starts, or until video end)
  if [ $((i + 1)) -lt ${#STARTS[@]} ]; then
    next_start="${STARTS[$((i + 1))]}"
  else
    next_start=$VIDEO_DURATION
  fi
  slot_duration=$((next_start - start))

  # Get actual segment duration
  actual_dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/${seg}.m4a" 2>/dev/null)

  # Trim to slot duration and pad to exactly fill the slot
  ffmpeg -y -i "$AUDIO_DIR/${seg}.m4a" \
    -af "atrim=0:${slot_duration},apad=whole_dur=${slot_duration}" \
    -ar 44100 -ac 2 -c:a aac -b:a 192k -t "${slot_duration}" \
    "$AUDIO_DIR/${seg}_padded.m4a" 2>/dev/null

  echo "file '${seg}_padded.m4a'" >> "$CONCAT_LIST"
  echo "  $seg: slot=${slot_duration}s, audio=${actual_dur}s"
done

# Concat all padded segments sequentially (no overlap possible)
ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  -t $VIDEO_DURATION \
  "$FINAL_AUDIO" 2>/dev/null

# Verify
FINAL_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_AUDIO" 2>/dev/null)
echo ""
echo "=== Done ==="
echo "Voiceover: $FINAL_AUDIO (${FINAL_DUR}s, 44.1kHz stereo, volume boosted)"

rm -rf "$AUDIO_DIR"
