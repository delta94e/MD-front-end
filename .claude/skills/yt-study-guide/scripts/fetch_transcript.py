#!/usr/bin/env python3
"""Fetch a YouTube video's transcript into ~/study-guides/<slug>-<id>/.

Usage:
  fetch_transcript.py <url>                       # fetch subtitles via yt-dlp
  fetch_transcript.py <url> --paste <file>        # use a transcript the user pasted
  fetch_transcript.py <url> --force               # re-fetch even if cached

Writes into the video folder:
  meta.json        title, channel, duration, chapters, subtitle source
  transcript.txt   header + "[hh:mm:ss] text" paragraphs (~30s each)
  chunks/NN.txt    only when the video is longer than 45 minutes

Last stdout line is a status token:
  OK | CACHED | NO_SUBTITLES | ERROR
Exit codes: 0 OK/CACHED, 2 NO_SUBTITLES, 1 ERROR.
"""
import argparse
import glob
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata

ROOT = os.path.expanduser(os.environ.get("STUDY_GUIDES_DIR", "~/study-guides"))
CHUNK_THRESHOLD_S = 45 * 60
CHUNK_FALLBACK_S = 15 * 60
CHUNK_MIN_S = 10 * 60
PARAGRAPH_S = 30
PASTE_CHUNK_WORDS = 2500


def die(msg, token="ERROR", code=1):
    print(msg, file=sys.stderr)
    print(token)
    sys.exit(code)


def slugify(text, max_len=50):
    text = text.replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text[:max_len].rstrip("-") or "video"


