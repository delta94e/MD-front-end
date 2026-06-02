import puppeteer, { type Browser } from "puppeteer";
import { extractContent, detectCaptcha } from "./html-to-markdown";

export interface CrawledContent {
  url: string;
  title: string;
  content: string;
  author?: string;
  error?: string;
}

let browserInstance: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return false;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) return browserInstance;
  if (browserPromise) return browserPromise;

  browserPromise = puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  }).then((browser) => {
    browserInstance = browser;
    browserPromise = null;
    return browser;
  }).catch((err) => {
    browserPromise = null;
    throw err;
  });

  return browserPromise;
}

export async function crawlUrl(url: string): Promise<CrawledContent> {
  if (!isSafeUrl(url)) {
    return {
      url,
      title: "",
      content: "",
      error: "Invalid URL. Only public HTTP/HTTPS URLs are allowed.",
    };
  }

  let browser: Browser;
  try {
    browser = await getBrowser();
  } catch (err) {
    return {
      url,
      title: "",
      content: "",
      error: `Failed to launch browser: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }

  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await new Promise((r) => setTimeout(r, 2000));

    const html = await page.content();

    if (detectCaptcha(html)) {
      return {
        url,
        title: "",
        content: "",
        error: "Captcha or anti-bot protection detected. Please paste the article text manually.",
      };
    }

    const extracted = extractContent(html);

    if (extracted.content.length < 100) {
      return {
        url,
        title: extracted.title,
        content: "",
        error: "Could not extract meaningful content from this page. Please paste the article text manually.",
      };
    }

    return {
      url,
      title: extracted.title,
      content: extracted.content,
      author: extracted.author,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("timeout") || message.includes("Timeout")) {
      return {
        url,
        title: "",
        content: "",
        error: "Page load timed out (30s). The site may be slow or blocking automated access.",
      };
    }
    return {
      url,
      title: "",
      content: "",
      error: `Crawl failed: ${message}`,
    };
  } finally {
    await page.close();
  }
}

async function cleanupBrowser() {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
    browserPromise = null;
  }
}

process.on("beforeExit", cleanupBrowser);
process.on("SIGTERM", cleanupBrowser);
process.on("SIGINT", cleanupBrowser);
