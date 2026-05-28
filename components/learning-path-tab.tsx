"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Map, Loader2, BookOpen, Clock, AlertCircle } from "lucide-react";
import { getTopicIndex } from "@/app/actions/files";
import { usePKMStore } from "@/lib/store";
import type { TopicCategory } from "@/lib/topic-index";
import type { LearningPath, LearningPathStep } from "@/lib/learning-path-types";

function PathStep({
  step,
  isLast,
  onOpen,
}: {
  step: LearningPathStep;
  isLast: boolean;
  onOpen: (path: string) => void;
}) {
  return (
    <div className="flex gap-3">
      {/* Timeline line + circle */}
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
          {step.order}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border my-1" />}
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <button
          onClick={() => onOpen(step.path)}
          className="text-sm font-medium text-left hover:text-primary transition-colors truncate block w-full"
        >
          {step.title}
        </button>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {step.rationale}
        </p>
        {step.estimatedMinutes && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
            <Clock className="h-2.5 w-2.5" />
            {step.estimatedMinutes} min
          </span>
        )}
      </div>
    </div>
  );
}

export function LearningPathTab() {
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setActiveFile } = usePKMStore();

  useEffect(() => {
    getTopicIndex().then(setCategories).catch(console.error);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedTopic) return;

    const category = categories.find((c) => c.id === selectedTopic);
    if (!category) return;

    setLoading(true);
    setError(null);
    setLearningPath(null);

    try {
      const res = await fetch("/api/learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: category.name, files: category.files }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Request failed: ${res.status}`);
      }

      const result: LearningPath = await res.json();
      setLearningPath(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate path");
    } finally {
      setLoading(false);
    }
  }, [selectedTopic, categories]);

  const handleOpenFile = useCallback(
    (path: string) => {
      const category = categories.find((c) => c.id === selectedTopic);
      setActiveFile(path, category?.name ?? "");
    },
    [selectedTopic, categories, setActiveFile]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Select a topic to generate an ordered study path.
      </p>

      <Select value={selectedTopic} onValueChange={(v) => v && setSelectedTopic(v)}>
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="Choose a topic..." />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id} className="text-xs">
              {cat.name} ({cat.files.length})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        onClick={handleGenerate}
        disabled={loading || !selectedTopic}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
        ) : (
          <Map className="h-3.5 w-3.5 mr-2" />
        )}
        {loading ? "Generating..." : "Generate Path"}
      </Button>

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

      {learningPath && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold">Study Path</h4>
            {learningPath.totalEstimatedMinutes && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                ~{Math.round(learningPath.totalEstimatedMinutes / 60)}h total
              </span>
            )}
          </div>

          {learningPath.steps.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No valid steps returned. Try a different topic.
            </p>
          ) : (
            <div className="space-y-0">
              {learningPath.steps.map((step, i) => (
                <PathStep
                  key={step.path}
                  step={step}
                  isLast={i === learningPath.steps.length - 1}
                  onOpen={handleOpenFile}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {!learningPath && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <BookOpen className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-xs text-center">
            Pick a topic above to generate your personalized study path
          </p>
        </div>
      )}
    </div>
  );
}
