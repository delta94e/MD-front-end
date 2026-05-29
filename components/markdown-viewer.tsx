"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeAnnotate from "@/lib/rehype-annotate";
import { useCallback, useRef, useEffect, type ReactNode } from "react";
import { Copy, Check, Play } from "lucide-react";
import { useState } from "react";
import { isExecutableLanguage } from "@/lib/code-sandbox";
import { CodePlayground } from "@/components/code-playground";
import { slugify } from "@/lib/toc-extractor";
import { usePKMStore } from "@/lib/store";
import { AnnotationPopover } from "@/components/annotation-popover";
import { getAnnotationsAction } from "@/app/actions/annotations";
import { MermaidDiagram } from "@/components/mermaid-diagram";

function getTextFromChildren(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getTextFromChildren).join("");
  if (children && typeof children === "object" && "props" in children) {
    return getTextFromChildren((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function CodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement> & { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const language = className?.replace("language-", "") ?? "";
  const canExecute = isExecutableLanguage(language);

  // Render mermaid diagrams instead of code blocks
  if (language === "mermaid") {
    const chart = getTextFromChildren(children).trim();
    if (chart) return <MermaidDiagram chart={chart} />;
  }

  const handleCopy = useCallback(() => {
    const code = preRef.current?.querySelector("code")?.textContent ?? "";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="relative group my-4">
      {language && (
        <span className="absolute top-2 left-3 text-[10px] text-muted-foreground uppercase tracking-wider">
          {language}
        </span>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canExecute && (
          <button
            onClick={() => setShowPlayground(!showPlayground)}
            className={`p-1 rounded hover:bg-accent ${showPlayground ? "bg-accent text-primary" : "text-muted-foreground"}`}
            aria-label="Run code"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-accent"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
      <pre
        ref={preRef}
        className="!bg-muted border border-border rounded-lg p-4 overflow-x-auto"
        {...props}
      >
        {children}
      </pre>
      {showPlayground && canExecute && (
        <CodePlayground
          code={preRef.current?.querySelector("code")?.textContent ?? ""}
          language={language}
        />
      )}
    </div>
  );
}

/** Extract plain text from ReactNode children for slug generation */
function getTextContent(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getTextContent).join("");
  if (children && typeof children === "object" && "props" in children) {
    return getTextContent((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function createHeading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function HeadingComponent({ children, ...props }: { children?: ReactNode }) {
    const text = getTextContent(children);
    const id = slugify(text);
    return <Tag id={id} {...props}>{children}</Tag>;
  };
}

/** Check if element is inside a code block */
function isInsideCodeBlock(node: Node): boolean {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      (current.tagName === "PRE" || current.tagName === "CODE")
    ) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

/** Calculate text offset using TreeWalker, skipping code blocks */
function getTextOffset(container: HTMLElement, targetNode: Node, targetOffset: number): number {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) =>
        isInsideCodeBlock(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT,
    }
  );

  let offset = 0;
  while (walker.nextNode()) {
    if (walker.currentNode === targetNode) {
      return offset + targetOffset;
    }
    offset += (walker.currentNode as Text).textContent!.length;
  }
  return offset;
}

interface SelectionState {
  text: string;
  startOffset: number;
  endOffset: number;
  position: { x: number; y: number };
}

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const { activeFile, annotations, setAnnotations } = usePKMStore();
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load annotations when file changes
  useEffect(() => {
    if (!activeFile) {
      setAnnotations([]);
      return;
    }
    getAnnotationsAction(activeFile).then(setAnnotations).catch(console.error);
  }, [activeFile, setAnnotations]);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      return;
    }

    const selectedText = sel.toString().trim();
    const container = containerRef.current;
    if (!container) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Use TreeWalker for accurate offset calculation (matches rehype plugin behavior)
    const startOffset = getTextOffset(container, range.startContainer, range.startOffset);
    const endOffset = startOffset + selectedText.length;

    setSelection({
      text: selectedText,
      startOffset,
      endOffset,
      position: {
        x: rect.left - containerRect.left + container.scrollLeft,
        y: rect.bottom - containerRect.top + container.scrollTop,
      },
    });
  }, []);

  const handleSelectionFromToolbar = useCallback(
    (text: string) => {
      const container = containerRef.current;
      if (!container) return;

      const range = window.getSelection()?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Use TreeWalker for offset calculation
      if (range) {
        const startOffset = getTextOffset(container, range.startContainer, range.startOffset);
        setSelection({
          text,
          startOffset,
          endOffset: startOffset + text.length,
          position: rect
            ? {
                x: rect.left - containerRect.left + container.scrollLeft,
                y: rect.bottom - containerRect.top + container.scrollTop,
              }
            : { x: 0, y: 0 },
        });
      }
    },
    []
  );

  // Expose for selection toolbar
  useEffect(() => {
    (window as any).__annotateSelection = handleSelectionFromToolbar;
    return () => {
      delete (window as any).__annotateSelection;
    };
  }, [handleSelectionFromToolbar]);

  // Handle click on annotation highlight
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("annotation-highlight")) {
        const id = target.dataset.annotationId;
        if (id) {
          target.style.transition = "outline 0.3s";
          target.style.outline = "2px solid currentColor";
          setTimeout(() => {
            target.style.outline = "none";
          }, 1500);
        }
      }
    },
    []
  );

  const annotationParams = annotations.map((a) => ({
    id: a.id,
    startOffset: a.startOffset,
    endOffset: a.endOffset,
    color: a.color,
  }));

  return (
    <div
      ref={containerRef}
      className="relative markdown-content prose prose-sm dark:prose-invert max-w-none"
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypePrism, { ignoreMissing: true }],
          [rehypeAnnotate, annotationParams],
        ]}
        components={{
          pre: ({ children, ...props }) => (
            <CodeBlock {...props}>{children}</CodeBlock>
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            >
              {children}
            </a>
          ),
          h1: createHeading("h1"),
          h2: createHeading("h2"),
          h3: createHeading("h3"),
          h4: createHeading("h4"),
          h5: createHeading("h5"),
          h6: createHeading("h6"),
        }}
      >
        {content}
      </ReactMarkdown>

      {selection && (
        <AnnotationPopover
          selectedText={selection.text}
          startOffset={selection.startOffset}
          endOffset={selection.endOffset}
          position={selection.position}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
