#!/bin/bash
# V4: Clean voice (Aman/Siri), proper audio processing, no distortion
set -e
cd "$(dirname "$0")/.."

AUDIO_DIR="demo_audio"
FINAL_AUDIO="demo_voiceover.m4a"
VOICE="Aman (English (India))"
RATE=160

mkdir -p "$AUDIO_DIR"
echo "=== Generating voiceover V4 (Siri voice, clean audio) ==="

gen() {
  local id="$1" text="$2"
  say -v "$VOICE" -r $RATE -o "$AUDIO_DIR/${id}.aiff" "$text"
  # Clean audio: highpass noise removal, gentle compression, normalize (no hard boost)
  ffmpeg -y -i "$AUDIO_DIR/${id}.aiff" \
    -af "highpass=f=80,lowpass=f=12000,acompressor=threshold=-20dB:ratio=3:attack=5:release=50,loudnorm=I=-16:TP=-1.5:LRA=11" \
    -ar 44100 -ac 2 -c:a aac -b:a 192k \
    "$AUDIO_DIR/${id}.m4a" 2>/dev/null
  rm "$AUDIO_DIR/${id}.aiff"
  local dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/${id}.m4a" 2>/dev/null)
  echo "$dur"
}

d01=$(gen "s01" "Welcome to VendorEval AI. Let's walk through a live evaluation of two IT security vendors.")
d02=$(gen "s02" "This is the dashboard showing all evaluations with stats. Let's create a new one.")
d03=$(gen "s03" "Step one, define the requirements. We enter the evaluation title.")
d04=$(gen "s04" "And paste the RFP requirements for an enterprise IT security and SOC engagement.")
d05=$(gen "s05" "The requirements cover 24 by 7 SOC monitoring, SIEM, endpoint protection for 2500 endpoints, and a budget of 1.5 crore.")
d06=$(gen "s06" "Step two, add vendor proposals. You can upload PDF or DOCX files, or paste the text directly.")
d07=$(gen "s07" "Vendor one is CyberShield India, offering a dedicated 24 by 7 SOC with CrowdStrike and Microsoft Sentinel.")
d08=$(gen "s08" "Vendor two is SecureNet Solutions, with a 16 by 5 hybrid SOC using SentinelOne and Splunk.")
d09=$(gen "s09" "Step three, review and analyze. Both vendors are loaded. Let's start the AI analysis.")
d10=$(gen "s10" "The AI is extracting data, scoring each vendor, detecting red flags, and generating the recommendation.")
d11=$(gen "s11" "Here are the results. CyberShield India is the recommended vendor with a score of 84 and 95 percent confidence.")
d12=$(gen "s12" "The score cards show each vendor's overall score with a visual gauge, plus dimension bars for cost, timeline, quality, risk, and SLA.")
d13=$(gen "s13" "The radar chart provides a multi-dimensional comparison. CyberShield dominates on quality, SLA, and risk.")
d14=$(gen "s14" "The detailed recommendation explains exactly why CyberShield was selected over SecureNet.")
d15=$(gen "s15" "Negotiation tips and risks to watch help the team prepare for vendor discussions.")
d16=$(gen "s16" "The comparison matrix shows a side-by-side table. Green cells are best, red cells are worst. CyberShield leads on nearly every metric.")
d17=$(gen "s17" "The bar chart gives a clear visual summary of overall scores.")
d18=$(gen "s18" "Red flags are critical for contract managers. SecureNet has significantly more contract risks.")
d19=$(gen "s19" "Click any flag to expand and see the exact clause text. Price escalation, termination penalties, limited liability, all flagged automatically.")
d20=$(gen "s20" "The AI chat lets you ask natural language questions. Let's ask why CyberShield was recommended.")
d21=$(gen "s21" "The AI provides a detailed answer comparing both vendors and highlighting key differentiators.")
d22=$(gen "s22" "Finally, the export report generates a professional document ready to share with stakeholders.")
d23=$(gen "s23" "The report includes vendor comparison, scores, red flags, and negotiation tips. Everything the team needs for a confident decision.")
d24=$(gen "s24" "That's VendorEval AI. Upload, analyze, and decide. In minutes, not weeks.")

echo ""
echo "=== Building timeline ==="

SEGS=(s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24)
DURS=($d01 $d02 $d03 $d04 $d05 $d06 $d07 $d08 $d09 $d10 $d11 $d12 $d13 $d14 $d15 $d16 $d17 $d18 $d19 $d20 $d21 $d22 $d23 $d24)

BUFFER=1.0
SCENE_DURATIONS=""
TOTAL=0

for i in "${!SEGS[@]}"; do
  dur_with_buffer=$(echo "${DURS[$i]} + $BUFFER" | bc)
  dur_int=$(echo "$dur_with_buffer" | awk '{printf "%d", $1 + 0.99}')
  if [ "$dur_int" -lt 4 ]; then dur_int=4; fi
  echo "  ${SEGS[$i]}: audio=${DURS[$i]}s -> scene=${dur_int}s"
  [ -n "$SCENE_DURATIONS" ] && SCENE_DURATIONS="${SCENE_DURATIONS},${dur_int}" || SCENE_DURATIONS="${dur_int}"
  TOTAL=$((TOTAL + dur_int))
done

echo ""
echo "Total: ${TOTAL}s"
echo "$SCENE_DURATIONS" > "$AUDIO_DIR/scene_durations.txt"

# Build padded concat voiceover
CONCAT_LIST="$AUDIO_DIR/concat.txt"
> "$CONCAT_LIST"
IFS=',' read -ra SDURS <<< "$SCENE_DURATIONS"

for i in "${!SEGS[@]}"; do
  seg="${SEGS[$i]}"
  slot="${SDURS[$i]}"
  ffmpeg -y -i "$AUDIO_DIR/${seg}.m4a" \
    -af "apad=whole_dur=${slot}" \
    -ar 44100 -ac 2 -c:a aac -b:a 192k -t "${slot}" \
    "$AUDIO_DIR/${seg}_p.m4a" 2>/dev/null
  echo "file '${seg}_p.m4a'" >> "$CONCAT_LIST"
done

ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  "$FINAL_AUDIO" 2>/dev/null

FINAL_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_AUDIO" 2>/dev/null)
echo ""
echo "Voiceover: $FINAL_AUDIO (${FINAL_DUR}s, 44.1kHz stereo, loudnorm)"

# Cleanup but keep scene_durations
find "$AUDIO_DIR" -name "*.m4a" -delete 2>/dev/null
find "$AUDIO_DIR" -name "concat.txt" -delete 2>/dev/null
echo "Scene durations: $(cat $AUDIO_DIR/scene_durations.txt)"
