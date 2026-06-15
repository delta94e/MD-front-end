/**
 * OfflineAndStickerDemo.tsx
 *
 * Demonstrates two optimizations:
 *
 * 1. OFFLINE DATA PROCESSING
 *    - Outbox queue pattern (IndexedDB-backed in production, simulated here)
 *    - navigator.onLine + online/offline events
 *    - Background Sync API pattern (Service Worker)
 *    - Optimistic UI with retry + exponential backoff
 *    - Conflict resolution: FIFO order preserved across reconnects
 *
 * 2. CLIENT-SIDE STICKER SUGGESTION ENGINE
 *    - Zero server round-trips — runs entirely in the browser
 *    - Keyword extraction from typed text (tokenization + stopword removal)
 *    - Multi-signal scoring: keyword match weight + recency boost + usage frequency
 *    - Trie-based prefix lookup for instant < 1ms suggestions
 *    - Debounced input — no unnecessary work per keystroke
 *    - History-aware: learns from user's sticker selections
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

// ─────────────────────────────────────────────────────────────────
// PART 1: Offline Queue Types + Engine
// ─────────────────────────────────────────────────────────────────

type QueueItemStatus =
  | "pending"    // waiting to sync
  | "syncing"    // currently being sent
  | "synced"     // successfully uploaded
  | "failed"     // all retries exhausted
  | "retrying";  // backoff in progress

interface QueueItem {
  id: string;
  type: "message" | "reaction" | "read_receipt" | "typing";
  payload: Record<string, unknown>;
  status: QueueItemStatus;
  createdAt: Date;
  retryCount: number;
  nextRetryAt?: Date;
  syncedAt?: Date;
  error?: string;
}

type NetworkStatus = "online" | "offline" | "slow";

/**
 * Simulated offline queue — in production this would use IndexedDB.
 * Demonstrates the Outbox Pattern:
 *   1. Write to local store (IndexedDB) first
 *   2. Try to sync to server
 *   3. On failure: schedule retry with exponential backoff
 *   4. On reconnect: flush entire queue in FIFO order
 */
class OfflineQueueEngine {
  private queue: QueueItem[] = [];
  private listeners: Array<(items: QueueItem[]) => void> = [];

  subscribe(fn: (items: QueueItem[]) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    const snapshot = [...this.queue];
    this.listeners.forEach(fn => fn(snapshot));
  }

  enqueue(type: QueueItem["type"], payload: Record<string, unknown>): string {
    const item: QueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      payload,
      status: "pending",
      createdAt: new Date(),
      retryCount: 0,
    };
    this.queue.push(item);
    this.notify();
    return item.id;
  }

  updateStatus(id: string, update: Partial<QueueItem>) {
    this.queue = this.queue.map(item =>
      item.id === id ? { ...item, ...update } : item
    );
    this.notify();
  }

  getSnapshot(): QueueItem[] {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
    this.notify();
  }
}

const queueEngine = new OfflineQueueEngine();

// ─────────────────────────────────────────────────────────────────
// PART 2: Sticker Suggestion Engine
// ─────────────────────────────────────────────────────────────────

interface StickerDef {
  id: string;
  emoji: string;
  name: string;
  keywords: string[];
  category: "emotion" | "action" | "object" | "weather" | "food" | "gesture";
}

