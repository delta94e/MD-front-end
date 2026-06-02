import type { DailyDevFeed, DailyDevPost, DailyDevRanking } from "./types";

const GRAPHQL_URL = "https://api.daily.dev/graphql";

const ANONYMOUS_FEED_QUERY = `
  query AnonymousFeed($first: Int, $after: String, $ranking: Ranking) {
    anonymousFeed(first: $first, after: $after, ranking: $ranking) {
      edges {
        node {
          id
          title
          permalink
          summary
          image
          readTime
          tags
          domain
          numUpvotes
          numComments
          type
          createdAt
          content
          author {
            name
            username
            image
          }
          source {
            name
            handle
            image
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const POST_BY_ID_QUERY = `
  query PostById($id: ID!) {
    post(id: $id) {
      id
      title
      permalink
      summary
      image
      readTime
      tags
      domain
      numUpvotes
      numComments
      type
      createdAt
      content
      author {
        name
        username
        image
      }
      source {
        name
        handle
        image
      }
    }
  }
`;

let lastRequestTime = 0;
const RATE_LIMIT_MS = 1100; // ~1 req/sec

async function throttledFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, options);
}

const MAX_RETRIES = 3;

interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

async function executeQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  retriesLeft = MAX_RETRIES,
): Promise<T> {
  const res = await throttledFetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    if (res.status === 429 && retriesLeft > 0) {
      const retryAfter = Number(res.headers.get("retry-after") || "5");
      await new Promise((r) => setTimeout(r, Math.min(retryAfter, 30) * 1000));
      return executeQuery(query, variables, retriesLeft - 1);
    }
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  if (!json.data) {
    throw new Error("GraphQL response missing data");
  }
  return json.data;
}

interface FeedEdge {
  node: {
    id: string;
    title: string;
    permalink: string;
    summary: string;
    image: string;
    readTime: number;
    tags: string[];
    domain: string;
    numUpvotes: number;
    numComments: number;
    type: string;
    createdAt: string;
    content?: string;
    author: { name: string; username?: string; image?: string } | null;
    source: { name: string; handle: string; image?: string };
  };
}

interface FeedResponse {
  anonymousFeed: {
    edges: FeedEdge[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

function mapEdgeToPost(edge: FeedEdge): DailyDevPost {
  const n = edge.node;
  return {
    id: n.id,
    title: n.title,
    permalink: n.permalink,
    summary: n.summary,
    image: n.image,
    readTime: n.readTime,
    tags: n.tags ?? [],
    domain: n.domain,
    author: { name: n.author?.name ?? "", handle: n.author?.username ?? "", image: n.author?.image },
    source: { name: n.source?.name ?? "", handle: n.source?.handle ?? "", image: n.source?.image },
    numUpvotes: n.numUpvotes,
    numComments: n.numComments,
    type: (n.type.charAt(0).toUpperCase() + n.type.slice(1)) as DailyDevPost["type"],
    content: n.content,
    createdAt: n.createdAt,
  };
}

export async function fetchFeed(options?: {
  first?: number;
  after?: string | null;
  ranking?: DailyDevRanking;
}): Promise<DailyDevFeed> {
  const { first = 30, after = null, ranking = "POPULARITY" } = options ?? {};
  const clampedFirst = Math.max(1, Math.min(first, 50));

  const data = await executeQuery<FeedResponse>(ANONYMOUS_FEED_QUERY, {
    first: clampedFirst,
    after,
    ranking,
  });

  const feed = data.anonymousFeed;
  return {
    posts: feed.edges.map(mapEdgeToPost),
    hasNextPage: feed.pageInfo.hasNextPage,
    endCursor: feed.pageInfo.endCursor,
  };
}

interface PostByIdResponse {
  post: FeedEdge["node"];
}

export async function fetchPostById(id: string): Promise<DailyDevPost> {
  const data = await executeQuery<PostByIdResponse>(POST_BY_ID_QUERY, { id });
  return {
    id: data.post.id,
    title: data.post.title,
    permalink: data.post.permalink,
    summary: data.post.summary,
    image: data.post.image,
    readTime: data.post.readTime,
    tags: data.post.tags ?? [],
    domain: data.post.domain,
    author: { name: data.post.author?.name ?? "", handle: data.post.author?.username ?? "", image: data.post.author?.image },
    source: { name: data.post.source?.name ?? "", handle: data.post.source?.handle ?? "", image: data.post.source?.image },
    numUpvotes: data.post.numUpvotes,
    numComments: data.post.numComments,
    type: data.post.type as DailyDevPost["type"],
    content: data.post.content,
    createdAt: data.post.createdAt,
  };
}
