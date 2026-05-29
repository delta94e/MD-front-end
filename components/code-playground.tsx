"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { buildSandboxHtml, prepareCode, type SandboxOutput, type OutputLevel } from "@/lib/code-sandbox";

interface CodePlaygroundProps {
  code: string;
  language: string;
}

const LEVEL_STYLES: Record<OutputLevel, string> = {
  log: "text-foreground",
  info: "text-foreground",
  warn: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
  result: "text-foreground font-mono",
};

const LEVEL_PREFIX: Record<OutputLevel, string> = {
  log: "",
  info: "",
  warn: "⚠ ",
  error: "✕ ",
  result: "→ ",
};

export function CodePlayground({ code, language }: CodePlaygroundProps) {
  const [output, setOutput] = useState<SandboxOutput[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [expanded, setExpanded] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Cleanup iframe on unmount
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = "";
      }
    };
  }, []);

  // Listen for messages from sandbox iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "sandbox-output") return;
      // Verify source
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;

      const { level, data } = e.data;

      if (level === "ready") {
        // Send code to execute
        const prepared = prepareCode(code, language);
        iframeRef.current?.contentWindow?.postMessage(
          { type: "sandbox-execute", code: prepared },
          "*"
        );
        return;
      }

      if (level === "done") {
        setStatus("done");
        return;
      }

      setOutput((prev) => [...prev, { level, data }]);
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [code, language]);

  const handleRun = useCallback(() => {
    setOutput([]);
    setStatus("running");
    setExpanded(true);

    // Create iframe with sandbox HTML
    if (iframeRef.current) {
      iframeRef.current.srcdoc = buildSandboxHtml(code);
    }
  }, [code]);

  const handleStop = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = "";
    }
    setStatus("idle");
  }, []);

  const handleClear = useCallback(() => {
    setOutput([]);
  }, []);

  return (
    <div className="mt-2 border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-1.5">
          {status === "running" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleStop}
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleRun}
            >
              <Play className="h-3 w-3 mr-1" />
              Run
            </Button>
          )}
          {output.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={handleClear}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
          {status === "running" && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running...
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1 text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse output" : "Expand output"}
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Output */}
      {expanded && (
        <div className="max-h-64 overflow-y-auto p-3 font-mono text-xs">
          {output.length === 0 && status === "idle" && (
            <p className="text-muted-foreground italic">Click Run to execute</p>
          )}
          {output.length === 0 && status === "running" && (
            <p className="text-muted-foreground italic">Executing...</p>
          )}
          {output.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap ${LEVEL_STYLES[line.level]}`}>
              {LEVEL_PREFIX[line.level]}
              {line.data}
            </div>
          ))}
        </div>
      )}

      {/* Hidden sandbox iframe */}
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className="hidden"
        title="Code sandbox"
      />
    </div>
  );
}
