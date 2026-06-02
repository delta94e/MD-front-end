---
phase: 1
title: "Content Crawler Infrastructure"
status: pending
priority: P2
effort: "3h"
dependencies: []
---

# Phase 1: Content Crawler Infrastructure

## Overview

Build a content crawler that fetches URLs using Puppeteer (headless browser), extracts main content with cheerio, and formats it as clean markdown for AI consumption. Handles JS-rendered pages and basic anti-crawl protections.

## Requirements

- Fetch URL content using Puppeteer headless browser
- Extract main article content using cheerio (strip nav, ads, footers)
- Convert HTML to clean, structured markdown
- Handle anti-crawl: wait for content, retry on timeout, detect captcha pages
- Return structured result: `{ content, title, author?, publishDate?, error? }`

## Architecture

```
URL input
  → Puppeteer launches headless browser
  → Navigate to URL, wait for content to load
  → Get page HTML
  → cheerio parses HTML:
      - Extract <article> or <main> or largest content block
      - Remove scripts, styles, nav, footer, ads
      - Convert to markdown
  → Return structured content
```

## Related Code Files

- Create: `lib/content-crawler.ts` — main crawler logic
- Create: `lib/html-to-markdown.ts` — HTML→markdown conversion
- New deps: `puppeteer`, `cheerio`

## Implementation Steps

1. Install dependencies:
   ```bash
   npm install puppeteer cheerio
   ```

2. Create `lib/content-crawler.ts`:
   - `CrawledContent` type: `{ url, title, content, author?, publishDate?, error? }`
   - `crawlUrl(url: string): Promise<CrawledContent>`
   - Launch Puppeteer with stealth options (user agent, viewport)
   - Navigate with timeout (30s), wait for network idle
   - Detect captcha: check for common captcha selectors (reCAPTCHA, hCaptcha, Cloudflare challenge)
   - If captcha detected: return `{ error: "Captcha detected, please paste content manually" }`
   - Get page HTML, pass to cheerio extractor

3. Create `lib/html-to-markdown.ts`:
   - `extractContent(html: string): { title, content, author? }`
   - Use cheerio to find main content: `<article>` → `<main>` → largest `<div>` with text
   - Remove unwanted elements: `script`, `style`, `nav`, `footer`, `header`, `.ad`, `.sidebar`
   - Convert remaining HTML to markdown:
     - `<h1>`-`<h6>` → `#` headers
     - `<p>` → paragraphs
     - `<code>` / `<pre>` → code blocks
     - `<ul>` / `<ol>` → lists
     - `<a>` → `[text](url)` links
     - `<img>` → `![alt](src)` images
   - Clean up: remove excessive whitespace, normalize line breaks

4. Add stealth measures to Puppeteer:
   - Set realistic user agent
   - Set viewport size
   - Disable webdriver flag
   - Add random delays between actions

## Success Criteria

- [ ] Can crawl a standard article URL (e.g., Medium, dev.to, blog posts)
- [ ] Extracts main content, strips navigation/ads
- [ ] Returns clean markdown with proper formatting
- [ ] Detects captcha pages and returns error message
- [ ] Handles timeout gracefully (30s max)
- [ ] Works with JS-rendered pages (SPA content)

## Risk Assessment

- **Medium risk:** Some sites have aggressive anti-bot (Cloudflare). Mitigation: detect and return error, user pastes text manually.
- **Performance:** Puppeteer is heavy (~300MB). Mitigation: reuse browser instance, lazy launch.
- **Edge case:** Some sites block headless browsers. Mitigation: stealth plugin options.
