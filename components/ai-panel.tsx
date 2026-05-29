"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Bot,
  Languages,
  PenLine,
  Copy,
  Check,
  Loader2,
  ArrowRightLeft,
  Map,
  BookOpen,
  Wand2,
  StickyNote,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePKMStore } from "@/lib/store";
import { LearningPathTab } from "@/components/learning-path-tab";
import { StudyGuideTab } from "@/components/study-guide-tab";
import { SkillGeneratorTab } from "@/components/skill-generator-tab";
import { AnnotationPanel } from "@/components/annotation-panel";
import { saveAiOutput } from "@/lib/ai-output-saver";

function AiResponse({ text, loading }: { text: string; loading: boolean }) {
  const [copied, setCopied] = useState(false);

  if (!text && !loading) return null;

  return (
    <div className="relative mt-3 p-3 bg-muted/50 rounded-lg border border-border">
      {text ? (
        <div className="markdown-content prose prose-sm dark:prose-invert max-w-none text-xs fade-in">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Thinking...
        </div>
      ) : null}
      {text && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="absolute top-2 right-2 p-1 rounded hover:bg-accent"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
}

function SummarizeTab() {
  const { editorContent, activeFile } = usePKMStore();
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/summarize",
    streamProtocol: "text",
  });
  const prevLoading = useRef(false);

  const handleSummarize = useCallback(() => {
    if (!editorContent) return;
    complete(editorContent);
  }, [editorContent, complete]);

  // Auto-save when completion finishes
  useEffect(() => {
    if (prevLoading.current && !isLoading && completion) {
      const topic = activeFile?.replace(/\.md$/, "").replace(/[-/]/g, " ") || "document";
      saveAiOutput("summarize", topic, completion).catch(console.error);
    }
    prevLoading.current = isLoading;
  }, [isLoading, completion, activeFile]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Generate a concise summary of the current document.
      </p>
      <Button
        size="sm"
        onClick={handleSummarize}
        disabled={isLoading || !editorContent}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 mr-2" />
        )}
        {isLoading ? "Summarizing..." : "Summarize Document"}
      </Button>
      <AiResponse text={completion} loading={isLoading} />
    </div>
  );
}

function ExplainTab() {
  const { selectedText, editorContent } = usePKMStore();
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/explain",
    streamProtocol: "text",
  });

  const handleExplain = useCallback(() => {
    if (!selectedText) return;
    complete("", {
      body: {
        selectedText,
        surroundingContext: editorContent.slice(0, 2000),
      },
    });
  }, [selectedText, editorContent, complete]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Select text in the document, then click Explain to get a simpler
        explanation.
      </p>
      {selectedText ? (
        <div className="p-2 bg-muted/50 rounded text-xs border border-border">
          <Badge variant="secondary" className="mb-1 text-[10px]">
            Selected
          </Badge>
          <p className="line-clamp-3">{selectedText}</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          No text selected. Highlight text in the viewer first.
        </p>
      )}
      <Button
        size="sm"
        onClick={handleExplain}
        disabled={isLoading || !selectedText}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <Bot className="h-3.5 w-3.5 mr-2" />
        )}
        {isLoading ? "Explaining..." : "Explain Selection"}
      </Button>
      <AiResponse text={completion} loading={isLoading} />
    </div>
  );
}

function TranslateTab() {
  const { selectedText, editorContent } = usePKMStore();
  const [direction, setDirection] = useState<"en-to-vi" | "vi-to-en">(
    "en-to-vi"
  );
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/translate",
    streamProtocol: "text",
  });

  const textToTranslate = selectedText || editorContent;

  const handleTranslate = useCallback(() => {
    if (!textToTranslate) return;
    complete(textToTranslate, { body: { direction } });
  }, [textToTranslate, direction, complete]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Translate direction:</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() =>
            setDirection((d) => (d === "en-to-vi" ? "vi-to-en" : "en-to-vi"))
          }
        >
          {direction === "en-to-vi" ? "EN → VI" : "VI → EN"}
          <ArrowRightLeft className="h-3 w-3 ml-1" />
        </Button>
      </div>
      <Button
        size="sm"
        onClick={handleTranslate}
        disabled={isLoading || !textToTranslate}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <Languages className="h-3.5 w-3.5 mr-2" />
        )}
        {isLoading ? "Translating..." : "Translate"}
      </Button>
      <AiResponse text={completion} loading={isLoading} />
    </div>
  );
}

