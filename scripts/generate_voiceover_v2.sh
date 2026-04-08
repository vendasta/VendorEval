#!/bin/bash
# Generate voiceover synced exactly to scene timings from record_demo_v2
set -e
cd "$(dirname "$0")/.."

AUDIO_DIR="demo_audio"
FINAL_AUDIO="demo_voiceover.m4a"
VOICE="Reed (English (US))"
RATE=175
VIDEO_DURATION=109  # seconds

mkdir -p "$AUDIO_DIR"
echo "Generating voiceover segments (synced to video)..."

gen() {
  local id="$1" text="$2"
  echo "  $id"
  say -v "$VOICE" -r $RATE -o "$AUDIO_DIR/${id}.aiff" "$text"
  ffmpeg -y -i "$AUDIO_DIR/${id}.aiff" -ar 44100 -ac 2 -c:a aac -b:a 192k "$AUDIO_DIR/${id}.m4a" 2>/dev/null
  rm "$AUDIO_DIR/${id}.aiff"
}

# Scene-matched voiceover segments
gen "s01" "Welcome to VendorEval AI. Lets walk through a live evaluation of two IT security vendors."
gen "s02" "This is the dashboard showing all evaluations with stats for completed, in progress, and failed. Lets create a new one."
gen "s03" "Step one, define your requirements. We enter the evaluation title."
gen "s04" "And paste the RFP requirements document."
gen "s05" "The requirements cover twenty four seven SOC monitoring, SIEM, endpoint protection for twenty five hundred endpoints, and a budget of one point five crore."
gen "s06" "Step two, add vendor proposals. You can upload PDF, DOCX, or TXT files."
gen "s07" "Vendor one is CyberShield India, offering a dedicated twenty four seven SOC with CrowdStrike EDR and Microsoft Sentinel."
gen "s08" "Vendor two is SecureNet Solutions, with a sixteen by five hybrid SOC, SentinelOne, and Splunk."
gen "s09" "Step three, review. Both vendors are loaded. Lets start the AI analysis."
gen "s10" "The AI is extracting data, scoring vendors, detecting red flags, and generating the recommendation."
gen "s11" "Here are the results. CyberShield India is the recommended vendor with a score of eighty four point two and ninety five percent confidence."
gen "s12" "Score cards show each vendors overall score with visual gauges and dimension bars for cost, timeline, quality, risk, and SLA."
gen "s13" "The radar chart shows a multi-dimensional comparison. CyberShield dominates on quality, SLA, and risk."
gen "s14" "The detailed recommendation explains exactly why CyberShield was selected over SecureNet."
gen "s15" "Negotiation tips and risks to watch help your team prepare for vendor discussions."
gen "s16" "The comparison tab shows a side-by-side matrix. Green cells are best, red cells are worst. CyberShield leads on nearly every dimension."
gen "s17" "The bar chart gives a clear visual of overall scores."
gen "s18" "Red flags are critical for contract managers. SecureNet has significantly more contract risks."
gen "s19" "Click any flag to see the exact clause text. Price escalation, termination penalties, limited liability, all flagged automatically."
gen "s20" "The AI chat lets you ask natural language questions about the evaluation."
gen "s21" "Lets ask why CyberShield was recommended."
gen "s22" "The AI provides a detailed answer comparing both vendors and highlighting key differentiators."
gen "s23" "Finally, the export report generates a professional document ready to share with stakeholders."
gen "s24" "It includes vendor comparison, scores, red flags, negotiation tips, everything your team needs."
gen "s25" "That's VendorEval AI. Upload, analyze, and decide. In minutes, not weeks."

echo ""
echo "Building synced audio track..."

# Scene timings (start_sec) - exactly matching the video
# s01=0, s02=4, s03=9, s04=12, s05=15, s06=20, s07=23, s08=27, s09=31, s10=36
# s11=40, s12=46, s13=51, s14=56, s15=60, s16=64, s17=70, s18=73, s19=78, s20=83
# s21=87, s22=90, s23=97, s24=102, s25=106
SEGS=(s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24 s25)
STARTS=(0 4 9 12 15 20 23 27 31 36 40 46 51 56 60 64 70 73 78 83 87 90 97 102 106)

# Generate a silent base track of exact video duration
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t $VIDEO_DURATION -c:a aac -b:a 192k "$AUDIO_DIR/silence.m4a" 2>/dev/null

# Build ffmpeg command to overlay each segment at its exact start time
INPUTS="-i $AUDIO_DIR/silence.m4a"
FILTER="[0]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[base]"

for i in "${!SEGS[@]}"; do
  seg="${SEGS[$i]}"
  idx=$((i + 1))
  INPUTS="$INPUTS -i $AUDIO_DIR/${seg}.m4a"
  FILTER="$FILTER;[$idx]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,adelay=${STARTS[$i]}000|${STARTS[$i]}000[d$i]"
done

# Amerge all
MERGE="[base]"
for i in "${!SEGS[@]}"; do
  MERGE="${MERGE}[d$i]"
done
FILTER="$FILTER;${MERGE}amix=inputs=$((${#SEGS[@]} + 1)):duration=first:dropout_transition=0[out]"

eval ffmpeg -y $INPUTS -filter_complex "\"$FILTER\"" -map "\"[out]\"" -c:a aac -b:a 192k -t $VIDEO_DURATION "\"$FINAL_AUDIO\"" 2>/dev/null

echo "Voiceover saved: $FINAL_AUDIO (${VIDEO_DURATION}s, 44.1kHz stereo)"
rm -rf "$AUDIO_DIR"
echo "Done!"
