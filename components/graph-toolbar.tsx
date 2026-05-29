"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ZoomIn, Filter, X, Route, RotateCcw } from "lucide-react";
import { getCategoryColor } from "@/lib/graph-extractor";

interface GraphToolbarProps {
  categories: string[];
  activeCategories: string[];
  onCategoryToggle: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onZoomReset: () => void;
  pathMode?: boolean;
  onPathModeToggle?: () => void;
  pathStart?: string | null;
  pathEnd?: string | null;
  pathResult?: string[] | null;
  onResetPath?: () => void;
}

export function GraphToolbar({
  categories,
  activeCategories,
  onCategoryToggle,
  searchQuery,
  onSearchChange,
  onZoomReset,
  pathMode,
  onPathModeToggle,
  pathStart,
  pathEnd,
  pathResult,
  onResetPath,
}: GraphToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const isAllActive = activeCategories.length === 0;

  const handleToggleCategory = (cat: string) => {
    if (activeCategories.includes(cat)) {
      onCategoryToggle(activeCategories.filter((c) => c !== cat));
    } else {
      onCategoryToggle([...activeCategories, cat]);
    }
  };

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files..."
          className="h-7 pl-7 pr-7 text-xs bg-background/90 backdrop-blur w-48"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Controls row */}
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-background/90 backdrop-blur"
          onClick={() => setFilterOpen(!filterOpen)}
          aria-label="Filter categories"
        >
          <Filter className="h-3 w-3 mr-1" />
          Filter
          {activeCategories.length > 0 && (
            <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {activeCategories.length}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-background/90 backdrop-blur"
          onClick={onZoomReset}
          aria-label="Fit graph to screen"
        >
          <ZoomIn className="h-3 w-3 mr-1" />
          Fit
        </Button>
        <Button
          variant={pathMode ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs bg-background/90 backdrop-blur"
          onClick={onPathModeToggle}
          aria-label="Toggle path finder mode"
        >
          <Route className="h-3 w-3 mr-1" />
          Path
        </Button>
      </div>

      {/* Path mode instructions */}
      {pathMode && (
        <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-2 shadow-lg w-48 text-xs space-y-1.5">
          <p className="text-muted-foreground text-[10px]">
            {!pathStart ? "Click first node (start)" : !pathEnd ? "Click second node (end)" : "Path found!"}
          </p>
          {pathStart && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] truncate">{pathStart.split("/").pop()}</span>
            </div>
          )}
          {pathEnd && (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] truncate">{pathEnd.split("/").pop()}</span>
            </div>
          )}
          {pathResult && (
            <p className="text-[10px] text-green-500 font-medium">
              {pathResult.length} nodes connected
            </p>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-[10px] w-full" onClick={onResetPath}>
            <RotateCcw className="h-2.5 w-2.5 mr-1" />
            Reset
          </Button>
        </div>
      )}

      {/* Category filter dropdown */}
      {filterOpen && (
        <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-2 shadow-lg max-h-60 overflow-y-auto w-48">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-muted-foreground">Categories</span>
            <button onClick={() => onCategoryToggle([])} className="text-[10px] text-primary hover:underline">
              Show all
            </button>
          </div>
          {categories.map((cat) => {
            const active = isAllActive || activeCategories.includes(cat);
            return (
              <label key={cat} className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:bg-accent rounded px-1">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handleToggleCategory(cat)}
                  className="h-3 w-3 rounded"
                />
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(cat) }} />
                <span className="text-xs truncate">{cat}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
