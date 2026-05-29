"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { usePKMStore } from "@/lib/store";
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
} from "lucide-react";
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
  } = usePKMStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [originalContent, setOriginalContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(true);
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

  // Selection toolbar action handler
  const handleSelectionAction = useCallback(
    (action: string, text: string) => {
      if (action === "annotate") {
        // Trigger annotation popover in markdown viewer
        const annotateFn = (window as any).__annotateSelection;
        if (annotateFn) {
          annotateFn(text);
        }
        return;
      }
      setSelectedText(text);
      // Map "rewrite" to "write" tab
      setAiPanelTab(action === "rewrite" ? "write" : action);
      setAiPanelOpen(true);
    },
    [setSelectedText, setAiPanelTab, setAiPanelOpen]
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
        <div className="text-center space-y-2">
          <p className="text-sm">Select a file from the sidebar to view it</p>
          <p className="text-xs">Or use Ctrl+K to search</p>
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {activeFile.split("/").pop()?.replace(".md", "")}
          </span>
          {dirty && (
            <span className="h-2 w-2 rounded-full bg-yellow-500" title="Unsaved changes" />
          )}
        </div>
        <div className="flex items-center gap-1">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setEditorMode(editorMode === "view" ? "edit" : "view")
            }
            className="h-7 text-xs"
          >
            {editorMode === "view" ? (
              <>
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                View
              </>
            )}
          </Button>
          {editorMode === "edit" && (
            <>
              <Button
                variant={editorSubMode === "wysiwyg" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setEditorSubMode("wysiwyg")}
                className="h-7 text-xs"
              >
                <Type className="h-3 w-3 mr-1" />
                WYSIWYG
              </Button>
              <Button
                variant={editorSubMode === "source" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setEditorSubMode("source")}
                className="h-7 text-xs"
              >
                <Code2 className="h-3 w-3 mr-1" />
                Source
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAiPanelTab("summarize");
              setAiPanelOpen(true);
            }}
            className="h-7 text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Button>
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {editorMode === "view" ? (
          <>
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-6 max-w-full lg:max-w-4xl mx-auto">
                <MarkdownViewer content={editorContent} />
              </div>
            </div>
            {tocOpen && tocItems.length > 0 && (
              <aside className="w-[200px] shrink-0 border-l border-border overflow-hidden hidden lg:block">
                <TOCPanel items={tocItems} activeId={activeHeadingId} scrollContainerRef={scrollContainerRef} />
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
