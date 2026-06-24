// =============================================================
// SHARED STORE: Cross-MFE State Management
// =============================================================
//
// TẠI SAO CẦN SHARED STORE?
//
// CustomEvent là "fire-and-forget":
//   ❌ Nếu Cart MFE chưa mount khi event fire → miss event
//   ❌ Không có "current state" → MFE mới mount không biết state hiện tại
//   ❌ Nhiều MFE listen cùng event → khó debug
//
// Shared Store = "state + subscribe":
//   ✅ Mọi MFE lấy được current state NGAY khi mount
//   ✅ Subscribe để nhận updates
//   ✅ Single source of truth
//   ✅ Debuggable: console.log(store.getState())
//
// CÁCH CHIA SẺ:
//   Store được shared via Module Federation singleton
//   → Tất cả MFEs dùng CÙNG 1 instance
//   → State đồng bộ tự động
//
// =============================================================

// ---- Generic Store Implementation ----
// (Giống Zustand nhưng zero-dependency, dễ hiểu)

// ---- SINGLETON PATTERN for Module Federation ----
// VẤN ĐỀ: Mỗi MFE bundle riêng → import store.ts → tạo instance riêng
// → 3 MFEs = 3 cartStore instances = state KHÔNG đồng bộ!
//
// FIX: Mount lên window. Nếu đã tồn tại → dùng lại.
// Đây là pattern chuẩn cho Module Federation khi không dùng shared config.
//
const _global = (typeof window !== 'undefined' ? window : globalThis) as Record<string, unknown>;
const MFE_NAMESPACE = '__MFE_STORES__';

if (!_global[MFE_NAMESPACE]) {
  _global[MFE_NAMESPACE] = {};
}

function getSingleton<T>(key: string, factory: () => T): T {
  const stores = _global[MFE_NAMESPACE] as Record<string, unknown>;
  if (!stores[key]) {
    stores[key] = factory();
  }
  return stores[key] as T;
}

type Listener<T> = (state: T) => void;

export function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener<T>>();

  return {
    getState: () => state,

    setState: (partial: Partial<T> | ((prev: T) => Partial<T>)) => {
      const nextPartial =
        typeof partial === "function" ? partial(state) : partial;
      state = { ...state, ...nextPartial };
      listeners.forEach((listener) => listener(state));
    },

    subscribe: (listener: Listener<T>) => {
      listeners.add(listener);
      // ✅ Gọi ngay với current state — MFE mới mount nhận state đúng
      listener(state);
      return () => listeners.delete(listener);
    },

    // Debug helper
    _debug: () => ({
      state,
      listenerCount: listeners.size,
    }),
  };
}

// ---- Cart Store ----
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export const cartStore = getSingleton('cartStore', () => createStore<CartState>({
  items: [],
  isOpen: false,
}));

// Cart actions — bất kỳ MFE nào cũng gọi được
export const cartActions = {
  addItem: (product: { id: string; name: string; price: number }) => {
    cartStore.setState((prev) => {
      const existing = prev.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          items: prev.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        items: [...prev.items, { ...product, quantity: 1 }],
      };
    });
    // Also fire event for logging/analytics (optional)
    window.dispatchEvent(
      new CustomEvent("mfe:cart:add", { detail: product })
    );
  },

  removeItem: (productId: string) => {
    cartStore.setState((prev) => ({
      items: prev.items.filter((item) => item.id !== productId),
    }));
  },

  clearCart: () => {
    cartStore.setState({ items: [] });
  },

  toggleCart: () => {
    cartStore.setState((prev) => ({ isOpen: !prev.isOpen }));
  },
};

// ---- User Store ----
export interface UserState {
  user: { name: string; email: string; avatar: string } | null;
  isLoggedIn: boolean;
  theme: "light" | "dark";
  locale: "vi" | "en";
}

export const userStore = getSingleton('userStore', () => createStore<UserState>({
  user: { name: "Trường Nguyễn", email: "truong@cake.vn", avatar: "👤" },
  isLoggedIn: true,
  theme: "light",
  locale: "vi",
}));

