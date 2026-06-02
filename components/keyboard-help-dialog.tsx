"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { group: "Navigation", items: [
    { keys: ["Ctrl", "B"], description: "Toggle sidebar" },
    { keys: ["Ctrl", "\\"], description: "Toggle AI panel" },
    { keys: ["Ctrl", "G"], description: "Toggle knowledge graph" },
    { keys: ["Ctrl", "K"], description: "Focus search" },
    { keys: ["?"], description: "Show keyboard shortcuts" },
    { keys: ["Escape"], description: "Close panels" },
  ]},
  { group: "Editor", items: [
    { keys: ["Ctrl", "S"], description: "Save file" },
    { keys: ["Ctrl", "E"], description: "Toggle edit mode" },
  ]},
  { group: "AI", items: [
    { keys: ["Ctrl", "Shift", "A"], description: "Open AI panel" },
    { keys: [], description: "Path tab: Generate learning paths by topic" },
  ]},
];

interface KeyboardHelpDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardHelpDialog({ open, onOpenChange }: KeyboardHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" />}
      >
        <Keyboard className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {shortcuts.map((section) => (
            <div key={section.group}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {section.group}
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between">
                    <span className="text-sm">{item.description}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-mono bg-muted border border-border rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
