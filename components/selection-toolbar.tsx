"use client";

import { useState, useEffect, useCallback } from "react";
import { Languages, BookOpen, Sparkles, PenLine, Highlighter, Lightbulb } from "lucide-react";

/** Check if selection is inside a code block (pre or code element) */
function isInsideCodeBlock(): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const node = selection.getRangeAt(0).startContainer;
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

interface SelectionToolbarProps {
  onAction: (action: string, selectedText: string) => void;
}

export function SelectionToolbar({ onAction }: SelectionToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [inCodeBlock, setInCodeBlock] = useState(false);

  const handleSelection = useCallback((e: MouseEvent) => {
    // Don't re-evaluate selection when clicking inside the toolbar
    const target = e.target as HTMLElement;
    if (target.closest("[data-selection-toolbar]")) return;

    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 3 || !selection || selection.rangeCount === 0) {
      setVisible(false);
      return;
    }

    // Use mouseup coordinates — exactly where user ended the drag
    const gap = 8;
    const toolbarHeight = 40;
    let top = e.clientY + gap;
    let left = e.clientX;

    // Clamp to viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const toolbarWidth = 320;

    left = Math.max(toolbarWidth / 2 + 8, Math.min(left, viewportWidth - toolbarWidth / 2 - 8));

    // If toolbar would go below viewport, place it above cursor
    if (top + toolbarHeight > viewportHeight) {
      top = e.clientY - toolbarHeight - gap;
    }

    setPosition({ top, left });
    setSelectedText(text);
    setInCodeBlock(isInsideCodeBlock());
    setVisible(true);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, [handleSelection]);

  // Hide when selection is cleared (click without selecting)
  useEffect(() => {
    const hide = (e: MouseEvent) => {
      // Don't hide if clicking inside the toolbar itself
      const target = e.target as HTMLElement;
      if (target.closest("[data-selection-toolbar]")) return;

      // Delay to let selection update after click
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
          setVisible(false);
        }
      });
    };
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  if (!visible) return null;

  const allActions = [
    { id: "annotate", icon: Highlighter, label: "Annotate" },
    { id: "explain", icon: BookOpen, label: "Explain" },
    { id: "why", icon: Lightbulb, label: "Why" },
    { id: "translate", icon: Languages, label: "Translate" },
    { id: "summarize", icon: Sparkles, label: "Summarize" },
    { id: "rewrite", icon: PenLine, label: "Rewrite" },
  ];
  // Inside code blocks: only show Annotate
  const actions = inCodeBlock
    ? allActions.filter((a) => a.id === "annotate")
    : allActions;

  return (
    <div
      data-selection-toolbar
      className="fixed z-50 flex items-center gap-0.5 bg-popover border border-border rounded-lg shadow-lg p-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      {actions.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => {
            console.log("[SelectionToolbar] onClick", id, selectedText.slice(0, 50));
            onAction(id, selectedText);
            setVisible(false);
          }}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
          title={label}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
