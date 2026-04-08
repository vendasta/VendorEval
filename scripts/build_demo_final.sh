#!/bin/bash
# Final approach: Generate voiceover FIRST, measure each segment duration,
# then record video with scene durations matching the audio.
set -e
cd "$(dirname "$0")/.."

AUDIO_DIR="demo_audio"
VOICE="Reed (English (US))"
RATE=165

mkdir -p "$AUDIO_DIR"

echo "=== STEP 1: Generate voiceover segments ==="

gen() {
  local id="$1" text="$2"
  say -v "$VOICE" -r $RATE -o "$AUDIO_DIR/${id}.aiff" "$text"
  ffmpeg -y -i "$AUDIO_DIR/${id}.aiff" -ar 44100 -ac 2 -c:a aac -b:a 192k -af "volume=2.0" "$AUDIO_DIR/${id}.m4a" 2>/dev/null
  rm "$AUDIO_DIR/${id}.aiff"
  local dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/${id}.m4a" 2>/dev/null)
  echo "$dur"
}

# Generate and capture durations
d01=$(gen "s01" "Welcome to VendorEval AI. Lets walk through a live evaluation of two IT security vendors.")
d02=$(gen "s02" "This is the dashboard showing all evaluations with stats. Lets create a new one.")
d03=$(gen "s03" "Step one, define the requirements. We enter the evaluation title.")
d04=$(gen "s04" "And paste the RFP requirements for an enterprise IT security and SOC engagement.")
d05=$(gen "s05" "The requirements cover twenty four seven SOC monitoring, SIEM, endpoint protection for twenty five hundred endpoints, and a budget of one point five crore.")
d06=$(gen "s06" "Step two, add vendor proposals. You can upload PDF or DOCX files, or paste the text directly.")
d07=$(gen "s07" "Vendor one is CyberShield India, offering a full twenty four seven dedicated SOC with CrowdStrike and Microsoft Sentinel.")
d08=$(gen "s08" "Vendor two is SecureNet Solutions, with a sixteen by five hybrid SOC using SentinelOne and Splunk.")
d09=$(gen "s09" "Step three, review and analyze. Both vendors are loaded. Lets start the AI analysis.")
d10=$(gen "s10" "The AI is extracting data, scoring each vendor, detecting red flags, and generating the recommendation.")
d11=$(gen "s11" "Here are the results. CyberShield India is the recommended vendor with a score of eighty four and ninety five percent confidence.")
d12=$(gen "s12" "The score cards show each vendors overall score with a visual gauge, plus dimension bars for cost, timeline, quality, risk, and SLA.")
d13=$(gen "s13" "The radar chart provides a multi-dimensional comparison. CyberShield dominates on quality, SLA, and risk.")
d14=$(gen "s14" "The detailed recommendation explains exactly why CyberShield was selected over SecureNet.")
d15=$(gen "s15" "Negotiation tips and risks to watch help the team prepare for vendor discussions.")
d16=$(gen "s16" "The comparison matrix shows a side-by-side table. Green cells are best, red cells are worst. CyberShield leads on nearly every metric.")
d17=$(gen "s17" "The bar chart gives a clear visual summary of overall scores.")
d18=$(gen "s18" "Red flags are critical for contract managers. SecureNet has significantly more contract risks.")
d19=$(gen "s19" "Click any flag to expand and see the exact clause text. Price escalation, termination penalties, limited liability, all flagged automatically.")
d20=$(gen "s20" "The AI chat lets you ask natural language questions. Lets ask why CyberShield was recommended.")
d21=$(gen "s21" "The AI provides a detailed answer comparing both vendors and highlighting key differentiators.")
d22=$(gen "s22" "Finally, the export report generates a professional document ready to share with stakeholders.")
d23=$(gen "s23" "The report includes vendor comparison, scores, red flags, and negotiation tips. Everything the team needs for a confident decision.")
d24=$(gen "s24" "That's VendorEval AI. Upload, analyze, and decide. In minutes, not weeks.")

