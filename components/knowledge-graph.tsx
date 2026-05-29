"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { usePKMStore } from "@/lib/store";
import { getGraphData } from "@/app/actions/files";
import { GraphToolbar } from "@/components/graph-toolbar";
import type { GraphData, GraphNode, GraphEdge } from "@/lib/graph-extractor";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-xs text-muted-foreground">Loading graph...</div>
    </div>
  ),
});

interface TooltipData {
  x: number;
  y: number;
  node: GraphNode;
}

/** Compute node radius from file size (3-12px range) */
function nodeRadius(size: number, maxSize: number): number {
  if (!size || !maxSize) return 4;
  const minR = 3, maxR = 12;
  return minR + (size / maxSize) * (maxR - minR);
}

/** BFS shortest path between two node IDs */
function findPath(edges: GraphEdge[], fromId: string, toId: string): string[] | null {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    const s = e.source as string, t = e.target as string;
    if (!adj.has(s)) adj.set(s, []);
    if (!adj.has(t)) adj.set(t, []);
    adj.get(s)!.push(t);
    adj.get(t)!.push(s);
  }

  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: string[] = [fromId];
  visited.add(fromId);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === toId) {
      const path: string[] = [];
      let node: string | undefined = toId;
      while (node) {
        path.unshift(node);
        node = parent.get(node);
      }
      return path;
    }
    for (const neighbor of adj.get(curr) || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, curr);
        queue.push(neighbor);
      }
    }
  }
  return null;
}