export const userActions = {
  login: (user: UserState["user"]) => {
    userStore.setState({ user, isLoggedIn: true });
  },
  logout: () => {
    userStore.setState({ user: null, isLoggedIn: false });
    cartActions.clearCart();
  },
  toggleTheme: () => {
    userStore.setState((prev) => ({
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  },
  setLocale: (locale: "vi" | "en") => {
    userStore.setState({ locale });
  },
};

// ---- React Hook ----
// Dùng trong bất kỳ MFE nào
import { useState, useEffect } from "react";

export function useStore<T>(
  store: ReturnType<typeof createStore<T>>
): T {
  const [state, setState] = useState<T>(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return () => { unsubscribe(); }; // void cleanup — Set.delete() returns boolean, useEffect needs void
  }, [store]);

  return state;
}

// Convenience hooks
export function useCart() {
  return useStore(cartStore);
}

export function useUser() {
  return useStore(userStore);
}

// ---- Event Log Store (for demo) ----
export interface EventLogEntry {
  time: string;
  source: string;
  action: string;
  data: string;
}

export interface EventLogState {
  events: EventLogEntry[];
}

export const eventLogStore = getSingleton('eventLogStore', () => createStore<EventLogState>({
  events: [],
}));

export function logEvent(source: string, action: string, data: unknown) {
  eventLogStore.setState((prev) => ({
    events: [
      {
        time: new Date().toLocaleTimeString("vi-VN"),
        source,
        action,
        data: JSON.stringify(data),
      },
      ...prev.events.slice(0, 49), // Keep last 50
    ],
  }));
}

// =============================================================
// EVENT BUS: Cross-MFE Communication (Pattern #2)
// =============================================================
//
// CONCEPT:
//   Event Bus = Trạm trung chuyển tin nhắn giữa các MFEs
//   Giống "bưu điện trung tâm": ai cũng gửi/nhận qua đây
//
// KHÁC VỚI:
//   - CustomEvent: browser-native, untyped, no replay
//   - Shared Store: state-centric (what IS the current state?)
//   - Event Bus: event-centric (what HAPPENED?)
//
// KHI NÀO DÙNG:
//   ✅ Cross-MFE notifications (product viewed, error occurred)
//   ✅ Analytics/tracking events
//   ✅ Orchestration ("products loaded" → host show banner)
//   ✅ Events cần replay cho late subscribers
//   ❌ KHÔNG dùng cho state sync (dùng shared store)
//
// VẤN ĐỀ THỰC TẾ:
//   1. Memory leak: listeners không cleanup → tích lũy
//   2. Event storm: quá nhiều events → performance degradation
//   3. Circular events: A emits → B handles → emits → A handles → ∞
//   4. Typing: event names là strings → typo = silent bugs
//   5. Ordering: không guarantee thứ tự handlers
//
// =============================================================

// ---- Typed Event Registry ----
// Mỗi event có type cố định → TypeScript catch typos
export interface MFEEventMap {
  // Products MFE events
  "products:loaded": { count: number };
  "products:viewed": { productId: string; name: string };
  "products:search": { query: string; results: number };
  "products:filter": { category: string };

  // Cart MFE events
  "cart:item-added": { id: string; name: string; price: number };
  "cart:item-removed": { id: string };
  "cart:cleared": {};
  "cart:checkout-started": { totalItems: number; totalPrice: number };

  // Host/Auth events
  "auth:login": { userId: string; name: string };
  "auth:logout": {};
  "auth:token-refreshed": {};

  // UI events
  "ui:theme-changed": { theme: "light" | "dark" };
  "ui:locale-changed": { locale: "vi" | "en" };
  "ui:notification": { message: string; type: "info" | "success" | "error" };

  // System events
  "mfe:loaded": { name: string; version: string; loadTime: number };
  "mfe:error": { name: string; error: string };
}

export type MFEEventName = keyof MFEEventMap;

interface EventBusEntry {
  time: number;
  event: string;
  data: unknown;
  source: string;
}

type EventHandler<T = unknown> = (data: T, meta: { source: string; time: number }) => void;

interface SubscriptionOptions {
  /** Source MFE name for debugging */
  source?: string;
  /** Only fire once, then auto-unsubscribe */
  once?: boolean;
}

// ---- Event Bus Implementation ----
export function createEventBus(options?: {
  /** Max events to buffer for replay (0 = no buffer) */
  bufferSize?: number;
  /** Enable console logging for debugging */
  debug?: boolean;
  /** Max listeners per event before warning */
  maxListeners?: number;
}) {
  const {
    bufferSize = 20,
    debug = false,
    maxListeners = 50,
  } = options || {};

  // Stores: event name → Set of handlers
  const handlers = new Map<string, Set<{ fn: EventHandler; opts: SubscriptionOptions }>>();
  // Wildcard listeners (listen to ALL events)
  const wildcardHandlers = new Set<{ fn: EventHandler; opts: SubscriptionOptions }>();
  // Event buffer for replay
  const buffer: EventBusEntry[] = [];
  // Middleware pipeline
  const middleware: Array<(entry: EventBusEntry, next: () => void) => void> = [];
  // Circular event detection
  let emitDepth = 0;
  const MAX_EMIT_DEPTH = 10;

  function emit<K extends MFEEventName>(
    event: K,
    data: MFEEventMap[K],
    source: string = "unknown"
  ) {
    // ---- Guard: Circular event detection ----
    emitDepth++;
    if (emitDepth > MAX_EMIT_DEPTH) {
      console.error(
        `[EventBus] Circular event detected! "${event}" exceeded max depth ${MAX_EMIT_DEPTH}. ` +
        `This usually means Handler A emits → Handler B emits → Handler A emits → ∞`
      );
      emitDepth--;
      return;
    }

    const entry: EventBusEntry = {
      time: Date.now(),
      event,
      data,
      source,
    };

    if (debug) {
      console.log(`[EventBus] 📡 ${source} → ${event}`, data);
    }

    // ---- Buffer for replay ----
    if (bufferSize > 0) {
      buffer.push(entry);
      if (buffer.length > bufferSize) {
        buffer.shift();
      }
    }

    // ---- Run middleware pipeline ----
    let middlewareIndex = 0;
    const runMiddleware = () => {
      if (middlewareIndex < middleware.length) {
        const mw = middleware[middlewareIndex++];
        mw(entry, runMiddleware);
      } else {
        // ---- Deliver to handlers ----
        deliverEvent(event, data, { source, time: entry.time });
      }
    };
    runMiddleware();

    // Log to event log store for demo UI
    logEvent(source, event, data);

    emitDepth--;
  }

  function deliverEvent(event: string, data: unknown, meta: { source: string; time: number }) {
    const eventHandlers = handlers.get(event);
    if (eventHandlers) {
      const toRemove: { fn: EventHandler; opts: SubscriptionOptions }[] = [];
      eventHandlers.forEach((entry) => {
        try {
          entry.fn(data, meta);
          if (entry.opts.once) {
            toRemove.push(entry);
          }
        } catch (err) {
          // ---- Error isolation: 1 handler crash ≠ all handlers crash ----
          console.error(`[EventBus] Handler error for "${event}":`, err);
        }
      });
      toRemove.forEach((entry) => eventHandlers.delete(entry));
    }

    // Wildcard handlers
    wildcardHandlers.forEach((entry) => {
      try {
        entry.fn({ event, data }, meta);
        if (entry.opts.once) {
          wildcardHandlers.delete(entry);
        }
      } catch (err) {
        console.error(`[EventBus] Wildcard handler error:`, err);
      }
    });
  }

  function on<K extends MFEEventName>(
    event: K,
    handler: EventHandler<MFEEventMap[K]>,
    opts: SubscriptionOptions = {}
  ): () => void {
    if (!handlers.has(event)) {
      handlers.set(event, new Set());
    }

    const eventHandlers = handlers.get(event)!;

    // ---- Guard: Max listeners warning ----
    if (eventHandlers.size >= maxListeners) {
      console.warn(
        `[EventBus] ⚠️ "${event}" has ${eventHandlers.size} listeners. ` +
        `Possible memory leak! Each MFE mount adds listeners — are you cleaning up in useEffect return?`
      );
    }

    const entry = { fn: handler as EventHandler, opts };
    eventHandlers.add(entry);

    // Return unsubscribe function
    return () => {
      eventHandlers.delete(entry);
      if (eventHandlers.size === 0) {
        handlers.delete(event);
      }
    };
  }

  function once<K extends MFEEventName>(
    event: K,
    handler: EventHandler<MFEEventMap[K]>
  ): () => void {
    return on(event, handler, { once: true });
  }

  function onAll(
    handler: EventHandler<{ event: string; data: unknown }>,
    opts: SubscriptionOptions = {}
  ): () => void {
    const entry = { fn: handler as EventHandler, opts };
    wildcardHandlers.add(entry);
    return () => wildcardHandlers.delete(entry);
  }

  /**
   * Replay buffered events to a late subscriber
   * USE CASE: MFE mounts sau khi events đã fire → replay để catch up
   *
   * ⚠️ ISSUES THỰC TẾ:
   * 1. Replay có thể gây duplicate side effects (API calls, analytics)
   * 2. Replay events cũ có thể outdated (giá sản phẩm đã thay đổi)
   * 3. Phải lọc theo thời gian, không replay tất cả
   */
  function replay<K extends MFEEventName>(
    event: K,
    handler: EventHandler<MFEEventMap[K]>,
    opts?: { maxAge?: number } // milliseconds
  ): () => void {
    const now = Date.now();
    const maxAge = opts?.maxAge || 30000; // default 30 seconds

    // Replay matching buffered events
    buffer.forEach((entry) => {
      if (entry.event === event && (now - entry.time) < maxAge) {
        try {
          (handler as EventHandler)(entry.data, { source: entry.source, time: entry.time });
        } catch (err) {
          console.error(`[EventBus] Replay handler error:`, err);
        }
      }
    });

    // Then subscribe for future events
    return on(event, handler);
  }

  function use(mw: (entry: EventBusEntry, next: () => void) => void) {
    middleware.push(mw);
  }

  function _debug() {
    const listenerCounts: Record<string, number> = {};
    handlers.forEach((set, event) => {
      listenerCounts[event] = set.size;
    });
    return {
      totalEvents: buffer.length,
      bufferSize,
      listenerCounts,
      wildcardListeners: wildcardHandlers.size,
      middlewareCount: middleware.length,
    };
  }

  return { emit, on, once, onAll, replay, use, _debug, getBuffer: () => [...buffer] };
}

// ---- Singleton Event Bus ----
export const eventBus = getSingleton('eventBus', () => createEventBus({
  bufferSize: 50,
  debug: true,
  maxListeners: 20,
}));

// ---- React Hook for Event Bus ----
export function useEventBus<K extends MFEEventName>(
  event: K,
  handler: EventHandler<MFEEventMap[K]>,
  deps: unknown[] = []
) {
  useEffect(() => {
    const unsubscribe = eventBus.on(event, handler);
    return unsubscribe; // ✅ Cleanup on unmount — prevent memory leak
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}

// Hook that replays buffered events + subscribes
export function useEventBusWithReplay<K extends MFEEventName>(
  event: K,
  handler: EventHandler<MFEEventMap[K]>,
  opts?: { maxAge?: number }
) {
  useEffect(() => {
    const unsubscribe = eventBus.replay(event, handler, opts);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}

// Hook that collects events into state
export function useEventLog<K extends MFEEventName>(event: K) {
  const [events, setEvents] = useState<Array<{ data: MFEEventMap[K]; time: number; source: string }>>([]);

  useEffect(() => {
    const unsubscribe = eventBus.on(event, (data, meta) => {
      setEvents((prev) => [{ data: data as MFEEventMap[K], time: meta.time, source: meta.source }, ...prev.slice(0, 29)]);
    });
    return unsubscribe;
  }, [event]);

  return events;
}

