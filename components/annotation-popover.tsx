"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Highlighter, X } from "lucide-react";
import { usePKMStore } from "@/lib/store";
import { addAnnotationAction } from "@/app/actions/annotations";

const PRESET_COLORS = [
  { value: "#fef08a", label: "Yellow" },
  { value: "#bbf7d0", label: "Green" },
  { value: "#bfdbfe", label: "Blue" },
  { value: "#fbcfe8", label: "Pink" },
  { value: "#fed7aa", label: "Orange" },
];

interface AnnotationPopoverProps {
  selectedText: string;
  startOffset: number;
  endOffset: number;
  position: { x: number; y: number };
  onClose: () => void;
}

export function AnnotationPopover({
  selectedText,
  startOffset,
  endOffset,
  position,
  onClose,
}: AnnotationPopoverProps) {
  const [note, setNote] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [saving, setSaving] = useState(false);
  const { activeFile, addAnnotation: addToStore } = usePKMStore();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSave = async () => {
    if (!activeFile) return;
    setSaving(true);

    try {
      const annotation = {
        id: crypto.randomUUID(),
        filePath: activeFile,
        startOffset,
        endOffset,
        selectedText,
        note,
        color,
      };

      const saved = await addAnnotationAction(annotation);
      addToStore(saved);
      onClose();
    } catch (err) {
      console.error("Failed to save annotation:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-3 w-72"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 8}px`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Highlighter className="h-3 w-3" />
          Annotate
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-accent">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="p-1.5 bg-muted/50 rounded text-xs mb-2 line-clamp-2 border border-border">
        &ldquo;{selectedText}&rdquo;
      </div>

      <div className="flex gap-1 mb-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setColor(c.value)}
            className={`w-5 h-5 rounded-full border-2 transition-all ${
              color === c.value ? "border-foreground scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
      </div>

      <Textarea
        placeholder="Add a note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[60px] text-xs resize-none mb-2"
        autoFocus
      />

      <div className="flex justify-end gap-1">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
