"use client";

import { useEffect, useRef, useId } from "react";
import mermaid from "mermaid";

let initialized = false;

function initMermaid() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    flowchart: { curve: "basis" },
  });
  initialized = true;
}

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "-");

  useEffect(() => {
    if (!containerRef.current) return;
    initMermaid();

    const render = async () => {
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-xs text-red-500">Failed to render Mermaid diagram</pre>`;
        }
      }
    };

    render();
  }, [chart, id]);

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto [&>svg]:max-w-full"
    />
  );
}
