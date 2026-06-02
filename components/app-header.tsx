"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, PanelRightOpen, PanelRightClose, BookOpen, Network, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePKMStore } from "@/lib/store";
import { KeyboardHelpDialog } from "@/components/keyboard-help-dialog";
import { useEffect, useState } from "react";

interface AppHeaderProps {
  helpOpen?: boolean;
  onHelpOpenChange?: (open: boolean) => void;
  onMobileMenuToggle?: () => void;
}

export function AppHeader({ helpOpen, onHelpOpenChange, onMobileMenuToggle }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { aiPanelOpen, toggleAiPanel, activeFile, graphOpen, setGraphOpen } = usePKMStore();

  useEffect(() => setMounted(true), []);

  const fileName = activeFile
    ? activeFile.split("/").pop()?.replace(".md", "") ?? ""
    : "Knowledge Hub";
  const category = activeFile
    ? activeFile.split("/")[0] ?? ""
    : "";

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background/90 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <BookOpen className="h-5 w-5 text-primary" />
            <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
          </div>
          <span className="font-bold text-sm tracking-tight hidden sm:inline">Knowledge Hub</span>
        </div>
        {activeFile && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-muted-foreground/50">/</span>
            <span className="font-mono text-xs opacity-70">{category}</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground/80">{fileName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <KeyboardHelpDialog open={helpOpen} onOpenChange={onHelpOpenChange} />
        <Button
          variant={graphOpen ? "default" : "ghost"}
          size="icon"
          className={`transition-all duration-200 ${graphOpen ? "bg-primary/10 text-primary" : ""}`}
          onClick={() => setGraphOpen(!graphOpen)}
          aria-label={graphOpen ? "Close graph" : "Open knowledge graph"}
        >
          <Network className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="transition-all duration-200"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant={aiPanelOpen ? "secondary" : "ghost"}
          size="icon"
          className={`transition-all duration-200 ${aiPanelOpen ? "bg-ai-glow/10 text-ai-glow" : ""}`}
          onClick={toggleAiPanel}
          aria-label={aiPanelOpen ? "Close AI panel" : "Open AI panel"}
        >
          {aiPanelOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