function WriteTab() {
  const { selectedText, editorContent } = usePKMStore();
  const [action, setAction] = useState<
    "expand" | "fix-grammar" | "format" | "simplify"
  >("fix-grammar");
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/writing-assist",
    streamProtocol: "text",
  });

  const handleWrite = useCallback(() => {
    const text = selectedText || editorContent;
    if (!text) return;
    complete(text, { body: { action, fullDoc: editorContent } });
  }, [selectedText, editorContent, action, complete]);

  const actions = [
    { value: "expand" as const, label: "Expand" },
    { value: "fix-grammar" as const, label: "Fix Grammar" },
    { value: "format" as const, label: "Format" },
    { value: "simplify" as const, label: "Simplify" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {actions.map((a) => (
          <Button
            key={a.value}
            variant={action === a.value ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAction(a.value)}
          >
            {a.label}
          </Button>
        ))}
      </div>
      <Button
        size="sm"
        onClick={handleWrite}
        disabled={isLoading || (!selectedText && !editorContent)}
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <PenLine className="h-3.5 w-3.5 mr-2" />
        )}
        {isLoading ? "Working..." : `${actions.find((a) => a.value === action)?.label}`}
      </Button>
      <AiResponse text={completion} loading={isLoading} />
    </div>
  );
}

export function AiPanel() {
  const { aiPanelTab, setAiPanelTab } = usePKMStore();

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-ai-glow" />
          AI Assistant
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <Tabs value={aiPanelTab} onValueChange={setAiPanelTab}>
          <TabsList className="w-full grid grid-cols-8 h-8">
            <TabsTrigger value="summarize" className="text-[11px] px-1">
              <Sparkles className="h-3 w-3 mr-0.5" />
              Summarize
            </TabsTrigger>
            <TabsTrigger value="explain" className="text-[11px] px-1">
              <Bot className="h-3 w-3 mr-0.5" />
              Explain
            </TabsTrigger>
            <TabsTrigger value="translate" className="text-[11px] px-1">
              <Languages className="h-3 w-3 mr-0.5" />
              Translate
            </TabsTrigger>
            <TabsTrigger value="write" className="text-[11px] px-1">
              <PenLine className="h-3 w-3 mr-0.5" />
              Write
            </TabsTrigger>
            <TabsTrigger value="path" className="text-[11px] px-1">
              <Map className="h-3 w-3 mr-0.5" />
              Path
            </TabsTrigger>
            <TabsTrigger value="guide" className="text-[11px] px-1">
              <BookOpen className="h-3 w-3 mr-0.5" />
              Guide
            </TabsTrigger>
            <TabsTrigger value="skill" className="text-[11px] px-1">
              <Wand2 className="h-3 w-3 mr-0.5" />
              Skill
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-[11px] px-1">
              <StickyNote className="h-3 w-3 mr-0.5" />
              Notes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summarize" className="mt-3">
            <SummarizeTab />
          </TabsContent>
          <TabsContent value="explain" className="mt-3">
            <ExplainTab />
          </TabsContent>
          <TabsContent value="translate" className="mt-3">
            <TranslateTab />
          </TabsContent>
          <TabsContent value="write" className="mt-3">
            <WriteTab />
          </TabsContent>
          <TabsContent value="path" className="mt-3">
            <LearningPathTab />
          </TabsContent>
          <TabsContent value="guide" className="mt-3">
            <StudyGuideTab />
          </TabsContent>
          <TabsContent value="skill" className="mt-3">
            <SkillGeneratorTab />
          </TabsContent>
          <TabsContent value="notes" className="mt-3">
            <AnnotationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
