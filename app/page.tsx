"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AppHeader } from "@/components/app-header";
import { FileTree } from "@/components/file-tree";
import { ContentViewer } from "@/components/content-viewer";
import { AiPanel } from "@/components/ai-panel";
import { ErrorBoundary } from "@/components/error-boundary";
import { usePKMStore } from "@/lib/store";

const KnowledgeGraph = dynamic(
  () => import("@/components/knowledge-graph").then((mod) => mod.KnowledgeGraph),
  { ssr: false, loading: () => <div className="h-full bg-muted animate-pulse" /> }
);

export default function HomePage() {
  const { sidebarOpen, setSidebarOpen, aiPanelOpen, setAiPanelOpen, graphOpen } = usePKMStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // Ctrl+B: toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        usePKMStore.getState().toggleSidebar();
      }
      // Ctrl+\: toggle AI panel
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        usePKMStore.getState().toggleAiPanel();
      }
      // Ctrl+G: toggle graph view
      if ((e.metaKey || e.ctrlKey) && e.key === "g") {
        e.preventDefault();
        usePKMStore.getState().setGraphOpen(!usePKMStore.getState().graphOpen);
      }
      // Escape: close panels
      if (e.key === "Escape") {
        setAiPanelOpen(false);
        setHelpOpen(false);
        usePKMStore.getState().setGraphOpen(false);
      }
      // ?: show keyboard shortcuts (only when not typing)
      if (e.key === "?" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setAiPanelOpen]);

  return (
    <div className="flex flex-col h-full">
      <AppHeader
        helpOpen={helpOpen}
        onHelpOpenChange={setHelpOpen}
        onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className={`hidden lg:block border-r border-border bg-background shrink-0 transition-all duration-200 overflow-hidden ${
            sidebarOpen ? "w-[280px]" : "w-0"
          }`}
        >
          <div className="w-[280px] h-full">
            <ErrorBoundary>
              <FileTree />
            </ErrorBoundary>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <aside
              className="absolute left-0 top-0 bottom-0 w-[280px] bg-background border-r border-border slide-in-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full pt-12">
                <ErrorBoundary>
                  <FileTree onFileSelect={() => setMobileSidebarOpen(false)} />
                </ErrorBoundary>
              </div>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <ErrorBoundary>
            {graphOpen ? <KnowledgeGraph /> : <ContentViewer />}
          </ErrorBoundary>
        </main>

        {/* AI Panel — hidden on mobile */}
        <aside
          className={`hidden lg:block border-l border-border bg-background shrink-0 transition-all duration-200 overflow-hidden ${
            aiPanelOpen ? "w-[320px]" : "w-0"
          }`}
        >
          <div className="w-[320px] h-full">
            <ErrorBoundary>
              <AiPanel />
            </ErrorBoundary>
          </div>
        </aside>
      </div>
    </div>
  );
}