/** Sticker vocabulary — production would have 1000s loaded from CDN */
const STICKER_VOCAB: StickerDef[] = [
  // Emotions
  { id: "s1",  emoji: "😂", name: "Crying Laughing", keywords: ["laugh", "funny", "lol", "hilarious", "haha", "joke", "humor", "comedy", "amusing", "rofl", "lmao"], category: "emotion" },
  { id: "s2",  emoji: "❤️", name: "Heart",           keywords: ["love", "heart", "adore", "care", "affection", "romantic", "like", "appreciate", "cherish", "fond", "sweet"], category: "emotion" },
  { id: "s3",  emoji: "😢", name: "Crying",          keywords: ["sad", "cry", "tears", "unhappy", "sorrow", "upset", "depressed", "miss", "heartbroken", "sob", "weep"], category: "emotion" },
  { id: "s4",  emoji: "😡", name: "Angry",           keywords: ["angry", "mad", "furious", "annoyed", "rage", "frustrated", "irritated", "hate", "upset", "livid"], category: "emotion" },
  { id: "s5",  emoji: "😍", name: "Heart Eyes",      keywords: ["beautiful", "gorgeous", "stunning", "amazing", "wow", "incredible", "love", "obsessed", "perfect", "dreamy"], category: "emotion" },
  { id: "s6",  emoji: "🥺", name: "Pleading",        keywords: ["please", "beg", "cute", "puppy", "desperate", "need", "want", "appeal", "implore", "shy"], category: "emotion" },
  { id: "s7",  emoji: "😴", name: "Sleeping",        keywords: ["sleep", "tired", "sleepy", "exhausted", "rest", "nap", "bed", "drowsy", "yawn", "zzz", "late"], category: "emotion" },
  { id: "s8",  emoji: "🤔", name: "Thinking",        keywords: ["think", "wonder", "ponder", "consider", "hmm", "maybe", "question", "curious", "unsure", "decide"], category: "emotion" },
  { id: "s9",  emoji: "🎉", name: "Party",           keywords: ["party", "celebrate", "congrats", "congratulations", "happy", "birthday", "anniversary", "win", "success", "yay"], category: "emotion" },
  { id: "s10", emoji: "😎", name: "Cool",            keywords: ["cool", "awesome", "great", "excellent", "swag", "stylish", "confident", "boss", "rad", "epic"], category: "emotion" },
  // Actions
  { id: "s11", emoji: "👍", name: "Thumbs Up",       keywords: ["ok", "good", "agree", "yes", "approve", "like", "sure", "alright", "deal", "fine", "perfect"], category: "action" },
  { id: "s12", emoji: "👎", name: "Thumbs Down",     keywords: ["no", "bad", "disagree", "nope", "reject", "dislike", "wrong", "fail", "negative", "deny"], category: "action" },
  { id: "s13", emoji: "🤝", name: "Handshake",       keywords: ["deal", "agree", "partner", "collaborate", "meet", "handshake", "cooperate", "together", "team"], category: "action" },
  { id: "s14", emoji: "🙏", name: "Pray",            keywords: ["thank", "thanks", "grateful", "appreciate", "please", "hope", "pray", "blessing", "request", "begging"], category: "action" },
  { id: "s15", emoji: "✋", name: "High Five",        keywords: ["hi", "hello", "stop", "wave", "high five", "greet", "five", "hey", "sup"], category: "action" },
  { id: "s16", emoji: "🏃", name: "Running",         keywords: ["run", "hurry", "fast", "quick", "busy", "rush", "late", "sprint", "jog", "escape"], category: "action" },
  // Objects
  { id: "s17", emoji: "🔥", name: "Fire",            keywords: ["hot", "fire", "lit", "amazing", "burn", "spicy", "trending", "awesome", "smoking", "blazing"], category: "object" },
  { id: "s18", emoji: "💯", name: "Hundred",         keywords: ["perfect", "exactly", "absolutely", "correct", "right", "100", "totally", "agree", "true", "yes"], category: "object" },
  { id: "s19", emoji: "⭐", name: "Star",            keywords: ["star", "great", "excellent", "awesome", "rating", "review", "favorite", "top", "best", "highlight"], category: "object" },
  { id: "s20", emoji: "💀", name: "Skull",           keywords: ["dead", "dying", "kill", "hilarious", "too much", "can't", "exhausted", "expired", "impossible"], category: "object" },
  { id: "s21", emoji: "🎯", name: "Target",          keywords: ["target", "goal", "aim", "focus", "hit", "perfect", "spot on", "accurate", "bullseye", "nailed"], category: "object" },
  { id: "s22", emoji: "⏰", name: "Clock",           keywords: ["time", "late", "clock", "alarm", "schedule", "meeting", "deadline", "hurry", "wait", "hour"], category: "object" },
  // Food
  { id: "s23", emoji: "🍕", name: "Pizza",           keywords: ["pizza", "food", "hungry", "eat", "lunch", "dinner", "snack", "party", "share", "italian"], category: "food" },
  { id: "s24", emoji: "☕", name: "Coffee",          keywords: ["coffee", "morning", "cafe", "wake up", "caffeine", "espresso", "latte", "tired", "energy"], category: "food" },
  { id: "s25", emoji: "🍻", name: "Cheers",          keywords: ["beer", "cheers", "celebrate", "drink", "toast", "party", "weekend", "happy hour", "bar"], category: "food" },
  // Weather
  { id: "s26", emoji: "☀️", name: "Sunny",           keywords: ["sun", "sunny", "hot", "warm", "summer", "beautiful", "clear", "bright", "day", "outside"], category: "weather" },
  { id: "s27", emoji: "🌧️", name: "Rain",            keywords: ["rain", "wet", "cold", "gloomy", "sad", "cloudy", "storm", "umbrella", "inside", "weather"], category: "weather" },
  // Gestures
  { id: "s28", emoji: "🤞", name: "Fingers Crossed", keywords: ["hope", "luck", "wish", "cross", "fingers", "pray", "good luck", "hopefully", "maybe", "please"], category: "gesture" },
  { id: "s29", emoji: "💪", name: "Flex",            keywords: ["strong", "power", "muscle", "workout", "gym", "strength", "can do", "motivation", "beast", "effort"], category: "gesture" },
  { id: "s30", emoji: "🤦", name: "Facepalm",        keywords: ["seriously", "really", "obvious", "stupid", "why", "dumb", "mistake", "forgot", "unbelievable", "smh"], category: "gesture" },
];

