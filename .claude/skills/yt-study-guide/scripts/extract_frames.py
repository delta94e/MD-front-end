#!/usr/bin/env python3
"""Grab still frames from a YouTube video into <folder>/images/.

Usage:
  extract_frames.py <url> <folder> --at 05:45 1:07:52 472 ...

Seeks the remote stream with ffmpeg (no full download). Falls back to
downloading a 480p video-only copy into <folder>/.cache/ if seeking fails.
Prints one "FRAME: <path>" line per image, then a status token: OK | ERROR.
"""
import argparse
import os
import shutil
import subprocess
import sys


def seconds(ts):
    parts = [float(p) for p in ts.split(":")]
    total = 0.0
    for p in parts:
        total = total * 60 + p
    return int(total)


def label(s):
    return "%02dh%02dm%02ds" % (s // 3600, s % 3600 // 60, s % 60)


def need(tool):
    if not shutil.which(tool):
        print("%s not installed (brew install %s)" % (tool, tool), file=sys.stderr)
        print("ERROR")
        sys.exit(1)


def grab(source, at, out):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", str(at), "-i", source,
                        "-frames:v", "1", "-vf", "scale='min(1280,iw)':-2", "-q:v", "3", out],
                       capture_output=True, text=True)
    return r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("folder")
    ap.add_argument("--at", nargs="+", required=True, help="timestamps: ss, mm:ss or hh:mm:ss")
    a = ap.parse_args()
    need("yt-dlp")
    need("ffmpeg")

    images = os.path.join(os.path.expanduser(a.folder), "images")
    os.makedirs(images, exist_ok=True)
    times = [seconds(t) for t in a.at]

    r = subprocess.run(["yt-dlp", "--no-warnings", "-g", "-f",
                        "bv*[height<=720][ext=mp4]/bv*[height<=720]/best[height<=720]", a.url],
                       capture_output=True, text=True)
    stream = r.stdout.strip().splitlines()[0] if r.returncode == 0 and r.stdout.strip() else None

    cache = os.path.join(os.path.expanduser(a.folder), ".cache", "video.mp4")
    failed = []
    for t in times:
        out = os.path.join(images, "frame-%s.jpg" % label(t))
        if (stream and grab(stream, t, out)) or (os.path.exists(cache) and grab(cache, t, out)):
            print("FRAME: " + out)
        else:
            failed.append((t, out))

    if failed and not os.path.exists(cache):
        print("Stream seek failed; downloading 480p copy...", file=sys.stderr)
        subprocess.run(["yt-dlp", "--no-warnings", "-f", "bv*[height<=480][ext=mp4]/bv*[height<=480]",
                        "-o", cache, a.url], capture_output=True, text=True)
        still = []
        for t, out in failed:
            if os.path.exists(cache) and grab(cache, t, out):
                print("FRAME: " + out)
            else:
                still.append(t)
        failed = still

    if failed:
        print("FAILED: " + " ".join(label(t) for t in failed), file=sys.stderr)
        print("ERROR")
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
