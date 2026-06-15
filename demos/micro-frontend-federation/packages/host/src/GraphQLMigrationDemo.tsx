/**
 * GraphQLMigrationDemo.tsx
 *
 * Migration from Webhooks / REST to GraphQL on the Front-End
 *
 * CONTEXT
 *   Drove the front-end migration from ad-hoc REST + webhook integrations
 *   to a unified GraphQL layer — schema design, Apollo Client setup,
 *   codegen pipeline, incremental query-by-query migration, and replacement
 *   of webhook receivers with GraphQL subscriptions.
 *
 * TABS
 *   🔍 Before vs After    — REST waterfall & over-fetching vs GraphQL precision
 *   🎯 Query Explorer     — interactive field picker: auto-generates query, shows savings
 *   📋 Migration Phases   — phased strategy + code patterns per phase
 *   ⚡ Subscriptions      — polling/webhook vs GraphQL subscription live demo
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

interface FieldNode {
  key:       string;
  label:     string;
  type:      string;
  selected:  boolean;
  children?: FieldNode[];
}

interface RestRequest {
  id:       string;
  method:   string;
  endpoint: string;
  durationMs: number;
  startMs:  number;
  fields:   number;   // fields returned
  needed:   number;   // fields actually used
}

interface SubEvent {
  id:        string;
  timestamp: string;
  type:      string;
  payload:   Record<string, string | number>;
}

// ─────────────────────────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────────────────────────

const REST_REQUESTS: RestRequest[] = [
  { id: "r1", method: "GET",  endpoint: "/api/users/me",               durationMs: 120, startMs:   0, fields: 24, needed: 4 },
  { id: "r2", method: "GET",  endpoint: "/api/users/42/orders",         durationMs: 180, startMs: 120, fields: 18, needed: 3 },
  { id: "r3", method: "GET",  endpoint: "/api/orders/1001/items",       durationMs: 140, startMs: 300, fields: 12, needed: 3 },
  { id: "r4", method: "GET",  endpoint: "/api/orders/1002/items",       durationMs: 155, startMs: 300, fields: 12, needed: 3 },
  { id: "r5", method: "POST", endpoint: "/webhooks/register",           durationMs: 90,  startMs: 455, fields: 8,  needed: 1 },
];

const GRAPHQL_DURATION = 195; // single round-trip
const REST_TOTAL = Math.max(...REST_REQUESTS.map(r => r.startMs + r.durationMs));

// Schema fields for the interactive explorer
const INITIAL_FIELDS: FieldNode[] = [
  {
    key: "user", label: "user", type: "User", selected: true,
    children: [
      { key: "user.id",        label: "id",        type: "ID!",     selected: true  },
      { key: "user.name",      label: "name",       type: "String!", selected: true  },
      { key: "user.email",     label: "email",      type: "String!", selected: true  },
      { key: "user.avatar",    label: "avatar",     type: "String",  selected: false },
      { key: "user.role",      label: "role",       type: "Role!",   selected: false },
      { key: "user.bio",       label: "bio",        type: "String",  selected: false },
      { key: "user.createdAt", label: "createdAt",  type: "DateTime",selected: false },
      { key: "user.updatedAt", label: "updatedAt",  type: "DateTime",selected: false },
      { key: "user.plan",      label: "plan",       type: "Plan",    selected: false },
    ],
  },
  {
    key: "orders", label: "orders", type: "[Order!]!", selected: true,
    children: [
      { key: "orders.id",        label: "id",        type: "ID!",     selected: true  },
      { key: "orders.total",     label: "total",      type: "Float!",  selected: true  },
      { key: "orders.status",    label: "status",     type: "Status!", selected: true  },
      { key: "orders.createdAt", label: "createdAt",  type: "DateTime",selected: false },
      { key: "orders.currency",  label: "currency",   type: "String",  selected: false },
      { key: "orders.notes",     label: "notes",      type: "String",  selected: false },
      {
        key: "orders.items", label: "items", type: "[Item!]!", selected: true,
        children: [
          { key: "orders.items.id",    label: "id",    type: "ID!",     selected: true  },
          { key: "orders.items.name",  label: "name",  type: "String!", selected: true  },
          { key: "orders.items.price", label: "price", type: "Float!",  selected: false },
          { key: "orders.items.qty",   label: "qty",   type: "Int!",    selected: true  },
          { key: "orders.items.sku",   label: "sku",   type: "String",  selected: false },
        ],
      },
    ],
  },
];

const MIGRATION_PHASES = [
  {
    id: "schema",
    phase: "Phase 1",
    title: "Schema Design & Codegen",
    status: "done",
    duration: "Week 1–2",
    desc: "Define the GraphQL schema collaboratively with backend. Set up graphql-codegen to auto-generate TypeScript types and typed hooks from the schema.",
    before: `// ❌ Before — manually typed REST response (often wrong/stale)
interface UserResponse {
  data: {
    user_id: number;   // snake_case, no guarantee of accuracy
    display_name: string;
    email_address: string;
    // ... 20 more fields, many unused, types guessed
  };
}

async function fetchUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  const json: UserResponse = await res.json(); // cast = false safety
  return json.data;
}`,
    after: `// ✅ After — auto-generated types from schema (always accurate)
// codegen.yml:
//   schema: https://api.example.com/graphql
//   generates:
//     src/__generated__/graphql.ts: { plugins: [typescript, typescript-operations, typed-document-node] }

// Generated automatically — never written by hand:
export type GetUserQuery = {
  user: {
    __typename?: "User";
    id: string;
    name: string;
    email: string;
    orders: Array<{
      __typename?: "Order";
      id: string;
      total: number;
      status: OrderStatus;
    }>;
  } | null;
};

// Usage — fully typed, IDE autocomplete on every field:
const { data } = useGetUserQuery({ variables: { id } });
//     ^--- data.user.name, data.user.orders[0].total — all type-safe`,
  },
  {
    id: "apollo",
    phase: "Phase 2",
    title: "Apollo Client Setup + Adapter Layer",
    status: "done",
    duration: "Week 2–3",
    desc: "Configure Apollo Client with auth middleware, error handling, and normalized cache. Build a thin adapter layer so existing components keep the same hook API during migration.",
    before: `// ❌ Before — bespoke fetch wrapper, no cache, no error normalisation
const useUser = (id: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${id}\`, {
      headers: { Authorization: \`Bearer \${getToken()}\` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => { setData(json.data); setLoading(false); })
      .catch(err => { setError(err); setLoading(false); });
  }, [id]);

  return { data, loading, error };
};`,
    after: `// ✅ After — Apollo Client with JWT middleware + in-memory cache
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const authLink = setContext(async (_, { headers }) => ({
  headers: { ...headers, authorization: \`Bearer \${await getTokenSilently()}\` },
}));

export const client = new ApolloClient({
  link: authLink.concat(createHttpLink({ uri: "/graphql" })),
  cache: new InMemoryCache({
    typePolicies: {
      User:  { keyFields: ["id"] },  // normalised by ID
      Order: { keyFields: ["id"] },  // deduplicates across queries
    },
  }),
  defaultOptions: { watchQuery: { errorPolicy: "all" } },
});

// Adapter — same hook API, backed by GraphQL internally
const useUser = (id: string) =>
  useGetUserQuery({ variables: { id } });
//  Consumer components don't change at all during migration! ✅`,
  },
  {
    id: "queries",
    phase: "Phase 3",
    title: "Migrate Queries (N+1 → Single Query)",
    status: "done",
    duration: "Week 3–5",
    desc: "Replace cascading REST calls with a single GraphQL query. Eliminated N+1 fetching patterns — previously required 1 + N requests for user + their orders.",
    before: `// ❌ Before — 1 + N REST calls, sequential waterfall
async function loadDashboard(userId: string) {
  // Request 1: get user (120ms)
  const user = await fetch(\`/api/users/\${userId}\`).then(r => r.json());

  // Request 2: get orders (180ms, starts after request 1)
  const orders = await fetch(\`/api/users/\${userId}/orders\`).then(r => r.json());

  // Requests 3..N: get items for EACH order (parallel, but after request 2)
  const items = await Promise.all(
    orders.map(o => fetch(\`/api/orders/\${o.id}/items\`).then(r => r.json()))
  );
  // Total: 120 + 180 + max(items latency) = ~455ms + N fetches
  return { user, orders, items };
}`,
    after: `// ✅ After — single GraphQL query, single round-trip (195ms)
const GET_DASHBOARD = gql\`
  query GetDashboard($userId: ID!) {
    user(id: $userId) {
      id name email
      orders {
        id total status
        items { id name qty }
      }
    }
  }
\`;

function Dashboard({ userId }: { userId: string }) {
  const { data, loading, error } = useQuery(GET_DASHBOARD, {
    variables: { userId },
  });
  // All data in one response, resolved server-side via DataLoader
  // No N+1, no waterfall, no manual state coordination
}
// Latency: 120ms + 180ms + 155ms = 455ms → 195ms (-57%)`,
  },
  {
    id: "mutations",
    phase: "Phase 4",
    title: "Migrate Mutations + Optimistic UI",
    status: "done",
    duration: "Week 5–6",
    desc: "Replace POST/PATCH/DELETE REST calls with typed mutations. Added optimistic updates — UI responds instantly before server confirms, with automatic rollback on failure.",
    before: `// ❌ Before — manual optimistic update + rollback
const [saving, setSaving] = useState(false);
const updateOrder = async (id: string, status: string) => {
  setSaving(true);
  const previous = orders.find(o => o.id === id); // snapshot for rollback
  setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); // optimistic
  try {
    await fetch(\`/api/orders/\${id}\`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    setOrders(prev => prev.map(o => o.id === id ? previous! : o)); // rollback
  } finally { setSaving(false); }
};`,
    after: `// ✅ After — Apollo handles optimistic update + cache rollback
const [updateOrder, { loading }] = useMutation(UPDATE_ORDER_STATUS, {
  optimisticResponse: ({ id, status }) => ({
    updateOrder: { __typename: "Order", id, status }, // instant UI update
  }),
  update(cache, { data }) {
    cache.modify({
      id: cache.identify({ __typename: "Order", id: data.updateOrder.id }),
      fields: { status: () => data.updateOrder.status },
    });
  },
  onError(err) {
    // Apollo automatically reverts optimisticResponse on error
    toast.error(\`Failed: \${err.message}\`);
  },
});
// 4 lines vs 20 lines. Automatic rollback. Type-safe. ✅`,
  },
  {
    id: "subscriptions",
    phase: "Phase 5",
    title: "Replace Webhooks with Subscriptions",
    status: "done",
    duration: "Week 6–7",
    desc: "Replaced outbound webhook receivers and polling intervals with GraphQL subscriptions over WebSocket. Eliminated webhook signature verification, retry queues, and cron-based polling.",
    before: `// ❌ Before — webhook receiver endpoint + polling fallback
// Express webhook handler (separate service):
app.post("/webhooks/order-update", verifySignature, async (req, res) => {
  const { orderId, status } = req.body;
  await db.orders.update({ id: orderId, status });
  // Broadcast to all connected clients via Redis Pub/Sub → Socket.IO
  io.to(\`order:\${orderId}\`).emit("order-updated", { orderId, status });
  res.status(200).end();
});

// Client — polling fallback for missed webhooks:
useEffect(() => {
  const id = setInterval(() => refetchOrders(), 5000); // 5s poll
  return () => clearInterval(id);
}, []);`,
    after: `// ✅ After — GraphQL subscription (WebSocket, no extra infrastructure)
const ORDER_UPDATES = gql\`
  subscription OnOrderUpdate($userId: ID!) {
    orderUpdated(userId: $userId) {
      id status total updatedAt
    }
  }
\`;

function OrderFeed({ userId }: { userId: string }) {
  const { data } = useSubscription(ORDER_UPDATES, {
    variables: { userId },
    onData({ client, data }) {
      // Apollo automatically updates the normalised cache
      // Any query watching Order:id sees the update instantly
      client.cache.modify({
        id: client.cache.identify(data.data!.orderUpdated),
        fields: { status: () => data.data!.orderUpdated.status },
      });
    },
  });
}
// No webhook receiver. No signature verification. No retry queue.
// No polling. No Redis Pub/Sub. Apollo handles everything. ✅`,
  },
];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function countSelected(fields: FieldNode[]): { selected: number; total: number } {
  let selected = 0; let total = 0;
  const traverse = (nodes: FieldNode[]) => nodes.forEach(n => {
    if (!n.children) { total++; if (n.selected) selected++; }
    else traverse(n.children);
  });
  traverse(fields);
  return { selected, total };
}

function buildQuery(fields: FieldNode[]): string {
  const renderNode = (node: FieldNode, indent: number): string | null => {
    const pad = "  ".repeat(indent);
    if (!node.selected) return null;
    if (!node.children) return `${pad}${node.label}`;
    const children = node.children.map(c => renderNode(c, indent + 1)).filter(Boolean);
    if (!children.length) return null;
    return `${pad}${node.label} {\n${children.join("\n")}\n${pad}}`;
  };
  const rootLines = fields.map(f => renderNode(f, 2)).filter(Boolean);
  if (!rootLines.length) return "query GetData {\n  # select at least one field\n}";
  return `query GetData($userId: ID!) {\n${rootLines.join("\n")}\n}`;
}

function buildMockResponse(fields: FieldNode[]): object {
  const user = fields.find(f => f.key === "user");
  const orders = fields.find(f => f.key === "orders");
  const obj: Record<string, unknown> = {};
  if (user?.selected) {
    const u: Record<string, unknown> = {};
    user.children?.forEach(c => {
      if (!c.selected) return;
      const vals: Record<string, unknown> = {
        id: "usr_42", name: "Trường Nguyễn", email: "truong@cake.vn",
        avatar: "https://cdn.example.com/avatars/42.jpg", role: "ADMIN",
        bio: "Frontend engineer", createdAt: "2023-01-15T09:00:00Z",
        updatedAt: "2024-11-01T14:22:00Z", plan: "PRO",
      };
      u[c.label] = vals[c.label] ?? null;
    });
    obj.user = u;
  }
  if (orders?.selected) {
    const mkItem = (id: string, name: string, price: number, qty: number, sku: string) => {
      const item: Record<string, unknown> = {};
      orders.children?.find(c => c.key === "orders.items")?.children?.forEach(c => {
        if (!c.selected) return;
        const vals: Record<string, unknown> = { id, name, price, qty, sku };
        item[c.label] = vals[c.label];
      });
      return item;
    };
    const mkOrder = (id: string, total: number, status: string) => {
      const o: Record<string, unknown> = {};
      orders.children?.forEach(c => {
        if (!c.selected || c.key === "orders.items") return;
        const vals: Record<string, unknown> = { id, total, status, createdAt: "2024-11-05T10:00:00Z", currency: "USD", notes: null };
        o[c.label] = vals[c.label];
      });
      const itemsNode = orders.children?.find(c => c.key === "orders.items");
      if (itemsNode?.selected) {
        o.items = [
          mkItem("item_1", "Widget Pro", 29.99, 2, "WGT-001"),
          mkItem("item_2", "Gadget Plus", 49.99, 1, "GDG-002"),
        ].filter(i => Object.keys(i).length);
      }
      return o;
    };
    obj.orders = [mkOrder("ord_1001", 109.97, "DELIVERED"), mkOrder("ord_1002", 49.99, "SHIPPED")];
  }
  return { data: obj };
}

// REST equivalent field count (full payload regardless of what you need)
const REST_FULL_FIELDS = {
  user: 24,   // GET /api/users/me returns 24 fields
  orders: 18, // GET /api/users/:id/orders returns 18 fields per order
  items: 12,  // GET /api/orders/:id/items returns 12 fields per item
};

// ─────────────────────────────────────────────────────────────────
// Waterfall visualisation
// ─────────────────────────────────────────────────────────────────

function WaterfallBar({ req, totalMs, width }: { req: RestRequest; totalMs: number; width: number }) {
  const x = (req.startMs / totalMs) * width;
  const w = Math.max(4, (req.durationMs / totalMs) * width);
  const wastedPct = ((req.fields - req.needed) / req.fields * 100).toFixed(0);
  const isWasted = req.fields - req.needed > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 11 }}>
      <span style={{ width: 32, color: req.method === "POST" ? "#f97316" : "#818cf8", fontFamily: "monospace", fontWeight: 700 }}>{req.method}</span>
      <div style={{ flex: 1, position: "relative", height: 26 }}>
        <div style={{ position: "absolute", left: x, width: w, height: 24, top: 1, background: "#6366f130", borderRadius: 4, border: "1px solid #6366f1" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(req.needed / req.fields) * 100}%`, background: "#6366f1", borderRadius: 3 }} />
        </div>
      </div>
      <span style={{ width: 280, color: "#64748b", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.endpoint}</span>
      <span style={{ width: 36, color: "#94a3b8", textAlign: "right" }}>{req.durationMs}ms</span>
      {isWasted && <span style={{ width: 52, color: "#f97316", fontSize: 9, textAlign: "right" }}>+{wastedPct}% waste</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Field tree checkbox
// ─────────────────────────────────────────────────────────────────

function FieldTree({ nodes, onToggle, depth = 0 }: {
  nodes: FieldNode[];
  onToggle: (key: string) => void;
  depth?: number;
}) {
  return (
    <div style={{ paddingLeft: depth * 14 }}>
      {nodes.map(node => (
        <div key={node.key}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", cursor: "pointer", userSelect: "none" }}>
            {!node.children ? (
              <input
                type="checkbox"
                checked={node.selected}
                onChange={() => onToggle(node.key)}
                style={{ accentColor: "#6366f1", width: 12, height: 12, flexShrink: 0 }}
              />
            ) : (
              <span style={{ width: 12, height: 12, display: "inline-block", background: "#334155", borderRadius: 2, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 12, color: node.children ? "#f1f5f9" : node.selected ? "#94a3b8" : "#475569", fontFamily: "monospace" }}>
              {node.label}
            </span>
            <span style={{ fontSize: 10, color: "#475569" }}>{node.type}</span>
          </label>
          {node.children && (
            <FieldTree nodes={node.children} onToggle={onToggle} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo
// ─────────────────────────────────────────────────────────────────

export function GraphQLMigrationDemo() {
  const [activeTab, setActiveTab] = useState<"waterfall" | "explorer" | "migration" | "subscriptions">("waterfall");
  const [phaseId, setPhaseId]     = useState("schema");
  const [codeView, setCodeView]   = useState<"before" | "after">("before");
  const [fields, setFields]       = useState<FieldNode[]>(INITIAL_FIELDS);
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [subRunning, setSubRunning] = useState(false);
  const [pollEvents, setPollEvents] = useState<{ time: string; fetched: number; changed: number }[]>([]);

  // Subscription simulation
  useEffect(() => {
    if (!subRunning) return;
    const EVENTS = [
      { type: "order.status_changed", payload: { orderId: "ord_1001", status: "DELIVERED", total: 109.97 } },
      { type: "order.created",        payload: { orderId: "ord_1003", status: "PENDING",   total: 79.99  } },
      { type: "order.status_changed", payload: { orderId: "ord_1002", status: "SHIPPED",   total: 49.99  } },
      { type: "order.cancelled",      payload: { orderId: "ord_1003", status: "CANCELLED", total: 79.99  } },
    ];
    let i = 0;
    const t = setInterval(() => {
      const ev = EVENTS[i % EVENTS.length];
      const now = new Date().toLocaleTimeString("en-GB", { hour12: false });
      setSubEvents(prev => [{ id: `ev-${Date.now()}`, timestamp: now, ...ev }, ...prev].slice(0, 20));
      i++;
    }, 1800);
    return () => clearInterval(t);
  }, [subRunning]);

  // Polling simulation
  useEffect(() => {
    if (!subRunning) return;
    const t = setInterval(() => {
      const now = new Date().toLocaleTimeString("en-GB", { hour12: false });
      setPollEvents(prev => [{ time: now, fetched: 18, changed: Math.random() > 0.7 ? 1 : 0 }, ...prev].slice(0, 12));
    }, 5000);
    return () => clearInterval(t);
  }, [subRunning]);

  const toggleField = useCallback((key: string) => {
    const toggle = (nodes: FieldNode[]): FieldNode[] =>
      nodes.map(n => n.key === key
        ? { ...n, selected: !n.selected }
        : n.children ? { ...n, children: toggle(n.children) } : n
      );
    setFields(prev => toggle(prev));
  }, []);

  const query    = useMemo(() => buildQuery(fields), [fields]);
  const response = useMemo(() => buildMockResponse(fields), [fields]);
  const { selected, total } = useMemo(() => countSelected(fields), [fields]);
  const restTotal = REST_FULL_FIELDS.user + REST_FULL_FIELDS.orders * 2 + REST_FULL_FIELDS.items * 4;
  const savings   = Math.round((1 - selected / restTotal) * 100);

  const activePhase = MIGRATION_PHASES.find(p => p.id === phaseId)!;

  return (
    <div style={{ background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>⚡</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>REST + Webhooks → GraphQL</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Schema design · Apollo Client · Codegen · N+1 elimination · Subscription migration
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["GraphQL", "Apollo Client", "graphql-codegen", "InMemoryCache", "WebSocket Subscriptions", "Optimistic UI", "N+1 elimination", "-57% latency"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "waterfall"     as const, label: "🔍 Before vs After" },
          { id: "explorer"      as const, label: "🎯 Query Explorer" },
          { id: "migration"     as const, label: "📋 Migration Phases" },
          { id: "subscriptions" as const, label: "⚡ Subscriptions" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? "#1e293b" : "transparent",
            color: activeTab === tab.id ? "#f1f5f9" : "#64748b",
            border: activeTab === tab.id ? "1px solid #334155" : "1px solid transparent",
            borderRadius: "8px 8px 0 0", padding: "8px 18px",
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── BEFORE vs AFTER ── */}
      {activeTab === "waterfall" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Before */}
            <div style={{ background: "#1e293b", border: "1px solid #ef444430", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>❌</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>Before — REST + Webhooks</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
                5 HTTP requests · waterfall sequencing · over-fetching · manual types · webhook receiver
              </div>

              {/* Waterfall */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginBottom: 6 }}>
                  <span>0ms</span><span>{REST_TOTAL / 2}ms</span><span>{REST_TOTAL}ms</span>
                </div>
                {REST_REQUESTS.map(r => (
                  <WaterfallBar key={r.id} req={r} totalMs={REST_TOTAL} width={320} />
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, background: "#6366f1", borderRadius: 2 }} /> Used fields
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 10, height: 10, background: "#6366f130", border: "1px solid #6366f1", borderRadius: 2 }} /> Over-fetched
                  </span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #334155", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Total requests",       value: "5", bad: true },
                  { label: "Total latency",        value: `${REST_TOTAL}ms`, bad: true },
                  { label: "Fields returned",      value: `${restTotal} total`, bad: true },
                  { label: "Fields actually used", value: "13 needed", bad: false },
                  { label: "Over-fetching",        value: `${Math.round((1 - 13/restTotal)*100)}% wasted bandwidth`, bad: true },
                  { label: "Type safety",          value: "Manual casts (unsafe)", bad: true },
                  { label: "Webhook receiver",     value: "Separate service + retry queue", bad: true },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "#64748b" }}>{m.label}</span>
                    <span style={{ color: m.bad ? "#f87171" : "#94a3b8", fontWeight: 600 }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div style={{ background: "#1e293b", border: "1px solid #4ade8030", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>✅</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>After — GraphQL + Subscriptions</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>
                1 query · single round-trip · exact fields · auto-generated types · WS subscription
              </div>

              {/* Single bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginBottom: 6 }}>
                  <span>0ms</span><span>195ms</span><span>{REST_TOTAL}ms</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 11 }}>
                  <span style={{ width: 32, color: "#818cf8", fontFamily: "monospace", fontWeight: 700 }}>POST</span>
                  <div style={{ flex: 1, position: "relative", height: 26 }}>
                    <div style={{
                      position: "absolute", left: 0,
                      width: `${(GRAPHQL_DURATION / REST_TOTAL) * 320}px`,
                      height: 24, top: 1,
                      background: "#4ade80", borderRadius: 4,
                    }} />
                  </div>
                  <span style={{ width: 280, color: "#64748b", fontFamily: "monospace" }}>/graphql</span>
                  <span style={{ width: 36, color: "#4ade80", textAlign: "right", fontWeight: 700 }}>195ms</span>
                </div>
                <div style={{ height: 24 }} />
                <div style={{ height: 24 }} />
                <div style={{ height: 24 }} />
                <div style={{ height: 24 }} />
              </div>

              <div style={{ borderTop: "1px solid #334155", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Total requests",       value: "1", good: true },
                  { label: "Total latency",        value: "195ms (-57%)", good: true },
                  { label: "Fields returned",      value: "Exactly 13 (no extra)", good: true },
                  { label: "Fields actually used", value: "13 needed", good: true },
                  { label: "Over-fetching",        value: "0% wasted bandwidth", good: true },
                  { label: "Type safety",          value: "Auto-generated (always accurate)", good: true },
                  { label: "Real-time updates",    value: "WebSocket subscription (built-in)", good: true },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "#64748b" }}>{m.label}</span>
                    <span style={{ color: m.good ? "#4ade80" : "#94a3b8", fontWeight: 600 }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Impact summary */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Migration Impact</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Latency reduction", value: "-57%",   sub: `${REST_TOTAL}ms → 195ms`, color: "#4ade80" },
                { label: "Bandwidth saved",   value: "-78%",   sub: "over-fetching eliminated", color: "#22d3ee" },
                { label: "Type coverage",     value: "100%",   sub: "codegen from schema",       color: "#818cf8" },
                { label: "Infrastructure",    value: "-1 svc", sub: "webhook receiver removed",  color: "#fbbf24" },
              ].map(m => (
                <div key={m.label} style={{ background: "#0f172a", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUERY EXPLORER ── */}
      {activeTab === "explorer" && (
        <div>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 12, color: "#94a3b8" }}>
            💡 Select exactly the fields you need. The GraphQL query and response update live. Compare vs REST which always returns the full payload.
          </div>

          {/* Bandwidth savings bar */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: "#f1f5f9", fontWeight: 700 }}>Fields requested: <span style={{ color: "#6366f1" }}>{selected}</span> / {total} total</span>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>vs REST: saving {savings}% bandwidth</span>
            </div>
            <div style={{ height: 6, background: "#0f172a", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(selected / total) * 100}%`, background: "#6366f1", borderRadius: 3, transition: "width 0.2s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginTop: 3 }}>
              <span>REST: always returns {restTotal} fields (all of them)</span>
              <span>GraphQL: returns exactly {selected}</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 14 }}>
            {/* Field picker */}
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 10 }}>SCHEMA FIELDS</div>
              <FieldTree nodes={fields} onToggle={toggleField} />
            </div>

            {/* Generated query */}
            <div style={{ background: "#1e293b", border: "1px solid #6366f130", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a", display: "flex", justifyContent: "space-between" }}>
                <span>Generated GraphQL query</span>
                <span style={{ color: "#6366f1" }}>1 request</span>
              </div>
              <pre style={{ margin: 0, padding: 14, fontSize: 11.5, fontFamily: "monospace", color: "#7dd3fc", lineHeight: 1.7, overflowY: "auto", maxHeight: 400 }}>
                {query}
              </pre>
            </div>

            {/* Response */}
            <div style={{ background: "#1e293b", border: "1px solid #4ade8030", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a", display: "flex", justifyContent: "space-between" }}>
                <span>Response — only requested fields</span>
                <span style={{ color: "#4ade80" }}>{selected} fields</span>
              </div>
              <pre style={{ margin: 0, padding: 14, fontSize: 11, fontFamily: "monospace", color: "#94a3b8", lineHeight: 1.6, overflowY: "auto", maxHeight: 400 }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ── MIGRATION PHASES ── */}
      {activeTab === "migration" && (
        <div>
          {/* Phase stepper */}
          <div style={{ display: "flex", gap: 0, marginBottom: 20, overflowX: "auto" }}>
            {MIGRATION_PHASES.map((p, i) => (
              <React.Fragment key={p.id}>
                <button onClick={() => setPhaseId(p.id)} style={{
                  background: phaseId === p.id ? "#6366f1" : "#1e293b",
                  border: `1px solid ${phaseId === p.id ? "#6366f1" : "#334155"}`,
                  borderRadius: 8, padding: "10px 16px",
                  cursor: "pointer", textAlign: "left", flexShrink: 0,
                }}>
                  <div style={{ fontSize: 9, color: phaseId === p.id ? "#c7d2fe" : "#475569", fontWeight: 700 }}>{p.phase} · {p.duration}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: phaseId === p.id ? "#fff" : "#94a3b8", marginTop: 2 }}>{p.title}</div>
                </button>
                {i < MIGRATION_PHASES.length - 1 && (
                  <div style={{ display: "flex", alignItems: "center", padding: "0 4px", color: "#334155", fontSize: 16 }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Phase detail */}
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>{activePhase.phase} — {activePhase.title}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{activePhase.desc}</div>
          </div>

          {/* Before / After code toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setCodeView("before")} style={{
              background: codeView === "before" ? "#ef444420" : "#1e293b",
              border: `1px solid ${codeView === "before" ? "#ef4444" : "#334155"}`,
              borderRadius: 6, padding: "6px 16px",
              color: codeView === "before" ? "#f87171" : "#64748b",
              cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}>❌ Before (REST)</button>
            <button onClick={() => setCodeView("after")} style={{
              background: codeView === "after" ? "#4ade8020" : "#1e293b",
              border: `1px solid ${codeView === "after" ? "#4ade80" : "#334155"}`,
              borderRadius: 6, padding: "6px 16px",
              color: codeView === "after" ? "#4ade80" : "#64748b",
              cursor: "pointer", fontSize: 12, fontWeight: 700,
            }}>✅ After (GraphQL)</button>
          </div>

          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a" }}>
              {codeView === "before" ? activePhase.phase + " — REST approach (legacy)" : activePhase.phase + " — GraphQL approach (migrated)"}
            </div>
            <pre style={{ margin: 0, padding: 16, fontSize: 11.5, fontFamily: "monospace", color: codeView === "before" ? "#fca5a5" : "#86efac", lineHeight: 1.7, overflow: "auto", maxHeight: 480 }}>
              <code>{codeView === "before" ? activePhase.before : activePhase.after}</code>
            </pre>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {activeTab === "subscriptions" && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <button onClick={() => { setSubRunning(r => !r); if (subRunning) { setSubEvents([]); setPollEvents([]); } }} style={{
              background: subRunning ? "#ef444420" : "#4ade8020",
              border: `1px solid ${subRunning ? "#ef4444" : "#4ade80"}`,
              borderRadius: 8, padding: "8px 20px",
              color: subRunning ? "#f87171" : "#4ade80",
              cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}>
              {subRunning ? "⏹ Stop simulation" : "▶ Start simulation"}
            </button>
            {subRunning && (
              <span style={{ fontSize: 11, color: "#4ade80" }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4ade80", marginRight: 6, animation: "pulse 1s infinite" }} />
                WebSocket connected · pushing events…
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* GraphQL subscription feed */}
            <div style={{ background: "#1e293b", border: "1px solid #4ade8030", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>✅ GraphQL Subscription (WebSocket push)</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>Events: {subEvents.length}</span>
              </div>
              <div style={{ padding: 12, height: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {subEvents.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#475569", textAlign: "center", marginTop: 80 }}>Start simulation to see subscription events</div>
                ) : subEvents.map(ev => (
                  <div key={ev.id} style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", fontSize: 11 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 2 }}>
                      <span style={{ color: "#475569", fontFamily: "monospace", flexShrink: 0 }}>{ev.timestamp}</span>
                      <span style={{ color: "#4ade80", fontWeight: 700 }}>{ev.type}</span>
                    </div>
                    <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: 10 }}>
                      {JSON.stringify(ev.payload)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 14px", borderTop: "1px solid #334155", fontSize: 10, color: "#64748b" }}>
                Push on change · zero wasted requests · no delay
              </div>
            </div>

            {/* Polling feed */}
            <div style={{ background: "#1e293b", border: "1px solid #f9731630", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}>❌ REST Polling (every 5s)</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>Polls: {pollEvents.length}</span>
              </div>
              <div style={{ padding: 12, height: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {pollEvents.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#475569", textAlign: "center", marginTop: 80 }}>Start simulation to see polling requests</div>
                ) : pollEvents.map((ev, i) => (
                  <div key={i} style={{ background: "#0f172a", borderRadius: 6, padding: "6px 10px", fontSize: 11, opacity: ev.changed ? 1 : 0.5 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "#475569", fontFamily: "monospace", flexShrink: 0 }}>{ev.time}</span>
                      <span style={{ color: "#fb923c" }}>GET /api/orders</span>
                      <span style={{ fontSize: 9, color: "#64748b" }}>{ev.fetched} fields</span>
                      <span style={{ marginLeft: "auto", color: ev.changed ? "#4ade80" : "#ef4444", fontSize: 9, fontWeight: 700 }}>
                        {ev.changed ? "1 change" : "NO CHANGE"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 14px", borderTop: "1px solid #334155", fontSize: 10, color: "#64748b" }}>
                Polls even when nothing changed · wastes bandwidth · 5s delay
              </div>
            </div>
          </div>

          {/* Code comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a" }}>
                ❌ Before — webhook receiver + polling
              </div>
              <pre style={{ margin: 0, padding: 14, fontSize: 10.5, fontFamily: "monospace", color: "#fca5a5", lineHeight: 1.7, maxHeight: 260, overflow: "auto" }}>{
`// Server: Express webhook receiver
app.post("/webhooks/orders",
  verifyHmacSignature(process.env.WEBHOOK_SECRET),
  async (req, res) => {
    const { orderId, status } = req.body;
    // Broadcast via Redis Pub/Sub → Socket.IO
    await redis.publish("orders", JSON.stringify({ orderId, status }));
    res.status(200).end();
  }
);

// Client: 5-second polling fallback
useEffect(() => {
  const t = setInterval(() => refetchOrders(), 5000);
  return () => clearInterval(t);
}, []);
// → 12 req/min per user, regardless of changes`
              }</pre>
            </div>
            <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #334155", fontSize: 10, color: "#64748b", background: "#0f172a" }}>
                ✅ After — GraphQL subscription
              </div>
              <pre style={{ margin: 0, padding: 14, fontSize: 10.5, fontFamily: "monospace", color: "#86efac", lineHeight: 1.7, maxHeight: 260, overflow: "auto" }}>{
`// Client: subscribe to order updates
const ORDER_SUB = gql\`
  subscription OnOrderUpdate($userId: ID!) {
    orderUpdated(userId: $userId) {
      id status total
    }
  }
\`;

function Orders({ userId }) {
  useSubscription(ORDER_SUB, {
    variables: { userId },
    onData: ({ client, data }) => {
      // Apollo auto-updates normalised cache
      // All queries watching this order update instantly
    },
  });
}
// Push only on change · no webhook receiver · no retry queue`
              }</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GraphQLMigrationDemo;