/**
 * Trie node for O(prefix_length) lookup.
 * Built once at startup from keyword vocabulary.
 */
class TrieNode {
  children = new Map<string, TrieNode>();
  stickerIds = new Set<string>();
}

class StickerTrie {
  private root = new TrieNode();

  insert(word: string, stickerId: string) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      node.stickerIds.add(stickerId);
    }
  }

  /** Returns all sticker IDs matching the given prefix */
  search(prefix: string): Set<string> {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) return new Set();
      node = node.children.get(char)!;
    }
    return node.stickerIds;
  }
}

/** Build trie from vocabulary — O(total_keywords × avg_keyword_length) */
function buildTrie(vocab: StickerDef[]): StickerTrie {
  const trie = new StickerTrie();
  for (const sticker of vocab) {
    for (const keyword of sticker.keywords) {
      // Insert each prefix of each keyword for prefix matching
      trie.insert(keyword, sticker.id);
    }
  }
  return trie;
}

const STOPWORDS = new Set([
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they",
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "is", "are", "was", "were", "be", "been", "have", "has",
  "do", "does", "did", "will", "would", "can", "could", "may", "might",
  "this", "that", "these", "those", "so", "just", "really", "very",
  "not", "no", "yes", "oh", "hey", "hi", "ok", "okay",
]);

/**
 * Extract meaningful tokens from user input.
 * Pipeline: lowercase → split → remove stopwords + short tokens → deduplicate
 */
function extractTokens(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")  // remove punctuation
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t));

  return [...new Set(tokens)]; // deduplicate
}

interface ScoredSticker {
  sticker: StickerDef;
  score: number;
  matchedKeywords: string[];
}

/**
 * Score stickers for given input tokens.
 *
 * Multi-signal scoring:
 *   1. Keyword match weight:     +10 per full match, +5 per prefix match
 *   2. Keyword coverage bonus:   +3 × matched keywords (rewards broad matches)
 *   3. Usage frequency boost:    +usageCount (learned from user history)
 *   4. Recency boost:            +5 if used in last 5 messages
 */
function scoreStickers(
  tokens: string[],
  trie: StickerTrie,
  stickerMap: Map<string, StickerDef>,
  usageHistory: Map<string, number>,
  recentIds: Set<string>
): ScoredSticker[] {
  if (tokens.length === 0) return [];

  const stickerScores = new Map<string, { score: number; matched: string[] }>();

  for (const token of tokens) {
    // Full keyword match: search by exact token
    const fullMatches = trie.search(token);
    for (const id of fullMatches) {
      const sticker = stickerMap.get(id);
      if (!sticker) continue;
      if (!stickerScores.has(id)) stickerScores.set(id, { score: 0, matched: [] });
      const entry = stickerScores.get(id)!;

      // Bonus for exact keyword match vs. prefix match
      const isExact = sticker.keywords.some(k => k === token);
      entry.score += isExact ? 10 : 5;
      if (!entry.matched.includes(token)) entry.matched.push(token);
    }
  }

  const results: ScoredSticker[] = [];
  for (const [id, { score, matched }] of stickerScores) {
    const sticker = stickerMap.get(id)!;

    let finalScore = score;

    // Coverage bonus: reward stickers that match multiple tokens
    finalScore += matched.length * 3;

    // Usage frequency boost (personalisation)
    finalScore += (usageHistory.get(id) ?? 0) * 2;

    // Recency boost
    if (recentIds.has(id)) finalScore += 5;

    results.push({ sticker, score: finalScore, matchedKeywords: matched });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 8); // top 8 suggestions
}

// ─────────────────────────────────────────────────────────────────
// UI Helpers
// ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<QueueItemStatus, { color: string; bg: string; border: string; label: string; icon: string }> = {
  pending:  { color: "#fbbf24", bg: "#1c1917", border: "#78350f30", label: "Pending",  icon: "⏳" },
  syncing:  { color: "#7dd3fc", bg: "#0c1a2e", border: "#1e3a5f30", label: "Syncing",  icon: "↑" },
  synced:   { color: "#4ade80", bg: "#052e16", border: "#16653430", label: "Synced",   icon: "✓" },
  failed:   { color: "#fca5a5", bg: "#450a0a", border: "#7f1d1d30", label: "Failed",   icon: "✗" },
  retrying: { color: "#a78bfa", bg: "#1e1b4b", border: "#3730a330", label: "Retrying", icon: "↻" },
};

