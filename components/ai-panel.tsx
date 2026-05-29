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
  Rss,
  Brain,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { usePKMStore } from "@/lib/store";
import { LearningPathTab } from "@/components/learning-path-tab";
import { StudyGuideTab } from "@/components/study-guide-tab";
import { SkillGeneratorTab } from "@/components/skill-generator-tab";
import { DailyDevTab } from "@/components/daily-dev-tab";
import { AnnotationPanel } from "@/components/annotation-panel";
import { saveAiOutput } from "@/lib/ai-output-saver";

function AiResponse({ text, loading }: { text: string; loading: boolean }) {
  const [copied, setCopied] = useState(false);

  if (!text && !loading) return null;

  return (
    <div className="relative mt-3 p-3 bg-muted/50 rounded-lg border border-border">
      {text ? (
        <div className="markdown-content prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed fade-in">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
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
      <p className="text-sm text-muted-foreground">
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
  const [mode, setMode] = useState<"technical" | "eli5">("technical");
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
        mode,
      },
    });
  }, [selectedText, editorContent, complete, mode]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select text in the document, then click Explain to get a simpler
        explanation.
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant={mode === "technical" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setMode("technical")}
        >
          Technical
        </Button>
        <Button
          variant={mode === "eli5" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setMode("eli5")}
        >
          Simple
        </Button>
        {mode === "eli5" && (
          <Badge variant="secondary" className="text-[10px]">
            ELI5
          </Badge>
        )}
      </div>
      {selectedText ? (
        <div className="p-2 bg-muted/50 rounded text-sm border border-border">
          <Badge variant="secondary" className="mb-1 text-xs">
            Selected
          </Badge>
          <p className="line-clamp-3">{selectedText}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
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
        <p className="text-sm text-muted-foreground">Translate direction:</p>
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

type Exercise =
  | { type: "predict-output"; code: string; question: string; answer: string; explanation: string }
  | { type: "fix-bug"; code: string; buggyLine: string; correctCode: string; explanation: string }
  | { type: "quiz"; question: string; options: string[]; correctIndex: number; explanation: string };

function ExerciseCard({
  exercise,
  index,
  revealed,
  onReveal,
}: {
  exercise: Exercise;
  index: number;
  revealed: boolean;
  onReveal: () => void;
}) {
  const typeLabels = {
    "predict-output": "Predict Output",
    "fix-bug": "Find the Bug",
    quiz: "Quiz",
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">
          {typeLabels[exercise.type]}
        </Badge>
        <span className="text-xs text-muted-foreground">#{index + 1}</span>
      </div>

      {exercise.type === "predict-output" && (
        <>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            <code>{exercise.code}</code>
          </pre>
          <p className="text-sm">{exercise.question}</p>
          {!revealed ? (
            <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={onReveal}>
              Show Answer
            </Button>
          ) : (
            <div className="p-2 bg-muted/50 rounded text-sm space-y-1 fade-in">
              <p className="font-medium text-green-600 dark:text-green-400">Output: {exercise.answer}</p>
              <p className="text-muted-foreground text-xs">{exercise.explanation}</p>
            </div>
          )}
        </>
      )}

      {exercise.type === "fix-bug" && (
        <>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
            <code>{exercise.code}</code>
          </pre>
          <p className="text-sm">Find and fix the bug!</p>
          {!revealed ? (
            <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={onReveal}>
              Show Fix
            </Button>
          ) : (
            <div className="p-2 bg-muted/50 rounded text-sm space-y-1 fade-in">
              <p className="text-xs text-muted-foreground">Buggy line: <code>{exercise.buggyLine}</code></p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                <code>{exercise.correctCode}</code>
              </pre>
              <p className="text-muted-foreground text-xs">{exercise.explanation}</p>
            </div>
          )}
        </>
      )}

      {exercise.type === "quiz" && (
        <>
          <p className="text-sm font-medium">{exercise.question}</p>
          <div className="space-y-1">
            {exercise.options.map((opt, i) => (
              <button
                key={i}
                onClick={onReveal}
                className={`w-full text-left text-xs p-2 rounded border transition-colors ${
                  revealed && i === exercise.correctIndex
                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                    : revealed
                    ? "border-border opacity-50"
                    : "border-border hover:bg-accent"
                }`}
                disabled={revealed}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
          {revealed && (
            <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground fade-in">
              {exercise.explanation}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExerciseTab() {
  const { editorContent } = usePKMStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const handleGenerate = useCallback(async () => {
    if (!editorContent) return;
    setLoading(true);
    setError(null);
    setExercises([]);
    setRevealed(new Set());

    try {
      const res = await fetch("/api/generate-exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editorContent }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setExercises(data);
      }
    } catch {
      setError("Failed to generate exercises");
    } finally {
      setLoading(false);
    }
  }, [editorContent]);

  const handleReveal = useCallback((index: number) => {
    setRevealed((prev) => new Set(prev).add(index));
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Generate interactive exercises from the current document.
      </p>
      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={loading || !editorContent}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <Brain className="h-3.5 w-3.5 mr-2" />
        )}
        {loading ? "Generating..." : "Generate Exercises"}
      </Button>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {exercises.length > 0 && (
        <div className="space-y-3 fade-in">
          {exercises.map((ex, i) => (
            <ExerciseCard
              key={i}
              exercise={ex}
              index={i}
              revealed={revealed.has(i)}
              onReveal={() => handleReveal(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const primaryTabs = [
  { value: "summarize", icon: Sparkles, label: "Summarize" },
  { value: "explain", icon: Bot, label: "Explain" },
  { value: "translate", icon: Languages, label: "Translate" },
  { value: "write", icon: PenLine, label: "Write" },
];

const secondaryTabs = [
  { value: "path", icon: Map, label: "Path" },
  { value: "guide", icon: BookOpen, label: "Guide" },
  { value: "skill", icon: Wand2, label: "Skill" },
  { value: "exercise", icon: Brain, label: "Exercise" },
  { value: "daily", icon: Rss, label: "Daily" },
  { value: "notes", icon: StickyNote, label: "Notes" },
];

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
          {/* Primary row: 4 main tabs */}
          <TabsList className="w-full grid grid-cols-4 h-8 mb-1">
            {primaryTabs.map(({ value, icon: Icon, label }) => (
              <TabsTrigger key={value} value={value} className="text-[11px] px-1">
                <Icon className="h-3 w-3 mr-0.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {/* Secondary row: 6 smaller tabs */}
          <TabsList className="w-full grid grid-cols-6 h-7">
            {secondaryTabs.map(({ value, icon: Icon, label }) => (
              <TabsTrigger key={value} value={value} className="text-[10px] px-1">
                <Icon className="h-3 w-3 mr-0.5" />
                {label}
              </TabsTrigger>
            ))}
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
          <TabsContent value="exercise" className="mt-3">
            <ExerciseTab />
          </TabsContent>
          <TabsContent value="daily" className="mt-3">
            <DailyDevTab />
          </TabsContent>
          <TabsContent value="notes" className="mt-3">
            <AnnotationPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
