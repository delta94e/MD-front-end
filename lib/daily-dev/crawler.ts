import { fetchFeed, fetchPostById } from "./client";
import { crawlUrl } from "@/lib/content-crawler";
import { extractContent } from "@/lib/html-to-markdown";
import type {
  DailyDevRanking,
  DailyDevPost,
  CrawledArticle,
} from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Lightweight fetch + cheerio extraction (no Puppeteer) */
async function fetchAndExtract(url: string): Promise<{ title: string; content: string; author?: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (!res.ok) return null;

    const html = await res.text();
    const extracted = extractContent(html);
    if (extracted.content.length < 100) return null;
    return extracted;
  } catch {
    return null;
  }
}

const MAX_CONCURRENT = 2;
const MAX_POSTS = 50;

/** Run promises with concurrency limit */
async function runWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

/** Convert a single daily.dev post to a crawled article */
async function processPost(post: DailyDevPost): Promise<CrawledArticle> {
  // Freeform posts already have markdown content
  if (post.type === "Freeform" && post.content) {
    return {
      title: post.title,
      content: post.content,
      tags: post.tags,
      author: post.author.name,
      source: post.source.name,
      url: post.permalink,
      summary: post.summary,
      readTime: post.readTime,
      type: post.type,
    };
  }

  // External articles: crawl the original URL
  if (!post.permalink) {
    return {
      title: post.title,
      content: post.summary || "",
      tags: post.tags,
      url: "",
      summary: post.summary,
      type: post.type,
      error: post.summary ? undefined : "No permalink available",
    };
  }

  try {
    // Step 1: Try lightweight fetch first (fast, no browser)
    const fetched = await fetchAndExtract(post.permalink);
    if (fetched) {
      return {
        title: fetched.title || post.title,
        content: fetched.content,
        tags: post.tags,
        author: fetched.author || post.author.name,
        source: post.source.name,
        url: post.permalink,
        summary: post.summary,
        readTime: post.readTime,
        type: post.type,
      };
    }

    // Step 2: Fall back to Puppeteer (slower, handles JS-rendered pages)
    const crawled = await crawlUrl(post.permalink);
    if (!crawled.error && crawled.content) {
      return {
        title: crawled.title || post.title,
        content: crawled.content,
        tags: post.tags,
        author: crawled.author || post.author.name,
        source: post.source.name,
        url: post.permalink,
        summary: post.summary,
        readTime: post.readTime,
        type: post.type,
      };
    }

    // Step 3: Use daily.dev summary as fallback
    if (post.summary) {
      return {
        title: post.title,
        content: post.summary,
        tags: post.tags,
        author: post.author.name,
        source: post.source.name,
        url: post.permalink,
        summary: post.summary,
        readTime: post.readTime,
        type: post.type,
      };
    }

    return {
      title: post.title,
      content: "",
      tags: post.tags,
      author: post.author.name,
      source: post.source.name,
      url: post.permalink,
      summary: post.summary,
      readTime: post.readTime,
      type: post.type,
      error: crawled.error || "Could not extract content",
    };
  } catch (err) {
    // On error, use summary if available
    if (post.summary) {
      return {
        title: post.title,
        content: post.summary,
        tags: post.tags,
        author: post.author.name,
        source: post.source.name,
        url: post.permalink,
        summary: post.summary,
        type: post.type,
      };
    }
    return {
      title: post.title,
      content: "",
      tags: post.tags,
      author: post.author.name,
      source: post.source.name,
      url: post.permalink,
      summary: post.summary,
      type: post.type,
      error: err instanceof Error ? err.message : "Unknown crawl error",
    };
  }
}

export interface CrawlFeedOptions {
  ranking?: DailyDevRanking;
  first?: number;
  after?: string | null;
  onProgress?: (fetched: number, total: number, current: string) => void;
}

export interface CrawlFeedResult {
  articles: CrawledArticle[];
  hasNextPage: boolean;
  endCursor: string | null;
  errors: number;
}

/** Fetch daily.dev feed and crawl all articles */
export async function crawlDailyDevFeed(
  options?: CrawlFeedOptions
): Promise<CrawlFeedResult> {
  const {
    ranking = "POPULARITY",
    first = 20,
    after = null,
    onProgress,
  } = options ?? {};

  const feed = await fetchFeed({ first: Math.min(first, MAX_POSTS), after, ranking });

  const tasks = feed.posts.map((post, i) => async () => {
    onProgress?.(i + 1, feed.posts.length, post.title);
    return processPost(post);
  });

  const articles = await runWithLimit(tasks, MAX_CONCURRENT);
  const errors = articles.filter((a) => a.error).length;

  return {
    articles,
    hasNextPage: feed.hasNextPage,
    endCursor: feed.endCursor,
    errors,
  };
}

/** Crawl a single daily.dev post by ID */
export async function crawlSinglePost(postId: string): Promise<CrawledArticle> {
  const post = await fetchPostById(postId);
  return processPost(post);
}
