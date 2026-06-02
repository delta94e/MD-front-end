import { NextRequest, NextResponse } from "next/server";
import { crawlDailyDevFeed } from "@/lib/daily-dev/crawler";
import type { DailyDevRanking } from "@/lib/daily-dev/types";

// Simple in-memory rate limiter (1 request per 5 seconds)
let lastCrawlTime = 0;
const CRAWL_COOLDOWN_MS = 5000;

export async function POST(req: NextRequest) {
  try {
    const now = Date.now();
    if (now - lastCrawlTime < CRAWL_COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Please wait a few seconds between crawl requests" },
        { status: 429 }
      );
    }
    lastCrawlTime = now;

    const body = await req.json().catch(() => ({}));
    const {
      ranking = "POPULARITY",
      first = 20,
      after = null,
    } = body as {
      ranking?: DailyDevRanking;
      first?: number;
      after?: string | null;
    };

    if (!["POPULARITY", "TIME", "DISCUSSION"].includes(ranking)) {
      return NextResponse.json(
        { error: "Invalid ranking. Use: POPULARITY, TIME, DISCUSSION" },
        { status: 400 }
      );
    }

    if (first < 1 || first > 50) {
      return NextResponse.json(
        { error: "first must be between 1 and 50" },
        { status: 400 }
      );
    }

    const result = await crawlDailyDevFeed({ ranking, first, after });

    return NextResponse.json({
      articles: result.articles,
      hasNextPage: result.hasNextPage,
      endCursor: result.endCursor,
      total: result.articles.length,
      errors: result.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
