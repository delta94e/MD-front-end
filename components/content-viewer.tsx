"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { usePKMStore, type ExplanationEntry } from "@/lib/store";
import { ReadingSettingsSheet, getMaxWidthPx, getFontFamilyCSS } from "@/components/reading-settings-popover";
import { readFileContent, writeFileContent } from "@/app/actions/files";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { TOCPanel } from "@/components/toc-panel";
import { SelectionToolbar } from "@/components/selection-toolbar";
import { extractHeadings } from "@/lib/toc-extractor";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Eye,
  Save,
  Sparkles,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Code2,
  Type,
  GitBranch,
  BookOpen,
} from "lucide-react";
import { ConceptMap } from "@/components/concept-map";
import { toast } from "sonner";

const LexicalEditor = dynamic(
  () =>
    import("@/components/editor/lexical-editor").then(
      (mod) => mod.LexicalEditor
    ),
  { ssr: false, loading: () => <div className="h-full bg-muted animate-pulse" /> }
);

const MarkdownSource = dynamic(
  () =>
    import("@/components/editor/markdown-source").then(
      (mod) => mod.MarkdownSource
    ),
  { ssr: false, loading: () => <div className="h-full bg-muted animate-pulse" /> }
);

export function ContentViewer() {
  const {
    activeFile,
    editorMode,
    setEditorMode,
    editorSubMode,
    setEditorSubMode,
    editorContent,
    setEditorContent,
    setAiPanelOpen,
    setAiPanelTab,
    setSelectedText,
    readingPreferences,
    loadReadingPreferences,
    explanations,
    addExplanation,
    updateExplanation,
    removeExplanation,
  } = usePKMStore();

  // Load saved reading preferences from localStorage after mount
  useEffect(() => {
    loadReadingPreferences();
  }, [loadReadingPreferences]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [originalContent, setOriginalContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(true);
  const [conceptMapOpen, setConceptMapOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tocItems = useMemo(() => {
    if (editorMode !== "view" || !editorContent) return [];
    return extractHeadings(editorContent);
  }, [editorContent, editorMode]);

  useEffect(() => {
    if (!activeFile) return;
    setLoading(true);
    setDirty(false);
    setError(null);
    setEditorMode("view");
    readFileContent(activeFile)
      .then((content) => {
        setEditorContent(content);
        setOriginalContent(content);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[ContentViewer] Failed to load file:", err);
        setError("Failed to load file");
        setLoading(false);
      });
  }, [activeFile, setEditorContent, setEditorMode]);

  const handleEditorChange = useCallback(
    (value: string) => {
      setEditorContent(value);
      setDirty(value !== originalContent);
    },
    [setEditorContent, originalContent]
  );

  const handleSave = useCallback(async () => {
    if (!activeFile || !dirty) return;
    setSaving(true);
    const result = await writeFileContent(activeFile, editorContent);
    if (result.success) {
      setDirty(false);
      setOriginalContent(editorContent);
      toast.success("File saved");
    } else {
      toast.error("Failed to save file");
    }
    setSaving(false);
  }, [activeFile, editorContent, dirty]);

  // Ctrl+S handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Helper: find paragraph index containing the selected text
  const findParagraphContaining = useCallback((markdown: string, text: string): number => {
    const paragraphs = markdown.split("\n\n");
    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].includes(text)) {
        return i;
      }
    }
    return -1;
  }, []);

  // Helper: insert content after a paragraph index
  const insertAfterParagraph = useCallback((markdown: string, index: number, marker: string): string => {
    const paragraphs = markdown.split("\n\n");
    if (index < 0 || index >= paragraphs.length) {
      return markdown + marker;
    }
    paragraphs.splice(index + 1, 0, marker.trim());
    return paragraphs.join("\n\n");
  }, []);

  // Stream explanation from API
  const streamExplanation = useCallback(async (id: string, selectedText: string, surroundingContext: string, endpoint = "/api/explain") => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedText, surroundingContext }),
      });
      if (!res.ok || !res.body) throw new Error("Failed to fetch explanation");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        updateExplanation(id, { content: accumulated });
      }
      updateExplanation(id, { status: "done" });
    } catch {
      updateExplanation(id, { status: "error" });
      toast.error("Failed to generate explanation");
    }
  }, [updateExplanation]);

  // Save explanation as blockquote
  const handleSaveExplanation = useCallback((id: string) => {
    const entry = explanations.find((e) => e.id === id);
    if (!entry) return;
    const label = entry.type === "why" ? "Why This Works" : "AI Explanation";
    const marker = `<!--inline-explain:${id}-->`;
    const blockquote = `\n\n> **${label}** (for: "${entry.selectedText.slice(0, 60)}...")\n>\n> ${entry.content.replace(/\n/g, "\n> ")}\n\n`;
    const newContent = editorContent.replace(marker, blockquote);
    setEditorContent(newContent);
    setDirty(true);
    removeExplanation(id);
    toast.success(`${label} saved to document`);
  }, [explanations, editorContent, setEditorContent, removeExplanation]);

  // Dismiss explanation
  const handleDismissExplanation = useCallback((id: string) => {
    const marker = `<!--inline-explain:${id}-->`;
    const newContent = editorContent.replace(/\n*\s*<!--inline-explain:[^>]+-->\n*/g, "");
    setEditorContent(newContent);
    removeExplanation(id);
  }, [editorContent, setEditorContent, removeExplanation]);

  // Selection toolbar action handler
  const handleSelectionAction = useCallback(
    (action: string, text: string) => {
      console.log("[ContentViewer] handleSelectionAction", action, text.slice(0, 50));
      if (action === "annotate") {
        // Trigger annotation popover in markdown viewer
        const annotateFn = (window as any).__annotateSelection;
        if (annotateFn) {
          annotateFn(text);
        }
        return;
      }

      // Inline explain: insert explanation card below the paragraph
      if (action === "explain" || action === "why") {
        const id = crypto.randomUUID();
        const paragraphIndex = findParagraphContaining(editorContent, text);
        const marker = `inline-explain:${id}`;
        const newContent = insertAfterParagraph(editorContent, paragraphIndex, `\n\n<!--${marker}-->\n\n`);
        setEditorContent(newContent);
        addExplanation({ id, selectedText: text, content: "", status: "streaming", type: action === "why" ? "why" : "explain" });
        streamExplanation(id, text, newContent, action === "why" ? "/api/why-explain" : "/api/explain");
        return;
      }

      // Other actions open the AI panel
      setSelectedText(text);
      setAiPanelTab(action === "rewrite" ? "write" : action);
      setAiPanelOpen(true);
    },
    [editorContent, setEditorContent, setSelectedText, setAiPanelTab, setAiPanelOpen, findParagraphContaining, insertAfterParagraph, addExplanation, streamExplanation]
  );

  // Scroll spy using IntersectionObserver
  useEffect(() => {
    if (editorMode !== "view" || tocItems.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const headingEls = tocItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (headingEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
            break;
          }
        }
      },
      {
        root: container,
        rootMargin: "-64px 0px -80% 0px",
        threshold: 0,
      }
    );

    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tocItems, editorMode, editorContent]);

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <BookOpen className="w-16 h-16 text-muted-foreground/20" />
            <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground/60">Select a file to begin</p>
            <p className="text-xs text-muted-foreground">Browse the sidebar or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Ctrl+K</kbd> to search</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
        <div className="h-4 w-4/6 bg-muted rounded animate-pulse" />
        <div className="h-32 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => {
              if (activeFile) {
                setLoading(true);
                setError(null);
                readFileContent(activeFile)
                  .then((content) => {
                    setEditorContent(content);
                    setOriginalContent(content);
                    setLoading(false);
                  })
                  .catch(() => {
                    setError("Failed to load file");
                    setLoading(false);
                  });
              }
            }}
            className="text-xs text-primary underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <SelectionToolbar onAction={handleSelectionAction} />
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">
            {activeFile.split("/").pop()?.replace(".md", "")}
          </span>
          {dirty && (
            <span className="flex items-center gap-1 text-xs text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {editorMode === "edit" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="h-7 text-xs"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Save className="h-3 w-3 mr-1" />
              )}
              Save
            </Button>
          )}
          <div className="flex items-center bg-muted/50 rounded-md p-0.5">
            <Button
              variant={editorMode === "view" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEditorMode("view")}
              className="h-6 text-xs px-2"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              variant={editorMode === "edit" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setEditorMode("edit")}
              className="h-6 text-xs px-2"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          {editorMode === "edit" && (
            <div className="flex items-center bg-muted/50 rounded-md p-0.5 ml-1">
              <Button
                variant={editorSubMode === "wysiwyg" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setEditorSubMode("wysiwyg")}
                className="h-6 text-xs px-2"
              >
                <Type className="h-3 w-3 mr-1" />
                WYSIWYG
              </Button>
              <Button
                variant={editorSubMode === "source" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setEditorSubMode("source")}
                className="h-6 text-xs px-2"
              >
                <Code2 className="h-3 w-3 mr-1" />
                Source
              </Button>
            </div>
          )}
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAiPanelTab("summarize");
              setAiPanelOpen(true);
            }}
            className="h-7 text-xs text-ai-glow hover:text-ai-glow hover:bg-ai-glow/10"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Button>
          {editorMode === "view" && <ReadingSettingsSheet />}
          {editorMode === "view" && tocItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTocOpen(!tocOpen)}
              className="h-7 text-xs"
            >
              {tocOpen ? (
                <PanelLeftClose className="h-3 w-3 mr-1" />
              ) : (
                <PanelLeftOpen className="h-3 w-3 mr-1" />
              )}
              TOC
            </Button>
          )}
          {editorMode === "view" && (
            <Button
              variant={conceptMapOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setConceptMapOpen(!conceptMapOpen)}
              className="h-7 text-xs"
            >
              <GitBranch className="h-3 w-3 mr-1" />
              Map
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {editorMode === "view" ? (
          <>
            <div
              ref={scrollContainerRef}
              className={`flex-1 overflow-y-auto ${readingPreferences.lineFocus ? "reading-focus" : ""}`}
              style={{
                "--reading-font-size": `${readingPreferences.fontSize}px`,
                "--reading-line-height": readingPreferences.lineHeight,
                "--reading-font-family": getFontFamilyCSS(readingPreferences.fontFamily),
                "--reading-max-width": getMaxWidthPx(readingPreferences.maxWidth),
              } as React.CSSProperties}
            >
              <div
                className="p-6 mx-auto"
                style={{ maxWidth: getMaxWidthPx(readingPreferences.maxWidth) }}
              >
                <MarkdownViewer
                  content={editorContent}
                  explanations={explanations}
                  onSaveExplanation={handleSaveExplanation}
                  onDismissExplanation={handleDismissExplanation}
                />
              </div>
            </div>
            {tocOpen && tocItems.length > 0 && (
              <aside className="w-[200px] shrink-0 border-l border-border overflow-hidden hidden lg:block">
                <TOCPanel items={tocItems} activeId={activeHeadingId} scrollContainerRef={scrollContainerRef} />
              </aside>
            )}
            {conceptMapOpen && (
              <aside className="w-[320px] shrink-0 border-l border-border overflow-hidden hidden lg:block">
                <div className="h-full">
                  <ConceptMap content={editorContent} />
                </div>
              </aside>
            )}
          </>
        ) : (
          <div className="h-full flex-1 overflow-hidden">
            {editorSubMode === "wysiwyg" ? (
              <LexicalEditor
                value={editorContent}
                onChange={handleEditorChange}
              />
            ) : (
              <MarkdownSource
                value={editorContent}
                onChange={handleEditorChange}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
