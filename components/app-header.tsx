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
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm shrink-0">
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
        <BookOpen className="h-5 w-5 text-primary hidden sm:block" />
        <span className="font-semibold text-sm">Knowledge Hub</span>
        {activeFile && (
          <span className="text-xs text-muted-foreground">
            {category} &rsaquo; {fileName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <KeyboardHelpDialog open={helpOpen} onOpenChange={onHelpOpenChange} />
        <Button
          variant={graphOpen ? "default" : "ghost"}
          size="icon"
          onClick={() => setGraphOpen(!graphOpen)}
          aria-label={graphOpen ? "Close graph" : "Open knowledge graph"}
        >
          <Network className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
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
          variant="ghost"
          size="icon"
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