def hms(seconds):
    s = int(seconds)
    return "%02d:%02d:%02d" % (s // 3600, s % 3600 // 60, s % 60)


def run_ytdlp(args):
    if not shutil.which("yt-dlp"):
        die("yt-dlp not installed. Install: brew install yt-dlp (or pipx install yt-dlp)")
    return subprocess.run(["yt-dlp", "--no-warnings", *args], capture_output=True, text=True)


def fetch_meta(url):
    r = run_ytdlp(["--dump-json", "--skip-download", "--no-playlist", url])
    if r.returncode != 0:
        die("yt-dlp metadata failed:\n" + r.stderr.strip())
    return json.loads(r.stdout.splitlines()[0])


def pick_track(info):
    """Manual > auto, original language first. Never an auto-translated track."""
    orig = (info.get("language") or "").split("-")[0]
    manual = {k: v for k, v in (info.get("subtitles") or {}).items() if k != "live_chat"}
    auto = info.get("automatic_captions") or {}

    def match(keys, lang):
        return [k for k in keys if lang and (k == lang or k.startswith(lang + "-"))]

    if orig:
        m = match(manual, orig)
        if m:
            return m[0], "manual"
    # Auto captions: the spoken-language track is "<lang>-orig"; plain keys are translations.
    origs = [k for k in auto if k.endswith("-orig")]
    if origs:
        return origs[0], "auto"
    if orig and orig in auto:
        return orig, "auto"
    for lang in ("vi", "en"):
        m = match(manual, lang)
        if m:
            return m[0], "manual"
    if manual:
        return next(iter(manual)), "manual"
    return None, None


def download_vtt(url, lang, kind, workdir):
    flag = "--write-subs" if kind == "manual" else "--write-auto-subs"
    r = run_ytdlp([flag, "--skip-download", "--no-playlist", "--sub-langs", lang,
                   "--sub-format", "vtt", "-o", os.path.join(workdir, "sub.%(ext)s"), url])
    files = glob.glob(os.path.join(workdir, "*.vtt"))
    if not files:
        die("Subtitle download failed:\n" + r.stderr.strip(), "NO_SUBTITLES", 2)
    with open(files[0], encoding="utf-8") as f:
        return f.read()


TS = re.compile(r"(\d+):(\d{2}):(\d{2})\.(\d{3})\s+-->")
TS_SHORT = re.compile(r"(\d{2}):(\d{2})\.(\d{3})\s+-->")


def parse_vtt(text):
    """Return [(start_seconds, line)] with auto-caption rolling duplicates removed."""
    out, recent, start = [], [], None
    for raw in text.splitlines():
        m = TS.search(raw)
        if m:
            h, mi, s, ms = map(int, m.groups())
            start = h * 3600 + mi * 60 + s + ms / 1000
            continue
        m = TS_SHORT.search(raw)
        if m:
            mi, s, ms = map(int, m.groups())
            start = mi * 60 + s + ms / 1000
            continue
        if start is None:  # WEBVTT header, Kind:, Language:, NOTE blocks
            continue
        clean = html.unescape(re.sub(r"<[^>]+>", "", raw)).strip()
        if not clean or clean in recent or clean.isdigit():
            continue
        out.append((start, clean))
        recent = (recent + [clean])[-3:]
    return out


def paragraphs(lines):
    paras, cur, cur_start = [], [], None
    for start, text in lines:
        if cur_start is None:
            cur_start = start
        if start - cur_start >= PARAGRAPH_S and cur:
            paras.append((cur_start, " ".join(cur)))
            cur, cur_start = [], start
        cur.append(text)
    if cur:
        paras.append((cur_start, " ".join(cur)))
    return paras


def chunk_bounds(info):
    duration = info.get("duration") or 0
    chapters = info.get("chapters") or []
    if chapters:
        # Merge consecutive short chapters so each chunk spans at least CHUNK_MIN_S.
        merged = []
        for c in chapters:
            title = c.get("title") or ""
            if merged and merged[-1][1] - merged[-1][0] < CHUNK_MIN_S:
                s, _, t = merged[-1]
                merged[-1] = (s, c["end_time"], t + " / " + title)
            else:
                merged.append((c["start_time"], c["end_time"], title))
        return merged
    bounds, t = [], 0
    while t < duration:
        bounds.append((t, min(t + CHUNK_FALLBACK_S, duration), ""))
        t += CHUNK_FALLBACK_S
    return bounds


def header(info, url, source):
    lines = [
        "TITLE: " + (info.get("title") or ""),
        "CHANNEL: " + (info.get("channel") or info.get("uploader") or ""),
        "URL: " + url,
        "VIDEO_ID: " + (info.get("id") or ""),
        "DURATION: " + hms(info.get("duration") or 0),
        "SOURCE: " + source,
    ]
    chapters = info.get("chapters") or []
    if chapters:
        lines.append("CHAPTERS:")
        lines += ["  [%s] %s" % (hms(c["start_time"]), c.get("title") or "") for c in chapters]
    return "\n".join(lines) + "\n\n"


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--paste", help="file holding a transcript the user pasted")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    info = fetch_meta(a.url)
    vid = info["id"]
    existing = glob.glob(os.path.join(ROOT, "*-" + vid))
    folder = existing[0] if existing else os.path.join(ROOT, slugify(info.get("title", "")) + "-" + vid)
    transcript_path = os.path.join(folder, "transcript.txt")
    print("FOLDER: " + folder)

    if os.path.exists(transcript_path) and not a.force and not a.paste:
        print("GUIDE_EXISTS: " + str(os.path.exists(os.path.join(folder, "guide.md"))).lower())
        print("CACHED")
        return

    meta = {k: info.get(k) for k in ("id", "title", "channel", "uploader", "duration",
                                      "chapters", "language", "webpage_url", "description")}
    os.makedirs(folder, exist_ok=True)
    shutil.rmtree(os.path.join(folder, "chunks"), ignore_errors=True)

    if a.paste:
        with open(os.path.expanduser(a.paste), encoding="utf-8") as f:
            body = f.read().strip() + "\n"
        meta["subtitle_source"] = "pasted"
        write(os.path.join(folder, "meta.json"), json.dumps(meta, ensure_ascii=False, indent=2))
        write(transcript_path, header(info, a.url, "pasted by user") + body)
        words = body.split()
        if len(words) > PASTE_CHUNK_WORDS * 3:
            for i in range(0, len(words), PASTE_CHUNK_WORDS):
                n = i // PASTE_CHUNK_WORDS + 1
                write(os.path.join(folder, "chunks", "%02d.txt" % n),
                      " ".join(words[i:i + PASTE_CHUNK_WORDS]) + "\n")
        print("WORDS: %d" % len(words))
        print("CHUNKS: %d" % len(glob.glob(os.path.join(folder, "chunks", "*.txt"))))
        print("OK")
        return

    lang, kind = pick_track(info)
    meta["subtitle_source"] = None
    write(os.path.join(folder, "meta.json"), json.dumps(meta, ensure_ascii=False, indent=2))
    if not lang:
        die("No usable subtitles for this video.", "NO_SUBTITLES", 2)

    with tempfile.TemporaryDirectory() as tmp:
        vtt = download_vtt(a.url, lang, kind, tmp)
    paras = paragraphs(parse_vtt(vtt))
    if not paras:
        die("Subtitle file was empty.", "NO_SUBTITLES", 2)

    source = "%s subtitles (%s)" % (kind, lang)
    meta["subtitle_source"] = source
    write(os.path.join(folder, "meta.json"), json.dumps(meta, ensure_ascii=False, indent=2))
    body = "".join("[%s] %s\n" % (hms(s), t) for s, t in paras)
    write(transcript_path, header(info, a.url, source) + body)

    chunks = 0
    if (info.get("duration") or 0) > CHUNK_THRESHOLD_S:
        for n, (start, end, title) in enumerate(chunk_bounds(info), 1):
            part = [(s, t) for s, t in paras if start <= s < end]
            if not part:
                continue
            chunks += 1
            head = "CHUNK %02d: %s → %s %s\n\n" % (n, hms(start), hms(end), title)
            write(os.path.join(folder, "chunks", "%02d.txt" % n),
                  head + "".join("[%s] %s\n" % (hms(s), t) for s, t in part))

    print("SOURCE: " + source)
    print("DURATION: " + hms(info.get("duration") or 0))
    print("WORDS: %d" % len(body.split()))
    print("CHUNKS: %d" % chunks)
    print("OK")


if __name__ == "__main__":
    main()
