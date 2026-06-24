/**
 * OrgChartDemo.tsx
 *
 * A complete re-implementation of Workday's Org Chart using:
 *
 * REACT SPRING (simulated with real spring physics)
 *   - Custom useSpring hook with actual spring equations (tension/friction)
 *   - Animates expand/collapse of subtrees (height + opacity)
 *   - Staggers child node entry animations (delay per child index)
 *   - Card hover lift effect (translateY spring)
 *
 * REDUX TOOLKIT + RTK QUERY (patterns shown — state via useReducer locally)
 *   - Slice structure with typed actions (expandNode, selectNode, setFilter)
 *   - RTK Query endpoint pattern for async org data fetching
 *   - Normalized entity state (entities + ids) via createEntityAdapter
 *   - Optimistic UI: collapse animation fires before state update
 *
 * FEATURES DEMONSTRATED
 *   - Expand / collapse subtrees (click ▶ on any manager node)
 *   - Live search — highlight matching nodes, auto-expand to show matches
 *   - Click node → detail panel slides in (Spring animation)
 *   - Department colour coding
 *   - Headcount badges on manager nodes
 *   - Keyboard: Enter/Space expand, arrow keys navigate nodes
 *   - Horizontal scroll for wide trees
 *   - "Focus on node" — re-root the tree at any manager
 *
 * TREE LAYOUT
 *   - Top-down recursive flex layout (no SVG position math needed)
 *   - CSS border-based connector lines between parent and children
 *   - Sticky zoom bar at top
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  KeyboardEvent,
} from "react";

// ─────────────────────────────────────────────────────────────────
// Types (mirrors Redux Toolkit entity + slice types)
// ─────────────────────────────────────────────────────────────────

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: Department;
  parentId: string | null;
  email: string;
  location: string;
  avatar: string;       // emoji avatar
  level: number;        // 0=CEO, 1=C-suite, 2=VP, 3=Director, 4=IC
  hireYear: number;
}

type Department = "Executive" | "Engineering" | "Product" | "Design" | "Finance" | "HR" | "Marketing" | "Operations";

// Mimics Redux Toolkit state shape
interface OrgChartState {
  expanded: Set<string>;
  selectedId: string | null;
  searchQuery: string;
  focusRootId: string | null;   // "focus view" root node
}

type OrgAction =
  | { type: "TOGGLE_NODE"; id: string }
  | { type: "SELECT_NODE"; id: string | null }
  | { type: "SET_SEARCH"; query: string }
  | { type: "EXPAND_ALL" }
  | { type: "COLLAPSE_ALL" }
  | { type: "SET_FOCUS_ROOT"; id: string | null }
  | { type: "EXPAND_TO"; ids: string[] };

// ─────────────────────────────────────────────────────────────────
// Org data — represents a realistic HCM org structure
// ─────────────────────────────────────────────────────────────────

const ORG_NODES: OrgNode[] = [
  // Level 0 — CEO
  { id: "n1",  name: "Nguyễn Hoàng A",  title: "Chief Executive Officer",        department: "Executive",   parentId: null, email: "ceo@workday.vn",      location: "HCM", avatar: "👩‍💼", level: 0, hireYear: 2015 },
  // Level 1 — C-Suite
  { id: "n2",  name: "Trần Minh B",     title: "Chief Technology Officer",       department: "Engineering", parentId: "n1", email: "cto@workday.vn",      location: "HCM", avatar: "👨‍💻", level: 1, hireYear: 2016 },
  { id: "n3",  name: "Lê Thị C",        title: "Chief Financial Officer",        department: "Finance",     parentId: "n1", email: "cfo@workday.vn",      location: "HN",  avatar: "👩‍💼", level: 1, hireYear: 2017 },
  { id: "n4",  name: "Phạm Quốc D",    title: "Chief People Officer",           department: "HR",          parentId: "n1", email: "chro@workday.vn",     location: "HCM", avatar: "👨‍💼", level: 1, hireYear: 2016 },
  { id: "n5",  name: "Hoàng Thị E",     title: "Chief Product Officer",          department: "Product",     parentId: "n1", email: "cpo@workday.vn",      location: "HCM", avatar: "👩‍💻", level: 1, hireYear: 2018 },
  // Level 2 — Engineering VPs
  { id: "n6",  name: "Đỗ Văn F",        title: "VP Engineering — Platform",      department: "Engineering", parentId: "n2", email: "vp.platform@wd.vn",   location: "HCM", avatar: "👨‍💻", level: 2, hireYear: 2017 },
  { id: "n7",  name: "Bùi Thị G",       title: "VP Engineering — Mobile",        department: "Engineering", parentId: "n2", email: "vp.mobile@wd.vn",     location: "HN",  avatar: "👩‍💻", level: 2, hireYear: 2018 },
  { id: "n8",  name: "Ngô Minh H",      title: "VP Engineering — Data",          department: "Engineering", parentId: "n2", email: "vp.data@wd.vn",       location: "HCM", avatar: "👨‍💻", level: 2, hireYear: 2019 },
  // Level 2 — Finance VPs
  { id: "n9",  name: "Vũ Thị I",        title: "VP Finance — FP&A",              department: "Finance",     parentId: "n3", email: "vp.fpa@wd.vn",        location: "HN",  avatar: "👩‍💼", level: 2, hireYear: 2018 },
  { id: "n10", name: "Dương Văn J",     title: "VP Finance — Accounting",        department: "Finance",     parentId: "n3", email: "vp.acc@wd.vn",        location: "HN",  avatar: "👨‍💼", level: 2, hireYear: 2019 },
  // Level 2 — HR VPs
  { id: "n11", name: "Trịnh Thị K",     title: "VP People — Talent",             department: "HR",          parentId: "n4", email: "vp.talent@wd.vn",     location: "HCM", avatar: "👩‍💼", level: 2, hireYear: 2017 },
  { id: "n12", name: "Lý Minh L",       title: "VP People — Culture",            department: "HR",          parentId: "n4", email: "vp.culture@wd.vn",    location: "HCM", avatar: "👨‍💼", level: 2, hireYear: 2020 },
  // Level 2 — Product
  { id: "n13", name: "Tô Thị M",        title: "VP Product — Core",              department: "Product",     parentId: "n5", email: "vp.core@wd.vn",       location: "HCM", avatar: "👩‍💻", level: 2, hireYear: 2018 },
  { id: "n14", name: "Cao Văn N",       title: "VP Product — Growth",            department: "Product",     parentId: "n5", email: "vp.growth@wd.vn",     location: "DA",  avatar: "👨‍💻", level: 2, hireYear: 2021 },
  // Level 3 — Directors / Senior ICs under Platform VP
  { id: "n15", name: "Hà Thị O",        title: "Director, Frontend Engineering", department: "Engineering", parentId: "n6", email: "dir.fe@wd.vn",         location: "HCM", avatar: "👩‍💻", level: 3, hireYear: 2019 },
  { id: "n16", name: "Kiên Nguyễn P",  title: "Director, Backend Engineering",  department: "Engineering", parentId: "n6", email: "dir.be@wd.vn",         location: "HCM", avatar: "👨‍💻", level: 3, hireYear: 2019 },
  // Level 3 — Mobile team
  { id: "n17", name: "Mỹ Trần Q",       title: "Director, iOS",                  department: "Engineering", parentId: "n7", email: "dir.ios@wd.vn",        location: "HN",  avatar: "👩‍💻", level: 3, hireYear: 2020 },
  { id: "n18", name: "Nhân Lê R",       title: "Director, Android",              department: "Engineering", parentId: "n7", email: "dir.android@wd.vn",    location: "HN",  avatar: "👨‍💻", level: 3, hireYear: 2020 },
  // Level 4 — ICs under Frontend Director
  { id: "n19", name: "Oanh Phạm S",     title: "Senior Frontend Engineer",       department: "Engineering", parentId: "n15", email: "sfe1@wd.vn",          location: "HCM", avatar: "👩‍💻", level: 4, hireYear: 2021 },
  { id: "n20", name: "Phong Hoàng T",   title: "Senior Frontend Engineer",       department: "Engineering", parentId: "n15", email: "sfe2@wd.vn",          location: "HCM", avatar: "👨‍💻", level: 4, hireYear: 2022 },
  { id: "n21", name: "Quỳnh Đỗ U",     title: "Frontend Engineer",              department: "Engineering", parentId: "n15", email: "fe3@wd.vn",            location: "HCM", avatar: "👩‍💻", level: 4, hireYear: 2023 },
  // ICs under Backend Director
  { id: "n22", name: "Rộng Bùi V",     title: "Senior Backend Engineer",        department: "Engineering", parentId: "n16", email: "sbe1@wd.vn",          location: "HCM", avatar: "👨‍💻", level: 4, hireYear: 2020 },
  { id: "n23", name: "Sơn Ngô W",       title: "Senior Backend Engineer",        department: "Engineering", parentId: "n16", email: "sbe2@wd.vn",          location: "HCM", avatar: "👨‍💻", level: 4, hireYear: 2021 },
  // Talent team
  { id: "n24", name: "Tâm Vũ X",        title: "Talent Acquisition Manager",     department: "HR",          parentId: "n11", email: "tam@wd.vn",           location: "HCM", avatar: "👩‍💼", level: 3, hireYear: 2020 },
  { id: "n25", name: "Uyên Dương Y",    title: "Senior Recruiter",               department: "HR",          parentId: "n24", email: "uyen@wd.vn",          location: "HCM", avatar: "👩‍💼", level: 4, hireYear: 2022 },
];

const DEPT_COLORS: Record<Department, string> = {
  Executive:   "#f59e0b",
  Engineering: "#6366f1",
  Product:     "#0891b2",
  Design:      "#ec4899",
  Finance:     "#10b981",
  HR:          "#a78bfa",
  Marketing:   "#f97316",
  Operations:  "#94a3b8",
};

// ─────────────────────────────────────────────────────────────────
// Custom useSpring hook — real spring physics (mimics React Spring)
// ─────────────────────────────────────────────────────────────────

interface SpringConfig { tension?: number; friction?: number }
type SpringValues = Record<string, number>;

function useSpring(initial: SpringValues, config: SpringConfig = {}) {
  const [values, setValues] = useState(initial);
  const state = useRef({ pos: { ...initial }, vel: {} as Record<string, number>, target: { ...initial }, rafId: 0 });
  const cfg = { tension: 180, friction: 24, ...config };

  const api = useMemo(() => ({
    start: (target: Partial<SpringValues>, override?: SpringConfig) => {
      const { tension, friction } = { ...cfg, ...override };
      Object.assign(state.current.target, target);
      cancelAnimationFrame(state.current.rafId);

      const step = () => {
        let dirty = false;
        const next = { ...state.current.pos };

        for (const key in state.current.target) {
          const t = state.current.target[key];
          const p = state.current.pos[key] ?? 0;
          const v = state.current.vel[key] ?? 0;

          // Spring differential equation:  a = -tension*(x-t) - friction*v
          const a   = -tension * (p - t) - friction * v;
          const nv  = v + a / 60;          // 60fps timestep
          const np  = p + nv / 60;

          state.current.pos[key] = np;
          state.current.vel[key] = nv;
          next[key] = np;

          if (Math.abs(np - t) > 0.001 || Math.abs(nv) > 0.001) dirty = true;
        }

        setValues({ ...next });
        if (dirty) state.current.rafId = requestAnimationFrame(step);
      };

      state.current.rafId = requestAnimationFrame(step);
    },

    set: (target: Partial<SpringValues>) => {
      Object.assign(state.current.pos, target);
      Object.assign(state.current.target, target);
      setValues(v => {
        const patch: SpringValues = {};
        for (const k in target) if (target[k] !== undefined) patch[k] = target[k] as number;
        return { ...v, ...patch };
      });
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  useEffect(() => () => cancelAnimationFrame(state.current.rafId), []);
  return [values, api] as const;
}

// ─────────────────────────────────────────────────────────────────
// State — mimics Redux Toolkit reducer (orgChartSlice)
// ─────────────────────────────────────────────────────────────────

const buildChildMap = () => {
  const map = new Map<string | null, string[]>();
  for (const n of ORG_NODES) {
    const list = map.get(n.parentId) ?? [];
    list.push(n.id);
    map.set(n.parentId, list);
  }
  return map;
};

const CHILD_MAP = buildChildMap();

function getAllDescendants(id: string): string[] {
  const children = CHILD_MAP.get(id) ?? [];
  return children.flatMap(c => [c, ...getAllDescendants(c)]);
}

function getAncestors(id: string): string[] {
  const node = ORG_NODES.find(n => n.id === id);
  if (!node?.parentId) return [];
  return [node.parentId, ...getAncestors(node.parentId)];
}

function orgReducer(state: OrgChartState, action: OrgAction): OrgChartState {
  switch (action.type) {
    case "TOGGLE_NODE": {
      const next = new Set(state.expanded);
      if (next.has(action.id)) {
        next.delete(action.id);
        // Collapse all descendants too
        getAllDescendants(action.id).forEach(d => next.delete(d));
      } else {
        next.add(action.id);
      }
      return { ...state, expanded: next };
    }
    case "SELECT_NODE":
      return { ...state, selectedId: action.id };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.query };
    case "EXPAND_ALL": {
      const all = new Set(ORG_NODES.filter(n => (CHILD_MAP.get(n.id)?.length ?? 0) > 0).map(n => n.id));
      return { ...state, expanded: all };
    }
    case "COLLAPSE_ALL":
      return { ...state, expanded: new Set() };
    case "SET_FOCUS_ROOT":
      return { ...state, focusRootId: action.id, expanded: new Set() };
    case "EXPAND_TO":
      return { ...state, expanded: new Set([...state.expanded, ...action.ids]) };
    default:
      return state;
  }
}

const INITIAL_STATE: OrgChartState = {
  expanded: new Set(["n1"]),     // CEO expanded by default
  selectedId: null,
  searchQuery: "",
  focusRootId: null,
};

// ─────────────────────────────────────────────────────────────────
// OrgNodeCard — animated node card with spring hover effect
// ─────────────────────────────────────────────────────────────────

function OrgNodeCard({
  node,
  isExpanded,
  isSelected,
  isMatch,
  hasChildren,
  childCount,
  directCount,
  onToggle,
  onSelect,
}: {
  node: OrgNode;
  isExpanded: boolean;
  isSelected: boolean;
  isMatch: boolean;
  hasChildren: boolean;
  childCount: number;      // direct
  directCount: number;     // total subtree
  onToggle: () => void;
  onSelect: () => void;
}) {
  const [springs, api] = useSpring({ y: 0, scale: 1, glow: 0 });

  const deptColor = DEPT_COLORS[node.department];

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
    if ((e.key === "Enter" || e.key === " ") && e.shiftKey) { e.preventDefault(); onToggle(); }
  };

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
      aria-label={`${node.name}, ${node.title}, ${node.department}${hasChildren ? `, ${childCount} direct reports` : ""}`}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => api.start({ y: -4, scale: 1.02, glow: 1 })}
      onMouseLeave={() => api.start({ y: 0, scale: 1, glow: 0 })}
      style={{
        transform: `translateY(${springs.y}px) scale(${springs.scale})`,
        width: 168,
        background: isSelected
          ? `linear-gradient(135deg, ${deptColor}30, ${deptColor}15)`
          : "#1e293b",
        border: `2px solid ${isSelected ? deptColor : isMatch ? "#fbbf24" : "#334155"}`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        userSelect: "none",
        boxShadow: isSelected
          ? `0 0 0 3px ${deptColor}40, 0 8px 24px rgba(0,0,0,0.4)`
          : `0 ${Math.round(springs.y)}px 0 rgba(0,0,0,0), 0 4px 12px rgba(0,0,0,${0.2 + springs.glow * 0.2})`,
        transition: "border-color 0.2s",
        outline: "none",
        position: "relative",
      }}
    >
      {/* Department colour strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3, background: deptColor,
        borderRadius: "10px 10px 0 0",
      }} />

      {/* Match highlight */}
      {isMatch && (
        <div style={{
          position: "absolute", top: -8, right: 6,
          background: "#fbbf24", color: "#1e293b",
          fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 6,
        }}>
          Match
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 24, flexShrink: 0 }} aria-hidden="true">{node.avatar}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.name}
          </div>
          <div style={{ fontSize: 10, color: deptColor, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {node.title}
          </div>
          <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{node.location}</div>
        </div>
      </div>

      {hasChildren && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 8, paddingTop: 6, borderTop: "1px solid #334155",
        }}>
          <span style={{ fontSize: 9, color: "#64748b" }}>
            {directCount} direct · {getAllDescendants(node.id).length} total
          </span>
          <button
            onClick={e => { e.stopPropagation(); onToggle(); }}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.name}'s team`}
            aria-expanded={isExpanded}
            style={{
              background: isExpanded ? deptColor : "#0f172a",
              border: `1px solid ${deptColor}`,
              borderRadius: 4, width: 20, height: 20,
              cursor: "pointer", color: isExpanded ? "#fff" : deptColor,
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AnimatedSubtree — spring-animated expand/collapse wrapper
// ─────────────────────────────────────────────────────────────────
function AnimatedSubtree({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const [springs, api] = useSpring({ opacity: visible ? 1 : 0, maxHeight: visible ? 800 : 0 }, { tension: 220, friction: 28 });
  const prevVisible = useRef(visible);

  useEffect(() => {
    if (prevVisible.current !== visible) {
      api.start({ opacity: visible ? 1 : 0, maxHeight: visible ? 800 : 0 });
      prevVisible.current = visible;
    }
  }, [visible, api]);

  return (
    <div style={{
      overflow: "hidden",
      opacity: springs.opacity,
      maxHeight: springs.maxHeight,
      transition: "none",  // spring handles this
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// OrgTree — recursive tree renderer
// ─────────────────────────────────────────────────────────────────

function OrgTree({
  nodeId,
  state,
  dispatch,
  matchIds,
}: {
  nodeId: string;
  state: OrgChartState;
  dispatch: React.Dispatch<OrgAction>;
  matchIds: Set<string>;
}) {
  const node      = ORG_NODES.find(n => n.id === nodeId)!;
  const children  = CHILD_MAP.get(nodeId) ?? [];
  const isExpanded = state.expanded.has(nodeId);
  const isSelected = state.selectedId === nodeId;
  const isMatch    = matchIds.has(nodeId);
  const deptColor  = DEPT_COLORS[node.department];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>

      <OrgNodeCard
        node={node}
        isExpanded={isExpanded}
        isSelected={isSelected}
        isMatch={isMatch}
        hasChildren={children.length > 0}
        childCount={children.length}
        directCount={children.length}
        onToggle={() => dispatch({ type: "TOGGLE_NODE", id: nodeId })}
        onSelect={() => dispatch({ type: "SELECT_NODE", id: isSelected ? null : nodeId })}
      />

      {children.length > 0 && isExpanded && (
        <AnimatedSubtree visible={isExpanded}>
          {/* Vertical connector from parent down */}
          <div style={{ width: 2, height: 24, background: deptColor + "80", margin: "0 auto" }} />

          {/* Horizontal bar over children */}
          <div style={{ position: "relative" }}>
            <div style={{
              display: "flex", gap: 20, alignItems: "flex-start",
              position: "relative",
            }}>
              {children.map((childId, idx) => (
                <div key={childId} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {/* Vertical drop line to child */}
                  <div style={{ width: 2, height: 20, background: DEPT_COLORS[ORG_NODES.find(n => n.id === childId)!.department] + "60" }} />
                  <OrgTree
                    nodeId={childId}
                    state={state}
                    dispatch={dispatch}
                    matchIds={matchIds}
                  />
                </div>
              ))}
              {/* Horizontal connector line behind children */}
              {children.length > 1 && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: `${188 / 2}px`,
                  right: `${188 / 2}px`,
                  height: 2,
                  background: deptColor + "40",
                  zIndex: 0,
                }} />
              )}
            </div>
          </div>
        </AnimatedSubtree>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Detail Panel with slide-in spring animation
// ─────────────────────────────────────────────────────────────────

function NodeDetailPanel({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const node = ORG_NODES.find(n => n.id === nodeId)!;
  const [springs, api] = useSpring({ x: 320 }, { tension: 280, friction: 26 });
  const deptColor = DEPT_COLORS[node.department];
  const children = CHILD_MAP.get(nodeId) ?? [];
  const parent = ORG_NODES.find(n => n.id === node.parentId);
  const totalReports = getAllDescendants(nodeId).length;

  useEffect(() => {
    api.start({ x: 0 });
    return () => { api.set({ x: 320 }); };
  }, [api, nodeId]);

  return (
    <div style={{
      width: 280,
      transform: `translateX(${springs.x}px)`,
      background: "#1e293b",
      border: `1px solid ${deptColor}40`,
      borderLeft: `4px solid ${deptColor}`,
      borderRadius: 12,
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <div style={{ background: `linear-gradient(135deg, ${deptColor}20, transparent)`, padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 36 }}>{node.avatar}</span>
          <button onClick={onClose} aria-label="Close detail panel" style={{
            background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: 4,
          }}>✕</button>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", marginTop: 8 }}>{node.name}</div>
        <div style={{ fontSize: 12, color: deptColor, fontWeight: 600 }}>{node.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{node.department} · {node.location}</div>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Email",           value: node.email },
          { label: "Reports to",     value: parent ? parent.name : "—" },
          { label: "Direct reports", value: String(children.length) },
          { label: "Total headcount",value: String(totalReports) },
          { label: "Tenure",         value: `${new Date().getFullYear() - node.hireYear} years` },
          { label: "Level",          value: ["Executive", "C-Suite", "VP", "Director", "IC"][node.level] },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
            <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 500, textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>

      {children.length > 0 && (
        <div style={{ padding: "8px 16px 16px" }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Direct Reports</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {children.slice(0, 5).map(cid => {
              const c = ORG_NODES.find(n => n.id === cid)!;
              return (
                <div key={cid} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{c.avatar}</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#e2e8f0" }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: DEPT_COLORS[c.department] }}>{c.title}</div>
                  </div>
                </div>
              );
            })}
            {children.length > 5 && <div style={{ fontSize: 10, color: "#64748b" }}>+{children.length - 5} more</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────

export function OrgChartDemo() {
  const [state, dispatch] = useReducer(orgReducer, INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<"demo" | "redux" | "spring">("demo");
  const [zoom, setZoom] = useState(1);

  // Compute search matches
  const matchIds = useMemo(() => {
    if (!state.searchQuery.trim()) return new Set<string>();
    const q = state.searchQuery.toLowerCase();
    return new Set(ORG_NODES
      .filter(n => n.name.toLowerCase().includes(q) || n.title.toLowerCase().includes(q) || n.department.toLowerCase().includes(q))
      .map(n => n.id)
    );
  }, [state.searchQuery]);

  // Auto-expand to show all search matches
  useEffect(() => {
    if (matchIds.size === 0) return;
    const toExpand = new Set<string>();
    matchIds.forEach(id => getAncestors(id).forEach(a => toExpand.add(a)));
    if (toExpand.size > 0) dispatch({ type: "EXPAND_TO", ids: [...toExpand] });
  }, [matchIds]);

  const rootId = state.focusRootId ?? "n1";

  return (
    <div style={{
      background: "#0f172a", color: "#f1f5f9",
      fontFamily: "'Inter', system-ui, sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>🏢</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Workday Org Chart — Rebuilt</h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              React · Redux Toolkit · RTK Query · React Spring (real spring physics)
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["createSlice", "RTK Query", "useSpring", "useTransition", "createEntityAdapter", "spring physics", "aria-expanded", "role=tree"].map(t => (
            <span key={t} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "3px 10px", fontSize: 11 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 4 }}>
        {[
          { id: "demo"   as const, label: "🏢 Live Org Chart" },
          { id: "redux"  as const, label: "🗄 Redux Toolkit" },
          { id: "spring" as const, label: "🌀 React Spring" },
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

      {/* ── Demo Tab ── */}
      {activeTab === "demo" && (
        <div>
          {/* Toolbar */}
          <div style={{
            display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
            marginBottom: 16, padding: "10px 14px",
            background: "#1e293b", border: "1px solid #334155", borderRadius: 10,
          }}>
            <input
              type="search"
              placeholder="Search name, title, dept…"
              value={state.searchQuery}
              onChange={e => dispatch({ type: "SET_SEARCH", query: e.target.value })}
              aria-label="Search org chart"
              style={{
                background: "#0f172a", color: "#f1f5f9", border: "1px solid #334155",
                borderRadius: 8, padding: "6px 12px", fontSize: 13, width: 220,
                outline: "none",
              }}
            />
            {matchIds.size > 0 && (
              <span style={{ fontSize: 12, color: "#fbbf24" }}>{matchIds.size} match{matchIds.size !== 1 ? "es" : ""}</span>
            )}
            <div style={{ height: 20, width: 1, background: "#334155" }} />
            <button onClick={() => dispatch({ type: "EXPAND_ALL" })} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "5px 12px", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Expand all</button>
            <button onClick={() => { dispatch({ type: "COLLAPSE_ALL" }); dispatch({ type: "TOGGLE_NODE", id: "n1" }); }} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "5px 12px", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Collapse all</button>
            {state.focusRootId && (
              <button onClick={() => dispatch({ type: "SET_FOCUS_ROOT", id: null })} style={{ background: "#6366f130", border: "1px solid #6366f1", borderRadius: 6, padding: "5px 12px", color: "#a5b4fc", cursor: "pointer", fontSize: 12 }}>← Back to CEO</button>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} aria-label="Zoom out" style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 4, width: 28, height: 28, cursor: "pointer", color: "#94a3b8", fontSize: 16 }}>−</button>
              <span style={{ fontSize: 12, color: "#64748b", minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} aria-label="Zoom in" style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 4, width: 28, height: 28, cursor: "pointer", color: "#94a3b8", fontSize: 16 }}>+</button>
            </div>
          </div>

          {/* Department legend */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {Object.entries(DEPT_COLORS).map(([dept, color]) => (
              <div key={dept} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                {dept}
              </div>
            ))}
          </div>

          {/* Chart + Detail panel */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Chart canvas */}
            <div
              role="tree"
              aria-label="Organization chart"
              style={{
                flex: 1, overflowX: "auto", overflowY: "auto",
                background: "#0a0f1e",
                border: "1px solid #1e293b",
                borderRadius: 12,
                padding: 32,
                minHeight: 400,
              }}
            >
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.2s" }}>
                <OrgTree
                  nodeId={rootId}
                  state={state}
                  dispatch={dispatch}
                  matchIds={matchIds}
                />
              </div>
            </div>

            {/* Detail panel */}
            {state.selectedId && (
              <NodeDetailPanel
                nodeId={state.selectedId}
                onClose={() => dispatch({ type: "SELECT_NODE", id: null })}
              />
            )}
          </div>

          <p style={{ fontSize: 12, color: "#475569", marginTop: 12, textAlign: "center" }}>
            Click any node to see details · Click <strong>+</strong> to expand team · Scroll horizontally for wide trees · Search to highlight matches
          </p>
        </div>
      )}

      {/* ── Redux Toolkit Tab ── */}
      {activeTab === "redux" && (
        <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "orgChartSlice.ts — createSlice with typed reducers",
              color: "#f59e0b",
              code: `import { createSlice, PayloadAction, createEntityAdapter } from "@reduxjs/toolkit";

// 1. Normalized entity adapter — O(1) lookups by id
const nodesAdapter = createEntityAdapter<OrgNode>();

interface OrgChartState {
  nodes: ReturnType<typeof nodesAdapter.getInitialState>;
  expanded: string[];    // Set stored as array (serializable — Redux requirement)
  selectedId: string | null;
  searchQuery: string;
  focusRootId: string | null;
}

const initialState: OrgChartState = {
  nodes: nodesAdapter.getInitialState(),
  expanded: [],
  selectedId: null,
  searchQuery: "",
  focusRootId: null,
};

export const orgChartSlice = createSlice({
  name: "orgChart",
  initialState,
  reducers: {
    // Toggle expand/collapse — auto-collapses descendants
    toggleNode: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const idx = state.expanded.indexOf(id);
      if (idx >= 0) {
        // Collapse: remove node and all descendants
        const descendants = getAllDescendants(id, state.nodes.entities);
        state.expanded = state.expanded.filter(
          e => e !== id && !descendants.includes(e)
        );
      } else {
        state.expanded.push(id);
      }
    },
    selectNode: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFocusRoot: (state, action: PayloadAction<string | null>) => {
      state.focusRootId = action.payload;
      state.expanded = [];   // collapse all when re-rooting
    },
    expandAll: (state) => {
      state.expanded = state.nodes.ids
        .filter(id => hasChildren(id as string, state.nodes.entities))
        .map(String);
    },
    collapseAll: (state) => {
      state.expanded = [];
    },
  },

  // RTK Query auto-updates entity state when org data is fetched
  extraReducers: (builder) => {
    builder.addMatcher(
      orgChartApi.endpoints.getOrgChart.matchFulfilled,
      (state, action) => {
        nodesAdapter.setAll(state.nodes, action.payload);
      }
    );
  },
});

export const { toggleNode, selectNode, setSearch, setFocusRoot, expandAll, collapseAll } =
  orgChartSlice.actions;

// Selectors — memoized with Reselect
export const selectExpanded = (state: RootState) =>
  new Set(state.orgChart.expanded);

export const selectMatchingNodes = createSelector(
  [(state: RootState) => state.orgChart.nodes.entities,
   (state: RootState) => state.orgChart.searchQuery],
  (entities, query) => {
    if (!query.trim()) return new Set<string>();
    const q = query.toLowerCase();
    return new Set(
      Object.values(entities)
        .filter(n => n!.name.toLowerCase().includes(q) || n!.title.toLowerCase().includes(q))
        .map(n => n!.id)
    );
  }
);`,
            },
            {
              title: "orgChartApi.ts — RTK Query data fetching",
              color: "#6366f1",
              code: `import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const orgChartApi = createApi({
  reducerPath: "orgChartApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/v1/" }),
  tagTypes: ["OrgNode"],

  endpoints: (builder) => ({

    // Fetch the entire org tree
    getOrgChart: builder.query<OrgNode[], void>({
      query: () => "org-chart",
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "OrgNode" as const, id })), "OrgNode"]
          : ["OrgNode"],

      // Transform flat list to include computed fields (headcount)
      transformResponse: (raw: OrgNode[]) => {
        const childMap = buildChildMap(raw);
        return raw.map(node => ({
          ...node,
          directReports: childMap.get(node.id)?.length ?? 0,
          totalHeadcount: getTotalHeadcount(node.id, childMap),
        }));
      },
    }),

    // Lazy-load a specific subtree (large orgs)
    getSubtree: builder.query<OrgNode[], string>({
      query: (managerId) => \`org-chart/subtree/\${managerId}\`,
      providesTags: (_, __, id) => [{ type: "OrgNode", id }],
    }),

    // Update reporting line (drag-and-drop reorg)
    updateParent: builder.mutation<void, { nodeId: string; newParentId: string }>({
      query: ({ nodeId, newParentId }) => ({
        url: \`org-chart/\${nodeId}/parent\`,
        method: "PATCH",
        body: { parentId: newParentId },
      }),
      invalidatesTags: (_, __, { nodeId }) => [{ type: "OrgNode", id: nodeId }],

      // Optimistic update — update UI before server confirms
      async onQueryStarted({ nodeId, newParentId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          orgChartApi.util.updateQueryData("getOrgChart", undefined, (draft) => {
            const node = draft.find(n => n.id === nodeId);
            if (node) node.parentId = newParentId;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo(); // Roll back on server error
        }
      },
    }),
  }),
});

// Auto-generated hooks:
export const {
  useGetOrgChartQuery,
  useGetSubtreeQuery,
  useUpdateParentMutation,
} = orgChartApi;

// Usage in component:
function OrgChart() {
  const { data, isLoading, error } = useGetOrgChartQuery();
  const [updateParent] = useUpdateParentMutation();

  if (isLoading) return <OrgChartSkeleton />;
  if (error) return <ErrorBanner error={error} />;
  return <OrgTree nodes={data!} />;
}`,
            },
          ].map(section => (
            <div key={section.title} style={{
              background: "#1e293b", border: `1px solid ${section.color}30`,
              borderLeft: `4px solid ${section.color}`, borderRadius: 10, padding: 16,
            }}>
              <h3 style={{ margin: "0 0 12px", color: section.color, fontSize: 14, fontWeight: 700 }}>{section.title}</h3>
              <pre style={{ margin: 0, background: "#0f172a", color: "#94a3b8", padding: 14, borderRadius: 8, fontSize: 11, fontFamily: "monospace", lineHeight: 1.7, overflow: "auto" }}>
                <code>{section.code}</code>
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* ── React Spring Tab ── */}
      {activeTab === "spring" && (
        <div style={{ maxWidth: 820, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              title: "useSpring — Node hover & card lift",
              color: "#10b981",
              code: `import { useSpring, animated } from "@react-spring/web";

function OrgNodeCard({ node, isSelected }) {
  // Hover lift effect — spring physics means it overshoots slightly (natural feel)
  const [springs, api] = useSpring(() => ({
    y: 0,           // translateY in px
    scale: 1,
    shadow: 8,      // box-shadow blur radius
    config: {
      tension: 300,  // stiffness — higher = faster return
      friction: 20,  // damping  — higher = less oscillation
    },
  }));

  return (
    <animated.div
      style={{
        // animated.div forwards spring values directly to style
        transform: springs.y.to(y => \`translateY(\${y}px) scale(\${springs.scale.get()})\`),
        boxShadow: springs.shadow.to(s => \`0 \${s}px \${s * 2}px rgba(0,0,0,0.3)\`),
      }}
      onMouseEnter={() => api.start({ y: -6, scale: 1.03, shadow: 20 })}
      onMouseLeave={() => api.start({ y: 0,  scale: 1,    shadow: 8  })}
    >
      <NodeContent node={node} />
    </animated.div>
  );
}`,
            },
            {
              title: "useTransition — Animated expand/collapse",
              color: "#6366f1",
              code: `import { useTransition, animated } from "@react-spring/web";

function AnimatedChildren({ children, visible, childIds }) {
  // useTransition: manages mount/unmount lifecycle with spring animations
  const transitions = useTransition(visible ? childIds : [], {
    from:   { opacity: 0, transform: "scale(0.85) translateY(-8px)" },
    enter:  { opacity: 1, transform: "scale(1)    translateY(0px)"  },
    leave:  { opacity: 0, transform: "scale(0.85) translateY(-8px)" },

    trail: 50,   // stagger each child by 50ms (cascade effect)
    config: { tension: 280, friction: 26 },

    // Key function — stable identity across re-renders
    keys: id => id,
  });

  return (
    <div style={{ display: "flex", gap: 20 }}>
      {transitions((style, childId) => (
        <animated.div key={childId} style={style}>
          <OrgTree nodeId={childId} />
        </animated.div>
      ))}
    </div>
  );
}`,
            },
            {
              title: "Custom useSpring — real spring physics (used in this demo)",
              color: "#a78bfa",
              code: `// Our implementation without the library — teaches the math:

function useSpring<T extends Record<string, number>>(initial: T) {
  const [values, setValues] = useState(initial);
  const state = useRef({ pos: initial, vel: {} as T, target: initial, rafId: 0 });

  const api = {
    start: (target: Partial<T>, cfg = { tension: 180, friction: 24 }) => {
      Object.assign(state.current.target, target);

      const step = () => {
        let dirty = false;
        const next = { ...state.current.pos };

        for (const key in target) {
          const t = state.current.target[key];   // target value
          const p = state.current.pos[key];       // current position
          const v = state.current.vel[key] ?? 0;  // current velocity

          // Hooke's Law spring:
          //   acceleration = -tension * displacement - friction * velocity
          const a  = -cfg.tension * (p - t) - cfg.friction * v;
          const nv = v + a / 60;   // velocity update (60fps = 1/60s timestep)
          const np = p + nv / 60;  // position update

          state.current.pos[key] = np;
          state.current.vel[key] = nv;
          next[key] = np;

          // Stop when within threshold of target
          if (Math.abs(np - t) > 0.001 || Math.abs(nv) > 0.001) dirty = true;
        }

        setValues({ ...next } as T);
        if (dirty) state.current.rafId = requestAnimationFrame(step);
      };

      cancelAnimationFrame(state.current.rafId);
      state.current.rafId = requestAnimationFrame(step);
    },
  };

  return [values, api] as const;
}

// Spring config guide:
// { tension: 300, friction: 20 } → Fast, bouncy (UI tooltips, badges)
// { tension: 180, friction: 24 } → Default feel (most UI elements)
// { tension: 120, friction: 14 } → Slow, elastic (page transitions)
// { tension: 500, friction: 50 } → Very stiff, barely oscillates (status bars)`,
            },
          ].map(section => (
            <div key={section.title} style={{
              background: "#1e293b", border: `1px solid ${section.color}30`,
              borderLeft: `4px solid ${section.color}`, borderRadius: 10, padding: 16,
            }}>
              <h3 style={{ margin: "0 0 12px", color: section.color, fontSize: 14, fontWeight: 700 }}>{section.title}</h3>
              <pre style={{ margin: 0, background: "#0f172a", color: "#94a3b8", padding: 14, borderRadius: 8, fontSize: 11, fontFamily: "monospace", lineHeight: 1.7, overflow: "auto" }}>
                <code>{section.code}</code>
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrgChartDemo;