echo ""
echo "=== STEP 2: Build scene timing file for video recorder ==="

# Add 0.5s buffer after each segment for breathing room
BUFFER=0.5

# Calculate cumulative start times
SEGS=(s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12 s13 s14 s15 s16 s17 s18 s19 s20 s21 s22 s23 s24)
DURS=($d01 $d02 $d03 $d04 $d05 $d06 $d07 $d08 $d09 $d10 $d11 $d12 $d13 $d14 $d15 $d16 $d17 $d18 $d19 $d20 $d21 $d22 $d23 $d24)

# Scene labels for the video recorder
LABELS=("login" "dashboard" "step1_empty" "title_filled" "requirements_filled" "step2_empty" "vendor1_filled" "vendor2_filled" "review" "analysis_overlay" "winner_banner" "score_cards" "radar_chart" "recommendation" "negotiation_tips" "comparison_table" "comparison_chart" "red_flags_summary" "flags_expanded" "chat_and_question" "chat_response" "report_header" "report_details" "end_frame")

echo "Scene durations (audio + buffer):"
SCENE_DURATIONS=""
CUMULATIVE=0
for i in "${!SEGS[@]}"; do
  # Round up duration and add buffer
  dur_with_buffer=$(echo "${DURS[$i]} + $BUFFER" | bc)
  # Round to nearest integer (ceiling)
  dur_int=$(echo "$dur_with_buffer" | awk '{printf "%d", $1 + 0.99}')
  # Minimum 3 seconds per scene
  if [ "$dur_int" -lt 3 ]; then dur_int=3; fi

  echo "  ${LABELS[$i]}: audio=${DURS[$i]}s -> scene=${dur_int}s (cumulative: ${CUMULATIVE}s)"

  if [ -n "$SCENE_DURATIONS" ]; then
    SCENE_DURATIONS="${SCENE_DURATIONS},${dur_int}"
  else
    SCENE_DURATIONS="${dur_int}"
  fi

  CUMULATIVE=$((CUMULATIVE + dur_int))
done

echo ""
echo "Total video duration: ${CUMULATIVE}s"
echo "Scene durations: $SCENE_DURATIONS"

# Write timing config for the node recorder
echo "$SCENE_DURATIONS" > "$AUDIO_DIR/scene_durations.txt"

echo ""
echo "=== STEP 3: Concat voiceover with exact padding ==="

# Now build the final voiceover: each segment padded to its scene duration, concatenated
CONCAT_LIST="$AUDIO_DIR/concat.txt"
> "$CONCAT_LIST"

IFS=',' read -ra SDURS <<< "$SCENE_DURATIONS"
for i in "${!SEGS[@]}"; do
  seg="${SEGS[$i]}"
  slot="${SDURS[$i]}"
  ffmpeg -y -i "$AUDIO_DIR/${seg}.m4a" \
    -af "apad=whole_dur=${slot}" \
    -ar 44100 -ac 2 -c:a aac -b:a 192k -t "${slot}" \
    "$AUDIO_DIR/${seg}_padded.m4a" 2>/dev/null
  echo "file '${seg}_padded.m4a'" >> "$CONCAT_LIST"
done

ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" \
  -c:a aac -b:a 192k -ar 44100 -ac 2 \
  "$AUDIO_DIR/voiceover_final.m4a" 2>/dev/null

FINAL_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/voiceover_final.m4a" 2>/dev/null)
mv "$AUDIO_DIR/voiceover_final.m4a" demo_voiceover.m4a
echo "Voiceover ready: demo_voiceover.m4a (${FINAL_DUR}s)"

# Keep scene_durations.txt for the video recorder, clean rest
find "$AUDIO_DIR" -name "*.m4a" -delete
find "$AUDIO_DIR" -name "concat.txt" -delete

echo ""
echo "=== Next: Run node recorder with these durations ==="
echo "Duration config saved to: $AUDIO_DIR/scene_durations.txt"
cat "$AUDIO_DIR/scene_durations.txt"
