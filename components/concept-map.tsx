"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, X } from "lucide-react";
import { extractConceptMap, getNodeSize, type ConceptNode } from "@/lib/concept-map-extractor";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-xs text-muted-foreground">Loading concept map...</div>
    </div>
  ),
});

interface ConceptMapProps {
  content: string;
}

const LEVEL_COLORS: Record<number, string> = {
  1: "#7c3aed", // purple
  2: "#3b82f6", // blue
  3: "#10b981", // green
  4: "#6b7280", // gray
  5: "#6b7280",
  6: "#6b7280",
};

export function ConceptMap({ content }: ConceptMapProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const conceptMap = useMemo(() => extractConceptMap(content), [content]);

  // Graph data for react-force-graph-2d
  const graphData = useMemo(() => {
    const nodes = conceptMap.nodes.map((n) => ({
      id: n.id,
      name: n.label,
      level: n.level,
      size: getNodeSize(n.level),
    }));
    const links = conceptMap.edges.map((e) => ({
      source: e.source,
      target: e.target,
      label: e.label,
    }));
    return { nodes, links };
  }, [conceptMap]);

  // Adjacency for neighborhood dimming
  const adjacency = useMemo(() => {
    const adj = new Map<string, Set<string>>();
    for (const node of graphData.nodes) adj.set(node.id, new Set());
    for (const link of graphData.links) {
      const s = link.source as string, t = link.target as string;
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    }
    return adj;
  }, [graphData]);

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    return new Set(
      graphData.nodes
        .filter((n) => n.name.toLowerCase().includes(q))
        .map((n) => n.id)
    );
  }, [graphData, searchQuery]);

  // Hovered neighbors
  const hoveredNeighbors = useMemo(() => {
    if (!hoveredNodeId) return null;
    const neighbors = adjacency.get(hoveredNodeId) || new Set();
    return new Set([hoveredNodeId, ...neighbors]);
  }, [hoveredNodeId, adjacency]);

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

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as { id: string; name: string; level: number; size: number; x: number; y: number };
      const radius = n.size;
      const color = LEVEL_COLORS[n.level] ?? LEVEL_COLORS[4];
      const isSearchMatch = searchMatches.has(n.id);
      const isDimmed = hoveredNeighbors && !hoveredNeighbors.has(n.id);

      ctx.globalAlpha = isDimmed ? 0.15 : 1;

      // Draw node
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Search highlight ring
      if (isSearchMatch) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius + 2, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Label when zoomed in
      if (globalScale > 1.2 || searchMatches.has(n.id)) {
        const fontSize = Math.max(10, 12 - n.level) / globalScale;
        ctx.font = `${n.level === 1 ? "bold" : "normal"} ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#374151";
        ctx.fillText(n.name, n.x, n.y + radius + 3);
      }

      ctx.globalAlpha = 1;
    },
    [searchMatches, hoveredNeighbors]
  );

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const src = link.source;
      const tgt = link.target;
      if (typeof src === "string" || typeof tgt === "string") return;
      if (!src?.x || !tgt?.x) return;

      const sId = src.id || src.path;
      const tId = tgt.id || tgt.path;
      const isDimmed = hoveredNeighbors && !hoveredNeighbors.has(sId) && !hoveredNeighbors.has(tId);

      ctx.globalAlpha = isDimmed ? 0.05 : 0.4;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = "rgba(128, 128, 128, 0.5)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
    [hoveredNeighbors]
  );

  const handleNodeClick = useCallback((node: any) => {
    const n = node as ConceptNode;
    // Scroll to heading in the document
    const el = document.getElementById(n.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Brief highlight
      el.style.transition = "outline 0.3s";
      el.style.outline = "2px solid var(--primary)";
      setTimeout(() => { el.style.outline = "none"; }, 1500);
    }
  }, []);

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNodeId(node ? (node as ConceptNode).id : null);
  }, []);

  if (conceptMap.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No headings found in this file
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-background">
      {/* Search bar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter concepts..."
            className="pl-7 pr-7 py-1 text-xs bg-background/90 backdrop-blur border border-border rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <ForceGraph2D
        graphData={graphData}
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

      {/* Stats */}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
        {conceptMap.nodes.length} concepts · {conceptMap.edges.length} links
      </div>
    </div>
  );
}
