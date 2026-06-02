"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Highlighter,
  Trash2,
  Edit3,
  Check,
  X,
  MessageSquare,
} from "lucide-react";
import { usePKMStore } from "@/lib/store";
import {
  updateAnnotationAction,
  deleteAnnotationAction,
} from "@/app/actions/annotations";
import type { Annotation } from "@/lib/annotations-db";

function AnnotationItem({ annotation }: { annotation: Annotation }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(annotation.note);
  const { updateAnnotationInStore, deleteAnnotationFromStore } = usePKMStore();

  const handleSave = async () => {
    try {
      await updateAnnotationAction(annotation.id, { note });
      updateAnnotationInStore(annotation.id, { note, updatedAt: Date.now() });
      setEditing(false);
    } catch (err) {
      console.error("Failed to update annotation:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAnnotationAction(annotation.id);
      deleteAnnotationFromStore(annotation.id);
    } catch (err) {
      console.error("Failed to delete annotation:", err);
    }
  };

  const handleScrollTo = () => {
    const el = document.querySelector(
      `[data-annotation-id="${annotation.id}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "outline 0.3s";
      el.style.outline = "2px solid currentColor";
      setTimeout(() => {
        el.style.outline = "none";
      }, 1500);
    }
  };

  return (
    <div className="border border-border rounded-md p-2 group">
      <div className="flex items-start gap-2">
        <div
          className="w-3 h-3 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: annotation.color }}
        />
        <div className="flex-1 min-w-0">
          <button
            onClick={handleScrollTo}
            className="text-xs text-muted-foreground hover:text-foreground line-clamp-2 text-left w-full"
          >
            &ldquo;{annotation.selectedText}&rdquo;
          </button>

          {editing ? (
            <div className="mt-1.5 space-y-1.5">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[40px] text-xs resize-none"
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={handleSave}
                >
                  <Check className="h-3 w-3 mr-0.5" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => {
                    setNote(annotation.note);
                    setEditing(false);
                  }}
                >
                  <X className="h-3 w-3 mr-0.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : annotation.note ? (
            <p className="text-[11px] text-muted-foreground mt-1">
              {annotation.note}
            </p>
          ) : null}
        </div>

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded hover:bg-accent"
            title="Edit note"
          >
            <Edit3 className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-destructive/10"
            title="Delete annotation"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AnnotationPanel() {
  const { annotations, activeFile } = usePKMStore();

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Highlighter className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-xs text-center">
          Open a file to see annotations
        </p>
      </div>
    );
  }

  if (annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-xs text-center">
          Select text in the viewer and click Annotate to add highlights and notes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {annotations.length} annotation{annotations.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {annotations.map((annotation) => (
          <AnnotationItem key={annotation.id} annotation={annotation} />
        ))}
      </div>
    </div>
  );
}
