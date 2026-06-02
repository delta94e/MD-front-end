"use client";

import { useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { usePKMStore } from "@/lib/store";
import { getDueCards } from "@/lib/flashcard-db";

export function DueBadge() {
  const { dueCardCount, setDueCardCount } = usePKMStore();

  const refresh = useCallback(async () => {
    try {
      const due = await getDueCards(100);
      setDueCardCount(due.length);
    } catch {
      // IndexedDB not available (SSR)
    }
  }, [setDueCardCount]);

  useEffect(() => {
    refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  if (dueCardCount === 0) return null;

  return (
    <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 text-[9px]">
      {dueCardCount}
    </Badge>
  );
}
