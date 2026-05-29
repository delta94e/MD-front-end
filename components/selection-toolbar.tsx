"use client";

import { useState, useEffect, useCallback } from "react";
import { Languages, BookOpen, Sparkles, PenLine, X } from "lucide-react";

interface SelectionToolbarProps {
  onAction: (action: string, selectedText: string) => void;
}

export function SelectionToolbar({ onAction }: SelectionToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 3 || !selection || selection.rangeCount === 0) {
      setVisible(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setPosition({
      top: rect.top + window.scrollY - 48,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setSelectedText(text);
    setVisible(true);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, [handleSelection]);

  // Hide on scroll or click outside toolbar
  useEffect(() => {
    const hide = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-selection-toolbar]")) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", hide);
    return () => document.removeEventListener("mousedown", hide);
  }, []);

  if (!visible) return null;

  const actions = [
    { id: "explain", icon: BookOpen, label: "Explain" },
    { id: "translate", icon: Languages, label: "Translate" },
    { id: "summarize", icon: Sparkles, label: "Summarize" },
    { id: "rewrite", icon: PenLine, label: "Rewrite" },
  ];

  return (
    <div
      data-selection-toolbar
      className="fixed z-50 flex items-center gap-0.5 bg-popover border border-border rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
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
