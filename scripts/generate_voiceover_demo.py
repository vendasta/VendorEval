#!/usr/bin/env python3
"""Generate voiceover audio segments and merge into one track with correct timing."""

import asyncio
import json
import os
import subprocess

VOICE = "en-US-GuyNeural"  # Professional male voice
RATE = "+0%"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SEGMENTS_FILE = os.path.join(SCRIPT_DIR, "voiceover_segments.json")
AUDIO_DIR = os.path.join(SCRIPT_DIR, "..", "demo_audio")
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "demo_voiceover.mp3")


async def generate_segment(segment):
    """Generate a single TTS audio segment."""
    import edge_tts

    outfile = os.path.join(AUDIO_DIR, f"{segment['id']}.mp3")
    communicate = edge_tts.Communicate(segment["text"], VOICE, rate=RATE)
    await communicate.save(outfile)
    print(f"  Generated: {segment['id']} ({segment['duration']}s)")
    return outfile


async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)

    with open(SEGMENTS_FILE) as f:
        segments = json.load(f)

    print("Generating voiceover segments...")
    for seg in segments:
        await generate_segment(seg)

    # Build ffmpeg concat with silence padding for timing
    print("\nMerging segments with timing...")

    filter_parts = []
    input_args = []
    idx = 0

    for i, seg in enumerate(segments):
        mp3_path = os.path.join(AUDIO_DIR, f"{seg['id']}.mp3")
        input_args.extend(["-i", mp3_path])

        # Calculate silence needed before this segment
        if i == 0:
            silence_before = seg["start"]
        else:
            prev_end = segments[i - 1]["start"] + segments[i - 1]["duration"]
            silence_before = max(0, seg["start"] - prev_end)

        # Pad segment with silence at start if needed
        if silence_before > 0:
            filter_parts.append(
                f"[{i}]adelay={int(silence_before * 1000)}|{int(silence_before * 1000)}[s{i}]"
            )
        else:
            filter_parts.append(f"[{i}]acopy[s{i}]")

    # Concatenate all
    concat_inputs = "".join(f"[s{i}]" for i in range(len(segments)))
    filter_parts.append(f"{concat_inputs}concat=n={len(segments)}:v=0:a=1[out]")

    filter_complex = ";".join(filter_parts)

    cmd = (
        ["ffmpeg", "-y"]
        + input_args
        + ["-filter_complex", filter_complex, "-map", "[out]", OUTPUT_FILE]
    )

    subprocess.run(cmd, check=True, capture_output=True)
    print(f"\nVoiceover saved: {OUTPUT_FILE}")

    # Cleanup
    import shutil
    shutil.rmtree(AUDIO_DIR)
    print("Cleaned up temp audio files.")


if __name__ == "__main__":
    asyncio.run(main())
