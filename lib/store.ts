import { create } from "zustand";
import type { Annotation } from "@/lib/annotations-db";

export interface ReadingPreferences {
  fontSize: number;       // 14-24, default 16
  lineHeight: number;     // 1.4-2.2, default 1.75
  fontFamily: string;     // 'be-vietnam-pro' | 'geist-sans' | 'lexend' | 'source-sans-3' | 'literata' | 'georgia'
  maxWidth: string;       // 'narrow' | 'default' | 'wide' | 'full'
  lineFocus: boolean;     // default false
}

export const defaultReadingPreferences: ReadingPreferences = {
  fontSize: 16,
  lineHeight: 1.75,
  fontFamily: "be-vietnam-pro",
  maxWidth: "default",
  lineFocus: false,
};

export interface ExplanationEntry {
  id: string;
  selectedText: string;
  content: string;
  status: "streaming" | "done" | "error";
  type?: "explain" | "why"; // default: "explain"
}

interface PKMStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  aiPanelOpen: boolean;
  toggleAiPanel: () => void;
  setAiPanelOpen: (open: boolean) => void;
  aiPanelTab: string;
  setAiPanelTab: (tab: string) => void;

  activeFile: string | null;
  activeCategory: string | null;
  setActiveFile: (path: string, category: string) => void;

  editorMode: "view" | "edit";
  setEditorMode: (mode: "view" | "edit") => void;
  editorSubMode: "wysiwyg" | "source";
  setEditorSubMode: (mode: "wysiwyg" | "source") => void;
  editorContent: string;
  setEditorContent: (content: string) => void;

  selectedText: string;
  setSelectedText: (text: string) => void;

  graphOpen: boolean;
  setGraphOpen: (open: boolean) => void;
  graphCategoryFilter: string[];
  setGraphCategoryFilter: (categories: string[]) => void;
  graphSearchQuery: string;
  setGraphSearchQuery: (query: string) => void;

  annotations: Annotation[];
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotationInStore: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotationFromStore: (id: string) => void;

  readingPreferences: ReadingPreferences;
  setReadingPreferences: (prefs: Partial<ReadingPreferences>) => void;
  loadReadingPreferences: () => void;

  explanations: ExplanationEntry[];
  addExplanation: (entry: ExplanationEntry) => void;
  updateExplanation: (id: string, updates: Partial<ExplanationEntry>) => void;
  removeExplanation: (id: string) => void;

  flashcardSubView: "generate" | "review" | "stats";
  setFlashcardSubView: (view: "generate" | "review" | "stats") => void;
  dueCardCount: number;
  setDueCardCount: (count: number) => void;
}

export const usePKMStore = create<PKMStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  aiPanelOpen: false,
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
  aiPanelTab: "summarize",
  setAiPanelTab: (tab) => set({ aiPanelTab: tab }),

  activeFile: null,
  activeCategory: null,
  setActiveFile: (path, category) =>
    set({ activeFile: path, activeCategory: category }),

  editorMode: "view",
  setEditorMode: (mode) => set({ editorMode: mode }),
  editorSubMode: "wysiwyg",
  setEditorSubMode: (mode) => set({ editorSubMode: mode }),
  editorContent: "",
  setEditorContent: (content) => set({ editorContent: content }),

  selectedText: "",
  setSelectedText: (text) => set({ selectedText: text }),

  graphOpen: false,
  setGraphOpen: (open) => set({ graphOpen: open }),
  graphCategoryFilter: [],
  setGraphCategoryFilter: (categories) => set({ graphCategoryFilter: categories }),
  graphSearchQuery: "",
  setGraphSearchQuery: (query) => set({ graphSearchQuery: query }),

  annotations: [],
  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) =>
    set((s) => ({ annotations: [...s.annotations, annotation] })),
  updateAnnotationInStore: (id, updates) =>
    set((s) => ({
      annotations: s.annotations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
  deleteAnnotationFromStore: (id) =>
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
    })),

  readingPreferences: defaultReadingPreferences,
  setReadingPreferences: (prefs) =>
    set((s) => {
      const updated = { ...s.readingPreferences, ...prefs };
      try {
        localStorage.setItem("reading-preferences", JSON.stringify(updated));
      } catch {}
      return { readingPreferences: updated };
    }),
  loadReadingPreferences: () => {
    try {
      const saved = localStorage.getItem("reading-preferences");
      if (saved) {
        set({ readingPreferences: { ...defaultReadingPreferences, ...JSON.parse(saved) } });
      }
    } catch {}
  },

  explanations: [],
  addExplanation: (entry) =>
    set((s) => ({ explanations: [...s.explanations, entry] })),
  updateExplanation: (id, updates) =>
    set((s) => ({
      explanations: s.explanations.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  removeExplanation: (id) =>
    set((s) => ({
      explanations: s.explanations.filter((e) => e.id !== id),
    })),

  flashcardSubView: "generate",
  setFlashcardSubView: (view) => set({ flashcardSubView: view }),
  dueCardCount: 0,
  setDueCardCount: (count) => set({ dueCardCount: count }),
}));