/** Compute convex hull points from node positions */
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);

  function cross(o: typeof sorted[0], a: typeof sorted[0], b: typeof sorted[0]) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  const lower: typeof sorted = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: typeof sorted = [];
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function KnowledgeGraph() {
  const {
    setActiveFile,
    graphCategoryFilter,
    setGraphCategoryFilter,
    graphSearchQuery,
    setGraphSearchQuery,
    activeFile,
  } = usePKMStore();

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [pathMode, setPathMode] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [pathResult, setPathResult] = useState<string[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  // Fetch graph data
  useEffect(() => {
    let cancelled = false;
    getGraphData()
      .then((data) => {
        if (!cancelled) {
          setGraphData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[KnowledgeGraph] Failed to load graph data:", err);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    observer.observe(el);
    setDimensions({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  // Adjacency map for neighborhood lookup
  const adjacency = useMemo(() => {
    if (!graphData) return new Map<string, Set<string>>();
    const adj = new Map<string, Set<string>>();
    for (const node of graphData.nodes) adj.set(node.id, new Set());
    for (const edge of graphData.edges) {
      const s = edge.source as string, t = edge.target as string;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    }
    return adj;
  }, [graphData]);

  // Max file size for scaling
  const maxFileSize = useMemo(() => {
    if (!graphData) return 0;
    return Math.max(...graphData.nodes.map((n) => n.size || 0), 1);
  }, [graphData]);

  // Categories list
  const categories = useMemo(() => {
    if (!graphData) return [];
    return Array.from(new Set(graphData.nodes.map((n) => n.category))).sort();
  }, [graphData]);

  // Path node set for highlighting
  const pathNodeSet = useMemo(() => {
    if (!pathResult) return new Set<string>();
    return new Set(pathResult);
  }, [pathResult]);

  // Path edge set
  const pathEdgeSet = useMemo(() => {
    if (!pathResult || pathResult.length < 2) return new Set<string>();
    const edges = new Set<string>();
    for (let i = 0; i < pathResult.length - 1; i++) {
      const a = pathResult[i], b = pathResult[i + 1];
      edges.add(a < b ? `${a}::${b}` : `${b}::${a}`);
    }
    return edges;
  }, [pathResult]);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!graphData) return null;
    const hasFilter = graphCategoryFilter.length > 0;
    const hasSearch = graphSearchQuery.trim().length > 0;
    const query = graphSearchQuery.toLowerCase().trim();

    const visibleNodes = graphData.nodes.filter((node) => {
      if (hasFilter && !graphCategoryFilter.includes(node.category)) return false;
      if (hasSearch && !node.name.toLowerCase().includes(query)) return false;
      return true;
    });

    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleLinks = graphData.edges
      .filter((e) => visibleIds.has(e.source as string) && visibleIds.has(e.target as string))
      .map((e) => ({ source: e.source, target: e.target, weight: e.weight }));

    return { nodes: visibleNodes, links: visibleLinks };
  }, [graphData, graphCategoryFilter, graphSearchQuery]);

  // Connected nodes for hovered node
  const hoveredNeighbors = useMemo(() => {
    if (!hoveredNodeId) return null;
    const neighbors = adjacency.get(hoveredNodeId) || new Set();
    return new Set([hoveredNodeId, ...neighbors]);
  }, [hoveredNodeId, adjacency]);

  const handleNodeClick = useCallback(
    (node: any) => {
      const gn = node as GraphNode;
      if (pathMode) {
        if (!pathStart) {
          setPathStart(gn.id);
          setPathEnd(null);
          setPathResult(null);
        } else if (!pathEnd && gn.id !== pathStart) {
          setPathEnd(gn.id);
          // Find path
          if (graphData) {
            const path = findPath(graphData.edges, pathStart, gn.id);
            setPathResult(path);
          }
        } else {
          // Reset path selection
          setPathStart(gn.id);
          setPathEnd(null);
          setPathResult(null);
        }
        return;
      }
      setActiveFile(gn.path, gn.category);
    },
    [pathMode, pathStart, graphData, setActiveFile]
  );

  const handleNodeHover = useCallback(
    (node: any) => {
      if (pathMode) return;
      setHoveredNodeId(node ? (node as GraphNode).id : null);
      if (node) {
        const gn = node as GraphNode;
        const graphEl = containerRef.current;
        if (graphEl && graphRef.current) {
          const rect = graphEl.getBoundingClientRect();
          const x = (gn as any).x || 0;
          const y = (gn as any).y || 0;
          const transform = graphRef.current.screen2GraphCoords?.(x, y) || { x, y };
          setTooltip({ x: transform.x - rect.left, y: transform.y - rect.top, node: gn });
        }
      } else {
        setTooltip(null);
      }
    },
    [pathMode]
  );

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const gn = node as GraphNode & { x: number; y: number };
      const radius = nodeRadius(gn.size, maxFileSize);
      const isActive = gn.path === activeFile;
      const isSearchMatch = graphSearchQuery.trim() &&
        gn.name.toLowerCase().includes(graphSearchQuery.toLowerCase().trim());
      const isInPath = pathNodeSet.has(gn.id);
      const isPathStart = gn.id === pathStart;
      const isPathEnd = gn.id === pathEnd;

      // Neighborhood dimming
      const isDimmed = hoveredNeighbors && !hoveredNeighbors.has(gn.id) && !pathMode;

      // Node opacity
      const alpha = isDimmed ? 0.15 : 1;

      // Draw node circle
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(gn.x, gn.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isInPath ? "#22c55e" : gn.color;
      ctx.fill();

      // Active file ring
      if (isActive) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gn.x, gn.y, radius + 3, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Path start/end markers
      if (isPathStart || isPathEnd) {
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(gn.x, gn.y, radius + 4, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Search match highlight
      if (isSearchMatch) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gn.x, gn.y, radius + 2, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Show label when zoomed in enough
      if (globalScale > 1.5) {
        const fontSize = 10 / globalScale;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#374151";
        ctx.fillText(gn.name, gn.x, gn.y + radius + 3);
      }
      ctx.globalAlpha = 1;
    },
    [activeFile, graphSearchQuery, hoveredNeighbors, maxFileSize, pathNodeSet, pathStart, pathEnd, pathMode]
  );

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const src = link.source;
      const tgt = link.target;
      if (typeof src === "string" || typeof tgt === "string") return;
      if (!src?.x || !tgt?.x) return;

      const sId = src.id || src.path;
      const tId = tgt.id || tgt.path;
      const edgeKey = sId < tId ? `${sId}::${tId}` : `${tId}::${sId}`;
      const isInPath = pathEdgeSet.has(edgeKey);
      const isDimmed = hoveredNeighbors && !hoveredNeighbors.has(sId) && !hoveredNeighbors.has(tId) && !pathMode;

      ctx.globalAlpha = isDimmed ? 0.05 : isInPath ? 1 : 0.3;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isInPath ? "#22c55e" : `rgba(128, 128, 128, 0.5)`;
      ctx.lineWidth = isInPath ? 3 : 0.5 + (link.weight || 0.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    [hoveredNeighbors, pathEdgeSet, pathMode]
  );

  // Cluster hull rendering (draw before nodes via paintOrder)
  const drawClusterHulls = useCallback(
    (ctx: CanvasRenderingContext2D, globalScale: number, nodes: any[]) => {
      if (!graphData || globalScale < 0.5) return;
      const byCategory = new Map<string, { x: number; y: number }[]>();
      for (const node of nodes) {
        const gn = node as GraphNode & { x: number; y: number };
        if (typeof gn.x !== "number" || typeof gn.y !== "number") continue;
        const list = byCategory.get(gn.category) || [];
        list.push({ x: gn.x, y: gn.y });
        byCategory.set(gn.category, list);
      }

      for (const [category, points] of byCategory) {
        if (points.length < 3) continue;
        const hull = convexHull(points);
        if (hull.length < 3) continue;

        // Expand hull slightly
        const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
        const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;
        const expanded = hull.map((p) => ({
          x: p.x + (p.x - cx) * 0.15,
          y: p.y + (p.y - cy) * 0.15,
        }));

        const color = graphData.nodes.find((n) => n.category === category)?.color || "#888";

        ctx.beginPath();
        ctx.moveTo(expanded[0].x, expanded[0].y);
        for (let i = 1; i < expanded.length; i++) {
          ctx.lineTo(expanded[i].x, expanded[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = color + "08";
        ctx.fill();
        ctx.strokeStyle = color + "30";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
    [graphData]
  );

  const handleZoomReset = useCallback(() => {
    graphRef.current?.zoomToFit(400, 50);
  }, []);

  const handleResetPath = useCallback(() => {
    setPathStart(null);
    setPathEnd(null);
    setPathResult(null);
    setPathMode(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xs text-muted-foreground">Loading graph...</div>
      </div>
    );
  }

  if (!filteredData || filteredData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xs text-muted-foreground">No graph data available</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-background fade-in">
      <GraphToolbar
        categories={categories}
        activeCategories={graphCategoryFilter}
        onCategoryToggle={setGraphCategoryFilter}
        searchQuery={graphSearchQuery}
        onSearchChange={setGraphSearchQuery}
        onZoomReset={handleZoomReset}
        pathMode={pathMode}
        onPathModeToggle={() => {
          if (pathMode) {
            handleResetPath();
          } else {
            setPathMode(true);
          }
        }}
        pathStart={pathStart}
        pathEnd={pathEnd}
        pathResult={pathResult}
        onResetPath={handleResetPath}
      />

      <ForceGraph2D
        ref={graphRef}
        graphData={filteredData}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        d3VelocityDecay={0.4}
        warmupTicks={50}
        cooldownTicks={100}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
      />

      {/* Tooltip overlay */}
      {tooltip && !pathMode && (
        <div
          className="absolute pointer-events-none z-20 bg-popover text-popover-foreground border border-border rounded-md px-2.5 py-1.5 shadow-md text-xs max-w-48"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          <div className="font-medium truncate">{tooltip.node.name}</div>
          <div className="text-muted-foreground text-[10px] truncate">{tooltip.node.path}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tooltip.node.color }} />
            <span className="text-[10px]">{tooltip.node.category}</span>
          </div>
          {tooltip.node.size > 0 && (
            <div className="text-[10px] text-muted-foreground">
              {(tooltip.node.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>
      )}

      {/* Path info banner */}
      {pathMode && pathResult && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-background/95 backdrop-blur border border-border rounded-lg px-3 py-1.5 shadow-md text-xs">
          <span className="text-green-500 font-medium">Path found:</span>{" "}
          {pathResult.length} nodes connected
        </div>
      )}

      {/* Stats bar */}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {filteredData.nodes.length} nodes · {filteredData.links.length} edges
      </div>
    </div>
  );
}
