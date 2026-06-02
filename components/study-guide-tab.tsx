"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Loader2,
  Globe,
  Type,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { saveAiOutput } from "@/lib/ai-output-saver";
import type { StudyGuide } from "@/lib/study-guide-types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-accent">
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-md">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {title}
      </button>
      {open && <div className="px-2 pb-2">{children}</div>}
    </div>
  );
}

function StudyGuideDisplay({ guide }: { guide: StudyGuide }) {
  const fullMarkdown = `# ${guide.title}\n\n${guide.summary}\n\n## Key Concepts\n${guide.concepts.map((c) => `- ${c}`).join("\n")}\n\n## Terms\n${guide.terms.map((t) => `**${t.term}**: ${t.definition}`).join("\n")}\n\n## Questions\n${guide.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold">{guide.title}</h4>
        <div className="flex items-center gap-1">
          {guide.cached && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Cached
            </span>
          )}
          <CopyButton text={fullMarkdown} />
        </div>
      </div>

      <CollapsibleSection title="Summary">
        <p className="text-xs text-muted-foreground">{guide.summary}</p>
      </CollapsibleSection>

      <CollapsibleSection title={`Key Concepts (${guide.concepts.length})`}>
        <ul className="space-y-1">
          {guide.concepts.map((c, i) => (
            <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
              <span className="text-primary">•</span>
              {c}
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {guide.terms.length > 0 && (
        <CollapsibleSection title={`Terms (${guide.terms.length})`} defaultOpen={false}>
          <div className="space-y-1.5">
            {guide.terms.map((t, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium">{t.term}</span>
                <span className="text-muted-foreground"> — {t.definition}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {guide.examples.length > 0 && (
        <CollapsibleSection title={`Examples (${guide.examples.length})`} defaultOpen={false}>
          <div className="space-y-2">
            {guide.examples.map((ex, i) => (
              <div key={i}>
                <pre className="text-[10px] bg-muted p-2 rounded overflow-x-auto">
                  <code>{ex.code}</code>
                </pre>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {ex.explanation}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection title={`Practice Questions (${guide.questions.length})`} defaultOpen={false}>
        <ol className="space-y-1">
          {guide.questions.map((q, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              {i + 1}. {q}
            </li>
          ))}
        </ol>
      </CollapsibleSection>

      {guide.relatedTopics.length > 0 && (
        <CollapsibleSection title="Related Topics" defaultOpen={false}>
          <div className="flex flex-wrap gap-1">
            {guide.relatedTopics.map((t, i) => (
              <span
                key={i}
                className="text-[10px] bg-muted px-1.5 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {guide.sourceUrl && (
        <p className="text-[10px] text-muted-foreground truncate">
          Source:{" "}
          <a
            href={guide.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {guide.sourceUrl}
          </a>
        </p>
      )}
    </div>
  );
}

export function StudyGuideTab() {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    const input = mode === "url" ? url.trim() : text.trim();
    if (!input) return;

    setLoading(true);
    setError(null);
    setGuide(null);

    try {
      const res = await fetch("/api/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "url" ? { url: input } : { text: input }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed: ${res.status}`);
      }

      setGuide(data);

      // Auto-save as markdown
      const topic = data.title || input.slice(0, 50);
      const md = `# ${data.title}\n\n${data.summary}\n\n## Key Concepts\n${(data.concepts || []).map((c: string) => `- ${c}`).join("\n")}\n\n## Terms\n${(data.terms || []).map((t: { term: string; definition: string }) => `**${t.term}**: ${t.definition}`).join("\n")}\n\n## Examples\n${(data.examples || []).map((ex: { code: string; explanation: string }) => `\`\`\`\n${ex.code}\n\`\`\`\n${ex.explanation}`).join("\n\n")}\n\n## Practice Questions\n${(data.questions || []).map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}\n\n## Related Topics\n${(data.relatedTopics || []).map((t: string) => `- ${t}`).join("\n")}`;
      saveAiOutput("study-guide", topic, md).catch(console.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }, [mode, url, text]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Enter a URL or paste article text to generate a study guide.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-1">
        <Button
          variant={mode === "url" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={() => setMode("url")}
        >
          <Globe className="h-3 w-3 mr-1" />
          URL
        </Button>
        <Button
          variant={mode === "text" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={() => setMode("text")}
        >
          <Type className="h-3 w-3 mr-1" />
          Text
        </Button>
      </div>

      {/* Input */}
      {mode === "url" ? (
        <Input
          placeholder="https://example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-8 text-xs"
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
      ) : (
        <Textarea
          placeholder="Paste article text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[80px] text-xs resize-none"
        />
      )}

      {/* Generate button */}
      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={loading || (mode === "url" ? !url.trim() : !text.trim())}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <BookOpen className="h-3.5 w-3.5 mr-2" />
        )}
        {loading ? "Generating..." : "Generate Study Guide"}
      </Button>

      {/* Error */}
      {error && (
        <div className="p-2 bg-destructive/10 text-destructive text-xs rounded-md flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs mt-1 px-1"
              onClick={handleGenerate}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Result */}
      {guide && <StudyGuideDisplay guide={guide} />}

      {/* Empty state */}
      {!guide && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <BookOpen className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-xs text-center">
            {mode === "url"
              ? "Paste a URL above to generate a study guide from an article"
              : "Paste article text above to generate a study guide"}
          </p>
        </div>
      )}
    </div>
  );
}
