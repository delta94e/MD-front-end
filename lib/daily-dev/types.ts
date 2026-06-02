export interface DailyDevAuthor {
  name: string;
  handle: string;
  image?: string;
}

export interface DailyDevSource {
  name: string;
  handle: string;
  image?: string;
}

export type DailyDevPostType =
  | "Article"
  | "Freeform"
  | "Share"
  | "VideoYouTube"
  | "Collection"
  | "Poll";

export type DailyDevRanking =
  | "POPULARITY"
  | "TIME"
  | "DISCUSSION";

export interface DailyDevPost {
  id: string;
  title: string;
  permalink: string;
  summary: string;
  image: string;
  readTime: number;
  tags: string[];
  domain: string;
  author: DailyDevAuthor;
  source: DailyDevSource;
  numUpvotes: number;
  numComments: number;
  type: DailyDevPostType;
  content?: string; // Only for Freeform posts
  createdAt: string;
}

export interface DailyDevFeed {
  posts: DailyDevPost[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface CrawledArticle {
  title: string;
  content: string; // markdown
  tags: string[];
  author?: string;
  source?: string;
  url: string;
  summary?: string;
  readTime?: number;
  type: DailyDevPostType;
  error?: string;
}
