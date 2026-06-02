"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePKMStore } from "@/lib/store";
import { getTreeData } from "@/app/actions/files";
import type { TreeNode } from "@/lib/fs";

function countFiles(nodes: TreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "file") count++;
    if (node.children) count += countFiles(node.children);
  }
  return count;
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;
  const lower = query.toLowerCase();
  return nodes
    .map((node) => {
      if (node.type === "file") {
        return node.name.toLowerCase().includes(lower) ? node : null;
      }
      const filteredChildren = node.children
        ? filterTree(node.children, query)
        : [];
      if (
        node.name.toLowerCase().includes(lower) ||
        filteredChildren.length > 0
      ) {
        return { ...node, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  activeFile: string | null;
  onSelect: (path: string, category: string) => void;
  expandedDirs: Set<string>;
  toggleDir: (id: string) => void;
}

function TreeItem({
  node,
  depth,
  activeFile,
  onSelect,
  expandedDirs,
  toggleDir,
}: TreeItemProps) {
  const isDir = node.type === "dir";
  const isExpanded = expandedDirs.has(node.id);
  const isActive = activeFile === node.path;
  const fileCount = isDir && node.children ? countFiles(node.children) : 0;

  return (
    <>
      <button
        className={`w-full flex items-center gap-1.5 px-2 py-1 text-sm transition-all duration-150 ${
          isActive
            ? "bg-primary/10 text-primary border-l-2 border-primary"
            : "text-foreground hover:bg-accent/50 border-l-2 border-transparent"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        role="treeitem"
        aria-current={isActive ? "page" : undefined}
        onClick={() => {
          if (isDir) {
            toggleDir(node.id);
          } else {
            const category = node.path.split("/")[0] ?? "";
            onSelect(node.path, category);
          }
        }}
        aria-expanded={isDir ? isExpanded : undefined}
      >
        {isDir ? (
          <>
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate font-medium">{node.name}</span>
            <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1">
              {fileCount}
            </Badge>
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{node.name.replace(".md", "")}</span>
          </>
        )}
      </button>
      {isDir && isExpanded && node.children && (
        <>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              onSelect={onSelect}
              expandedDirs={expandedDirs}
              toggleDir={toggleDir}
            />
          ))}
        </>
      )}
    </>
  );
}

interface FileTreeProps {
  onFileSelect?: () => void;
}

export function FileTree({ onFileSelect }: FileTreeProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeFile, setActiveFile } = usePKMStore();

  useEffect(() => {
    getTreeData()
      .then((data) => {
        setTreeData(data);
        setLoading(false);
        if (data.length === 0) {
          setError("No files found. Check that CONTENT_DIR is set correctly.");
        }
        // Auto-expand first level
        const firstLevel = new Set(
          data.filter((n) => n.type === "dir").map((n) => n.id)
        );
        setExpandedDirs(firstLevel);
      })
      .catch((err) => {
        console.error("[FileTree] Failed to load tree:", err);
        setError("Failed to load file tree");
        setLoading(false);
      });
  }, []);

  const toggleDir = useCallback((id: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (path: string, category: string) => {
      setActiveFile(path, category);
      onFileSelect?.();
    },
    [setActiveFile, onFileSelect]
  );

  const filteredTree = useMemo(
    () => filterTree(treeData, searchQuery),
    [treeData, searchQuery]
  );

  // Keyboard navigation for tree
  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const container = e.currentTarget;
      const items = container.querySelectorAll<HTMLElement>('[role="treeitem"]');
      const currentIdx = Array.from(items).findIndex((el) => el === document.activeElement);

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = currentIdx + 1;
          if (next < items.length) items[next].focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = currentIdx - 1;
          if (prev >= 0) items[prev].focus();
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (currentIdx >= 0) items[currentIdx].click();
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (currentIdx >= 0) {
            const el = items[currentIdx];
            if (el.getAttribute("aria-expanded") === "false") {
              el.click(); // expand
            }
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (currentIdx >= 0) {
            const el = items[currentIdx];
            if (el.getAttribute("aria-expanded") === "true") {
              el.click(); // collapse
            }
          }
          break;
        }
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[75, 60, 90, 85, 70, 95, 65, 80].map((w, i) => (
          <div
            key={i}
            className="h-4 bg-muted rounded animate-pulse"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-destructive">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            getTreeData()
              .then((data) => {
                setTreeData(data);
                setLoading(false);
              })
              .catch(() => {
                setError("Failed to load file tree");
                setLoading(false);
              });
          }}
          className="mt-2 text-xs text-primary underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 pr-7 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1" role="tree" onKeyDown={handleTreeKeyDown}>
        {filteredTree.map((node) => (
          <TreeItem
            key={node.id}
            node={node}
            depth={0}
            activeFile={activeFile}
            onSelect={handleSelect}
            expandedDirs={expandedDirs}
            toggleDir={toggleDir}
          />
        ))}
        {filteredTree.length === 0 && searchQuery && (
          <p className="text-xs text-muted-foreground p-4 text-center">
            No files matching &quot;{searchQuery}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
