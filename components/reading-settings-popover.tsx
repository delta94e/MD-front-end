"use client";

import { usePKMStore, defaultReadingPreferences, type ReadingPreferences } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Type, RotateCcw } from "lucide-react";

const FONT_FAMILIES = [
  { value: "be-vietnam-pro", label: "Be Vietnam Pro" },
  { value: "geist-sans", label: "Geist Sans" },
  { value: "lexend", label: "Lexend" },
  { value: "source-sans-3", label: "Source Sans 3" },
  { value: "literata", label: "Literata" },
  { value: "georgia", label: "Georgia" },
] as const;

const MAX_WIDTHS = [
  { value: "narrow", label: "Narrow", px: "540px" },
  { value: "default", label: "Default", px: "672px" },
  { value: "wide", label: "Wide", px: "800px" },
  { value: "full", label: "Full", px: "100%" },
] as const;

const FONT_FAMILY_CSS: Record<string, string> = {
  "be-vietnam-pro": "'Be Vietnam Pro', sans-serif",
  "geist-sans": "var(--font-geist-sans), system-ui, sans-serif",
  lexend: "'Lexend', sans-serif",
  "source-sans-3": "'Source Sans 3', sans-serif",
  literata: "'Literata', Georgia, serif",
  georgia: "Georgia, 'Times New Roman', serif",
};

export function getMaxWidthPx(maxWidth: string): string {
  return MAX_WIDTHS.find((w) => w.value === maxWidth)?.px ?? "672px";
}

export function getFontFamilyCSS(fontFamily: string): string {
  return FONT_FAMILY_CSS[fontFamily] ?? FONT_FAMILY_CSS["geist-sans"];
}

export function ReadingSettingsSheet() {
  const { readingPreferences, setReadingPreferences } = usePKMStore();
  const prefs = readingPreferences;

  const isDefault =
    prefs.fontSize === defaultReadingPreferences.fontSize &&
    prefs.lineHeight === defaultReadingPreferences.lineHeight &&
    prefs.fontFamily === defaultReadingPreferences.fontFamily &&
    prefs.maxWidth === defaultReadingPreferences.maxWidth &&
    prefs.lineFocus === defaultReadingPreferences.lineFocus;

  return (
    <Sheet>
      <SheetTrigger className="inline-flex items-center justify-center h-7 px-2 text-xs rounded-md hover:bg-accent hover:text-accent-foreground transition-colors relative">
        <Type className="h-3 w-3 mr-1" />
        Aa
        {!isDefault && (
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent-primary" />
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px]">
        <SheetHeader>
          <SheetTitle className="text-sm">Reading Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Font Size</label>
              <span className="text-xs font-mono">{prefs.fontSize}px</span>
            </div>
            <input
              type="range"
              min={14}
              max={24}
              step={1}
              value={prefs.fontSize}
              aria-label="Font size"
              onChange={(e) =>
                setReadingPreferences({ fontSize: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-accent-primary"
            />
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">Line Height</label>
              <span className="text-xs font-mono">{prefs.lineHeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={1.4}
              max={2.2}
              step={0.05}
              value={prefs.lineHeight}
              aria-label="Line height"
              onChange={(e) =>
                setReadingPreferences({ lineHeight: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-accent-primary"
            />
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Font Family</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  onClick={() =>
                    setReadingPreferences({ fontFamily: font.value })
                  }
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    prefs.fontFamily === font.value
                      ? "border-accent-primary bg-accent-subtle text-accent-primary"
                      : "border-border hover:bg-accent hover:text-accent-foreground"
                  }`}
                  style={{ fontFamily: FONT_FAMILY_CSS[font.value] }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reading Width */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Reading Width</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MAX_WIDTHS.map((width) => (
                <button
                  key={width.value}
                  onClick={() =>
                    setReadingPreferences({ maxWidth: width.value })
                  }
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    prefs.maxWidth === width.value
                      ? "border-accent-primary bg-accent-subtle text-accent-primary"
                      : "border-border hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {width.label}
                  <span className="block text-[10px] text-muted-foreground">
                    {width.px}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Line Focus */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs">Line Focus</label>
              <p className="text-[10px] text-muted-foreground">
                Dim paragraphs on hover
              </p>
            </div>
            <button
              role="switch"
              aria-checked={prefs.lineFocus}
              aria-label="Line focus dimming"
              onClick={() =>
                setReadingPreferences({ lineFocus: !prefs.lineFocus })
              }
              className={`relative h-5 w-9 rounded-full transition-colors ${
                prefs.lineFocus ? "bg-accent-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  prefs.lineFocus ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <Separator />

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReadingPreferences(defaultReadingPreferences)}
            disabled={isDefault}
            className="w-full text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset to Defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
