#!/bin/bash
# Build final demo video: screens synced to Myvoice.mpeg
# Voice duration: 420s, silence breaks mapped to screen transitions

FRAMES="/Users/vgopiraja/Downloads/Vendor/submission/video_frames"
VOICE="/Users/vgopiraja/Downloads/Vendor/Myvoice.mpeg"
OUTPUT="/Users/vgopiraja/Downloads/Vendor/submission/VendorEval_AI_Demo.mp4"

# Map voice segments to frames (each frame shows for duration matching voice section)
# Silence breaks at: 0, ~24, ~49, ~84, ~114, ~127, ~197, ~214, ~235, ~260, ~356, ~414, 420
#
# Section timing based on voice analysis:
# 0-24s    = Intro (Login page)                  -> frame_01_login.png
# 24-49s   = Dashboard                           -> frame_02_dashboard.png
# 49-84s   = Create evaluation                   -> frame_03_setup.png
# 84-114s  = Fill form                           -> frame_04_form_filled.png
# 114-127s = Upload step                         -> frame_05_vendor_upload.png
# 127-197s = Upload vendors + explain            -> frame_06_vendors_filled.png
# 197-214s = Analysis running                    -> frame_07_analyzing.png -> frame_08_results.png
# 214-235s = Comparison matrix                   -> frame_09_comparison.png
# 235-260s = Red flags                           -> frame_10_redflags.png
# 260-268s = Recommendation                      -> frame_11_recommendation.png
# 268-356s = AI Chat + explanation               -> frame_12_chat.png
# 356-414s = How AI works (back to overview)     -> frame_08_results.png
# 414-420s = Closing                             -> frame_02_dashboard.png

echo "Building video frames list..."

# Create a concat file with duration for each frame
CONCAT="/tmp/vendoreval_concat.txt"
cat > "$CONCAT" << 'ENDLIST'
file 'frame_01_login.png'
duration 24
file 'frame_02_dashboard.png'
duration 25
file 'frame_03_setup.png'
duration 10
file 'frame_04_form_filled.png'
duration 25
file 'frame_05_vendor_upload.png'
duration 13
file 'frame_06_vendors_filled.png'
duration 70
file 'frame_08_results.png'
duration 17
file 'frame_09_comparison.png'
duration 21
file 'frame_10_redflags.png'
duration 25
file 'frame_11_recommendation.png'
duration 8
file 'frame_12_chat.png'
duration 88
file 'frame_08_results.png'
duration 58
file 'frame_02_dashboard.png'
duration 6
file 'frame_02_dashboard.png'
ENDLIST

echo "Creating video..."
ffmpeg -y \
  -f concat -safe 0 -i "$CONCAT" \
  -i "$VOICE" \
  -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2,format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 -r 1 \
  -c:a aac -b:a 192k \
  -shortest \
  -movflags +faststart \
  "$OUTPUT" 2>&1 | tail -5

echo ""
echo "Video created!"
ls -lah "$OUTPUT"
ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT" 2>/dev/null | xargs -I{} echo "Duration: {} seconds"