const TYPE_ICONS: Record<QueueItem["type"], string> = {
  message: "💬",
  reaction: "❤️",
  read_receipt: "👁",
  typing: "✍️",
};

// ─────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────

export function OfflineAndStickerDemo() {
  const [activeTab, setActiveTab] = useState<"offline" | "sticker" | "how">("offline");

  // ── Offline queue state ────────────────────────────────────────
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline"
  );
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [totalSynced, setTotalSynced] = useState(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to queue engine
  useEffect(() => {
    const unsub = queueEngine.subscribe(items => {
      setQueueItems(items);
      setTotalSynced(items.filter(i => i.status === "synced").length);
    });
    return unsub;
  }, []);

  // Listen to real browser online/offline events
  useEffect(() => {
    const onOnline = () => setNetworkStatus("online");
    const onOffline = () => setNetworkStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Auto-sync when network comes back online
  useEffect(() => {
    if (networkStatus === "online" && !isSyncing) {
      const pending = queueItems.filter(i => i.status === "pending" || i.status === "retrying");
      if (pending.length > 0) {
        handleSync();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkStatus]);

  const handleAddToQueue = useCallback((type: QueueItem["type"]) => {
    const payloads: Record<QueueItem["type"], Record<string, unknown>> = {
      message:      { content: messageInput || "Hello!", threadId: "t1" },
      reaction:     { emoji: "❤️", messageId: `m${Date.now()}` },
      read_receipt: { messageId: `m${Date.now()}`, readAt: Date.now() },
      typing:       { threadId: "t1", isTyping: true },
    };
    queueEngine.enqueue(type, payloads[type]);
    if (type === "message") setMessageInput("");
  }, [messageInput]);

  const handleSync = useCallback(async () => {
    if (isSyncing || networkStatus !== "online") return;
    setIsSyncing(true);

    const pending = queueEngine.getSnapshot().filter(
      i => i.status === "pending" || i.status === "retrying"
    );

    for (const item of pending) {
      queueEngine.updateStatus(item.id, { status: "syncing" });
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

      // Simulate 15% failure rate
      const success = Math.random() > 0.15;
      if (success) {
        queueEngine.updateStatus(item.id, { status: "synced", syncedAt: new Date() });
      } else {
        const retryCount = item.retryCount + 1;
        if (retryCount >= 3) {
          queueEngine.updateStatus(item.id, {
            status: "failed",
            retryCount,
            error: "Max retries exceeded",
          });
        } else {
          const backoffMs = Math.pow(2, retryCount) * 1000;
          queueEngine.updateStatus(item.id, {
            status: "retrying",
            retryCount,
            nextRetryAt: new Date(Date.now() + backoffMs),
            error: `Attempt ${retryCount} failed (retry in ${backoffMs / 1000}s)`,
          });
        }
      }
    }

    setIsSyncing(false);
  }, [isSyncing, networkStatus]);

  const handleToggleNetwork = useCallback(() => {
    setNetworkStatus(prev => prev === "online" ? "offline" : "online");
  }, []);

  // ── Sticker engine state ───────────────────────────────────────
  const trie = useMemo(() => buildTrie(STICKER_VOCAB), []);
  const stickerMap = useMemo(() =>
    new Map(STICKER_VOCAB.map(s => [s.id, s])), []);

  const [stickerInput, setStickerInput] = useState("");
  const [suggestions, setSuggestions] = useState<ScoredSticker[]>([]);
  const [usageHistory, setUsageHistory] = useState<Map<string, number>>(new Map());
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());
  const [selectedStickers, setSelectedStickers] = useState<StickerDef[]>([]);
  const [debugTokens, setDebugTokens] = useState<string[]>([]);
  const [processingMs, setProcessingMs] = useState<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processStickerInput = useCallback((text: string) => {
    const t0 = performance.now();
    const tokens = extractTokens(text);
    const scored = scoreStickers(tokens, trie, stickerMap, usageHistory, recentIds);
    const elapsed = performance.now() - t0;

    setDebugTokens(tokens);
    setSuggestions(scored);
    setProcessingMs(Math.round(elapsed * 100) / 100);
  }, [trie, stickerMap, usageHistory, recentIds]);

  const handleStickerInputChange = useCallback((value: string) => {
    setStickerInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => processStickerInput(value), 150);
  }, [processStickerInput]);

  const handleStickerSelect = useCallback((sticker: StickerDef) => {
    // Update usage history (personalisation learning)
    setUsageHistory(prev => {
      const next = new Map(prev);
      next.set(sticker.id, (next.get(sticker.id) ?? 0) + 1);
      return next;
    });
    // Track recency (last 5 used)
    setRecentIds(prev => {
      const next = new Set([sticker.id, ...prev]);
      if (next.size > 5) {
        const arr = [...next];
        return new Set(arr.slice(0, 5));
      }
      return next;
    });
    setSelectedStickers(prev => [sticker, ...prev].slice(0, 20));
    setStickerInput("");
    setSuggestions([]);
    setDebugTokens([]);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  const pendingCount = queueItems.filter(i => i.status === "pending" || i.status === "retrying").length;

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              Offline Processing + Client-Side Sticker Suggestions
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Outbox Queue Pattern · Background Sync · Trie-based NLP · Zero-RTT suggestions
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["IndexedDB Outbox", "Background Sync", "Exponential Backoff", "Trie Prefix Search", "Multi-Signal Scoring", "Personalisation", "Debounce", "Offline-First"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "offline" as const, label: "📡 Offline Queue" },
          { id: "sticker" as const, label: "😊 Sticker Suggestions" },
          { id: "how" as const, label: "🔬 How It Works" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0",
            padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Offline Queue Tab ── */}
      {activeTab === "offline" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, maxWidth: 960 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Network status bar */}
            <div style={{
              background: networkStatus === "online" ? "#052e16" : "#450a0a",
              border: `1px solid ${networkStatus === "online" ? "#166534" : "#7f1d1d"}`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: networkStatus === "online" ? "#4ade80" : "#ef4444",
                  boxShadow: networkStatus === "online" ? "0 0 6px #4ade80" : "0 0 6px #ef4444",
                }} />
                <span style={{
                  color: networkStatus === "online" ? "#4ade80" : "#fca5a5",
                  fontWeight: 700, fontSize: 14,
                }}>
                  {networkStatus === "online" ? "● ONLINE" : "● OFFLINE"}
                </span>
                {networkStatus === "offline" && pendingCount > 0 && (
                  <span style={{ color: "#fbbf24", fontSize: 12 }}>
                    — {pendingCount} message{pendingCount !== 1 ? "s" : ""} queued for sync
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleToggleNetwork} style={{
                  background: networkStatus === "online" ? "#7f1d1d" : "#166534",
                  color: networkStatus === "online" ? "#fca5a5" : "#4ade80",
                  border: "none", borderRadius: 6, padding: "6px 14px",
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                }}>
                  {networkStatus === "online" ? "Go Offline ✈" : "Go Online ↑"}
                </button>
                {networkStatus === "online" && pendingCount > 0 && (
                  <button onClick={handleSync} disabled={isSyncing} style={{
                    background: "#1e3a5f", color: "#7dd3fc",
                    border: "1px solid #1e40af30", borderRadius: 6, padding: "6px 14px",
                    cursor: "pointer", fontSize: 12, fontWeight: 700,
                    opacity: isSyncing ? 0.6 : 1,
                  }}>
                    {isSyncing ? "↑ Syncing..." : "↑ Sync Now"}
                  </button>
                )}
              </div>
            </div>

            {/* Send controls */}
            <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", padding: 14 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
                Add to Outbox Queue
                {networkStatus === "offline" && (
                  <span style={{ color: "#fbbf24", marginLeft: 8 }}>
                    (offline — queued to IndexedDB)
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddToQueue("message")}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, background: "#0f172a", color: "#f1f5f9",
                    border: "1px solid #334155", borderRadius: 8,
                    padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
                  }}
                />
                <button onClick={() => handleAddToQueue("message")} style={{
                  background: "#6366f1", color: "#fff", border: "none",
                  borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700,
                }}>Send</button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["reaction", "read_receipt", "typing"] as QueueItem["type"][]).map(type => (
                  <button key={type} onClick={() => handleAddToQueue(type)} style={{
                    background: "#334155", color: "#94a3b8",
                    border: "none", borderRadius: 6, padding: "5px 12px",
                    cursor: "pointer", fontSize: 11,
                  }}>
                    {TYPE_ICONS[type]} Queue {type.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue list */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>
                  Outbox Queue ({queueItems.length} items)
                </div>
                {queueItems.length > 0 && (
                  <button onClick={() => queueEngine.clear()} style={{
                    background: "transparent", color: "#64748b",
                    border: "1px solid #334155", borderRadius: 4,
                    padding: "3px 10px", cursor: "pointer", fontSize: 11,
                  }}>Clear all</button>
                )}
              </div>

              {queueItems.length === 0 ? (
                <div style={{
                  background: "#1e293b", border: "1px dashed #334155",
                  borderRadius: 10, padding: "32px 20px", textAlign: "center", color: "#475569", fontSize: 13,
                }}>
                  Queue is empty — send a message to see the outbox pattern
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[...queueItems].reverse().map((item) => {
                    const cfg = STATUS_CONFIG[item.status];
                    return (
                      <div key={item.id} style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        borderLeft: `3px solid ${cfg.color}`,
                        borderRadius: 8, padding: "10px 14px",
                        transition: "all 0.3s",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{TYPE_ICONS[item.type]}</span>
                            <div>
                              <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>
                                {item.type.replace("_", " ")}
                              </span>
                              {typeof item.payload.content === "string" && (
                                <span style={{ color: "#64748b", fontSize: 11, marginLeft: 8 }}>
                                  "{item.payload.content.slice(0, 30)}"
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            {item.retryCount > 0 && (
                              <span style={{ color: "#64748b", fontSize: 10, fontFamily: "monospace" }}>
                                retry #{item.retryCount}
                              </span>
                            )}
                            <span style={{
                              background: `${cfg.color}20`,
                              color: cfg.color,
                              border: `1px solid ${cfg.color}40`,
                              borderRadius: 12, padding: "2px 8px", fontSize: 10, fontWeight: 700,
                            }}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </div>
                        </div>
                        {item.error && (
                          <div style={{ color: "#64748b", fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>
                            {item.error}
                          </div>
                        )}
                        {item.syncedAt && (
                          <div style={{ color: "#4ade80", fontSize: 10, marginTop: 4 }}>
                            Synced at {item.syncedAt.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Stats + explanation */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Stats */}
            <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", padding: 14 }}>
              <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, marginBottom: 12 }}>Queue Stats</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Total", value: queueItems.length, color: "#94a3b8" },
                  { label: "Synced", value: queueItems.filter(i => i.status === "synced").length, color: "#4ade80" },
                  { label: "Pending", value: queueItems.filter(i => i.status === "pending").length, color: "#fbbf24" },
                  { label: "Failed", value: queueItems.filter(i => i.status === "failed").length, color: "#ef4444" },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "#0f172a", borderRadius: 8, padding: "10px",
                    textAlign: "center",
                  }}>
                    <div style={{ color: s.color, fontWeight: 800, fontSize: 20, fontFamily: "monospace" }}>{s.value}</div>
                    <div style={{ color: "#475569", fontSize: 11 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flow explanation */}
            <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", padding: 14 }}>
              <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
                Outbox Pattern Flow
              </div>
              {[
                { step: "1", text: "User sends → saved to IndexedDB", color: "#fbbf24", icon: "💾" },
                { step: "2", text: "Request Background Sync from SW", color: "#7dd3fc", icon: "📡" },
                { step: "3", text: "Online? → flush queue (FIFO)", color: "#a78bfa", icon: "↑" },
                { step: "4", text: "Success → mark synced, clear item", color: "#4ade80", icon: "✓" },
                { step: "5", text: "Fail → exponential backoff retry", color: "#f472b6", icon: "↻" },
              ].map(f => (
                <div key={f.step} style={{
                  display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8,
                }}>
                  <span style={{
                    background: `${f.color}20`, color: f.color,
                    borderRadius: 20, width: 22, height: 22,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                  }}>{f.step}</span>
                  <span style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
                    {f.icon} {f.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Background Sync note */}
            <div style={{
              background: "#0c1a2e", border: "1px solid #1e3a5f",
              borderRadius: 10, padding: 14, fontSize: 12,
            }}>
              <div style={{ color: "#7dd3fc", fontWeight: 700, marginBottom: 8 }}>
                🔧 Background Sync API
              </div>
              <code style={{ color: "#64748b", fontFamily: "monospace", fontSize: 11, display: "block", lineHeight: 1.8 }}>
                {`// Register sync (main thread)
const reg = await navigator
  .serviceWorker.ready;
await reg.sync.register(
  'sync-outbox'
);

// Service Worker
self.addEventListener('sync', e => {
  if (e.tag === 'sync-outbox') {
    e.waitUntil(flushQueue());
  }
});`}
              </code>
              <div style={{ color: "#475569", fontSize: 10, marginTop: 8 }}>
                Survives tab close · Browser-managed retries · Chromium only (Safari fallback: online event)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticker Suggestions Tab ── */}
      {activeTab === "sticker" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, maxWidth: 900 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Input */}
            <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", padding: 16 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
                Type anything — suggestions appear instantly (client-side only, 0 network requests)
              </div>
              <textarea
                value={stickerInput}
                onChange={e => handleStickerInputChange(e.target.value)}
                placeholder="Try: 'I'm so tired today' or 'that was hilarious' or 'let's celebrate!'"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#0f172a", color: "#f1f5f9",
                  border: "1px solid #334155", borderRadius: 8,
                  padding: "10px 12px", fontSize: 14, fontFamily: "inherit",
                  resize: "none", minHeight: 80,
                }}
                autoFocus
              />

              {/* Debug tokens */}
              {debugTokens.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ color: "#475569", fontSize: 10 }}>Tokens:</span>
                  {debugTokens.map(t => (
                    <span key={t} style={{
                      background: "#1e3a5f", color: "#7dd3fc",
                      border: "1px solid #1e40af30",
                      borderRadius: 4, padding: "1px 7px", fontSize: 10, fontFamily: "monospace",
                    }}>{t}</span>
                  ))}
                  <span style={{ color: "#334155", fontSize: 10, marginLeft: "auto" }}>
                    {processingMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* Suggestions grid */}
            {suggestions.length > 0 ? (
              <div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
                  Suggestions — ranked by relevance score
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {suggestions.map(({ sticker, score, matchedKeywords }) => (
                    <button
                      key={sticker.id}
                      onClick={() => handleStickerSelect(sticker)}
                      title={`${sticker.name} · score: ${score} · matched: ${matchedKeywords.join(", ")}`}
                      style={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 10, padding: "14px 8px",
                        cursor: "pointer",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 6,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#1e3a5f")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#1e293b")}
                    >
                      <span style={{ fontSize: 32 }}>{sticker.emoji}</span>
                      <span style={{ color: "#64748b", fontSize: 9, textAlign: "center" }}>
                        {sticker.name}
                      </span>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                        {matchedKeywords.slice(0, 2).map(kw => (
                          <span key={kw} style={{
                            background: "#1e3a5f", color: "#7dd3fc",
                            fontSize: 8, borderRadius: 3, padding: "1px 4px",
                          }}>{kw}</span>
                        ))}
                      </div>
                      <span style={{
                        color: "#334155", fontSize: 9, fontFamily: "monospace",
                      }}>score: {score}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : stickerInput.length > 0 ? (
              <div style={{
                background: "#1e293b", border: "1px dashed #334155",
                borderRadius: 10, padding: "24px", textAlign: "center", color: "#475569", fontSize: 13,
              }}>
                No stickers match yet — keep typing...
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                {STICKER_VOCAB.slice(0, 12).map(s => (
                  <button key={s.id} onClick={() => handleStickerSelect(s)} style={{
                    background: "#1e293b", border: "1px solid #1e293b",
                    borderRadius: 8, padding: 10, cursor: "pointer", fontSize: 28,
                    transition: "all 0.1s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#334155")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#1e293b")}
                    title={s.name}
                  >{s.emoji}</button>
                ))}
              </div>
            )}

            {/* Selected stickers history */}
            {selectedStickers.length > 0 && (
              <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", padding: 14 }}>
                <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
                  Your recently used (personalisation data)
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedStickers.map((s, i) => (
                    <div key={`${s.id}-${i}`} style={{ position: "relative" }}>
                      <span style={{ fontSize: 28 }}>{s.emoji}</span>
                      {(usageHistory.get(s.id) ?? 0) > 1 && (
                        <span style={{
                          position: "absolute", top: -4, right: -4,
                          background: "#6366f1", color: "#fff",
                          borderRadius: 10, fontSize: 9, padding: "1px 5px", fontWeight: 700,
                        }}>{usageHistory.get(s.id)}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ color: "#475569", fontSize: 10, marginTop: 8 }}>
                  Usage counts boost suggestion score. Try typing something related to your used stickers.
                </div>
              </div>
            )}
          </div>

          {/* Right: algorithm panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", padding: 14 }}>
              <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
                Scoring Algorithm
              </div>
              {[
                { signal: "Exact keyword match", value: "+10", color: "#4ade80" },
                { signal: "Prefix keyword match", value: "+5", color: "#86efac" },
                { signal: "Per token matched (coverage)", value: "+3×n", color: "#fbbf24" },
                { signal: "Usage history (personalisation)", value: "+2×uses", color: "#a78bfa" },
                { signal: "Recency boost (last 5 used)", value: "+5", color: "#f472b6" },
              ].map(s => (
                <div key={s.signal} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "6px 0", borderBottom: "1px solid #334155",
                }}>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{s.signal}</span>
                  <span style={{ color: s.color, fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#1e293b", borderRadius: 10, border: "1px solid #334155", padding: 14 }}>
              <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 12, marginBottom: 10 }}>
                Trie Structure (prefix lookup)
              </div>
              <pre style={{
                margin: 0, color: "#475569", fontSize: 10, fontFamily: "monospace",
                lineHeight: 1.8, background: "#0f172a", padding: 10, borderRadius: 6,
              }}>
{`"la"  → laugh, late, latte
  ↓
"lau" → laugh
  ↓ 
"laug"→ {😂 s1}
"lau" → {😂 s1}

"lat" → late, latte
  ↓
"late"→ {⏰ s22, 🏃 s16}
  ↓
"latt"→ {☕ s24}

O(k) lookup where k = prefix length
Entire ${STICKER_VOCAB.length} stickers indexed in <1ms`}
              </pre>
            </div>

            <div style={{ background: "#0c1a2e", border: "1px solid #1e3a5f", borderRadius: 10, padding: 14, fontSize: 11 }}>
              <div style={{ color: "#7dd3fc", fontWeight: 700, marginBottom: 8 }}>⚡ Performance</div>
              <div style={{ color: "#475569", lineHeight: 1.8 }}>
                <div>• <b style={{ color: "#94a3b8" }}>Debounced:</b> 150ms delay — no work per keystroke</div>
                <div>• <b style={{ color: "#94a3b8" }}>Trie:</b> O(k) lookup (k = token length)</div>
                <div>• <b style={{ color: "#94a3b8" }}>Scoring:</b> {STICKER_VOCAB.length} stickers scored in &lt;1ms</div>
                <div>• <b style={{ color: "#94a3b8" }}>Network:</b> 0 RTT — fully offline capable</div>
                <div>• <b style={{ color: "#94a3b8" }}>Memory:</b> ~15KB for full vocabulary</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── How It Works Tab ── */}
      {activeTab === "how" && (
        <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "Outbox Pattern — Offline-First Architecture",
              color: "#6366f1",
              icon: "📦",
              content: [
                { label: "Problem", text: "Native fetch() fails when offline. User data lost, no retry, bad UX." },
                { label: "Solution", text: "Write to local IndexedDB 'outbox' store FIRST, then sync to server. UI never waits for network!" },
                { label: "Consistency", text: "FIFO order preserved: messages synced in creation order, even after reconnect." },
                { label: "Durability", text: "IndexedDB persists through page refresh, app close, system restart." },
                { label: "Retry", text: "Exponential backoff: 1s → 2s → 4s → fail. Prevents hammering the server." },
              ],
            },
            {
              title: "Background Sync API — Reliable Deferred Sync",
              color: "#0891b2",
              icon: "📡",
              content: [
                { label: "What it is", text: "Service Worker API: browser wakes up the SW when connectivity is stable — even if tab is closed!" },
                { label: "Advantage vs online event", text: "Browser handles retries, timing, and wake-up. More reliable than window.addEventListener('online', ...)" },
                { label: "Support", text: "Chrome/Edge (Chromium): full support. Safari/Firefox: fallback to online event listener." },
                { label: "Pattern", text: "SW is stateless — NEVER store unsynced data in variables. Always commit to IndexedDB before registering sync." },
                { label: "Use case", text: "Chat apps (messages sent offline), forms, analytics events, file uploads." },
              ],
            },
            {
              title: "Client-Side Sticker Suggestion Engine",
              color: "#10b981",
              icon: "🧠",
              content: [
                { label: "Input pipeline", text: "Text → tokenize → lowercase → remove stopwords → deduplicate. E.g. 'I'm so tired today' → ['tired', 'today']" },
                { label: "Trie lookup", text: "Prefix tree built from all keywords at startup. O(k) lookup per token (k = token length). 30 stickers, 200+ keywords indexed in <1ms." },
                { label: "Scoring", text: "Multi-signal: exact match (+10), prefix (+5), coverage bonus (+3×n matched), usage history (+2×count), recency (+5). Top 8 shown." },
                { label: "Personalisation", text: "Usage history stored in memory. Selecting a sticker increments its weight — future suggestions rank it higher." },
                { label: "Performance", text: "Debounced 150ms. Entire scoring pipeline <1ms. Zero network requests. Works fully offline." },
              ],
            },
            {
              title: "Why Client-Side? (vs Server-Side Suggestions)",
              color: "#f59e0b",
              icon: "⚡",
              content: [
                { label: "Latency", text: "Server round-trip: 100-400ms+. Client-side: <1ms. Instant suggestions feel magical." },
                { label: "Offline", text: "Works without any connectivity — critical for chat apps." },
                { label: "Privacy", text: "Typing data never leaves the device. No server logs of what users type." },
                { label: "Cost", text: "Zero server compute for suggestions. Scales to millions of users for free." },
                { label: "Limitation", text: "Vocabulary must be downloaded (once, cached). Complex NLP (sentiment, multilingual) better on server." },
              ],
            },
          ].map(section => (
            <div key={section.title} style={{
              background: "#1e293b",
              border: `1px solid ${section.color}30`,
              borderLeft: `4px solid ${section.color}`,
              borderRadius: 10, padding: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <h3 style={{ margin: 0, color: section.color, fontSize: 15, fontWeight: 700 }}>
                  {section.title}
                </h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {section.content.map(item => (
                  <div key={item.label} style={{ display: "flex", gap: 10 }}>
                    <span style={{
                      color: section.color, fontWeight: 700, fontSize: 11,
                      minWidth: 100, flexShrink: 0, paddingTop: 1,
                    }}>{item.label}:</span>
                    <span style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OfflineAndStickerDemo;
