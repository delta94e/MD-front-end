"use client";

import { useEffect, useRef } from "react";
import { List } from "lucide-react";
import type { TOCItem } from "@/lib/toc-extractor";

interface TOCPanelProps {
  items: TOCItem[];
  activeId: string | null;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function TOCPanel({ items, activeId, scrollContainerRef }: TOCPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll TOC to keep active item visible
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-heading-id="${activeId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeId]);

  if (items.length === 0) return null;

  const handleClick = (id: string) => {
    const headingEl = document.getElementById(id);
    if (!headingEl) return;

    const container = scrollContainerRef?.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const headingRect = headingEl.getBoundingClientRect();
      const offset = headingRect.top - containerRect.top + container.scrollTop - 64;
      container.scrollTo({ top: offset, behavior: "smooth" });
    } else {
      headingEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
        <List className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          On this page
        </span>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto py-2">
        {items.map((item) => (
          <button
            key={item.id}
            data-heading-id={item.id}
            onClick={() => handleClick(item.id)}
            className={`w-full text-left px-3 py-1 text-xs transition-colors hover:bg-accent/50 ${
              activeId === item.id
                ? "text-foreground font-medium border-l-2 border-primary bg-accent/30"
                : "text-muted-foreground border-l-2 border-transparent"
            }`}
            style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
          >
            {item.text}
          </button>
        ))}
      </div>
    </div>
  );
}
