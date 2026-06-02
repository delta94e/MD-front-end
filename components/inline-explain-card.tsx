"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Lightbulb, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineExplainCardProps {
  id: string;
  selectedText: string;
  content: string;
  status: "streaming" | "done" | "error";
  type?: "explain" | "why";
  onSave: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function InlineExplainCard({
  id,
  selectedText,
  content,
  status,
  type = "explain",
  onSave,
  onDismiss,
}: InlineExplainCardProps) {
  const isWhy = type === "why";
  const accentColor = isWhy ? "var(--why-glow)" : "var(--ai-glow)";
  const accentBg = isWhy ? "var(--why-glow-subtle)" : "var(--ai-glow-subtle)";

  return (
    <div
      className="my-4 rounded-lg border overflow-hidden fade-in"
      style={{ borderColor: accentColor, backgroundColor: accentBg }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: `color-mix(in srgb, ${accentColor} 20%, transparent)` }}
      >
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: accentColor }}>
          {isWhy ? <Lightbulb className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
          {isWhy ? "Why This Works" : "AI Explanation"}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="p-0.5 rounded hover:bg-accent transition-colors"
          aria-label="Dismiss explanation"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Selected text quote */}
      <div
        className="px-3 py-2 text-xs text-muted-foreground border-b bg-background/50"
        style={{ borderColor: `color-mix(in srgb, ${accentColor} 10%, transparent)` }}
      >
        <span className="line-clamp-2 italic">
          &ldquo;{selectedText}&rdquo;
        </span>
      </div>

      {/* Explanation content */}
      <div className="px-3 py-3 max-h-[400px] overflow-y-auto">
        {status === "streaming" && !content && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating explanation...
          </div>
        )}
        {content && (
          <div className="markdown-content prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
            {status === "streaming" && (
              <span className="inline-block w-1.5 h-4 animate-pulse ml-0.5" style={{ backgroundColor: accentColor }} />
            )}
          </div>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">
            Failed to generate explanation. Please try again.
          </p>
        )}
      </div>

      {/* Actions */}
      {status === "done" && (
        <div
          className="flex justify-end gap-2 px-3 py-2 border-t"
          style={{ borderColor: `color-mix(in srgb, ${accentColor} 10%, transparent)` }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onDismiss(id)}
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => onSave(id)}
          >
            <Save className="h-3 w-3 mr-1" />
            Save to Document
          </Button>
        </div>
      )}
    </div>
  );
}
