"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";
import { useCallback, useMemo } from "react";

interface MarkdownSourceProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownSource({ value, onChange }: MarkdownSourceProps) {
  const { theme } = useTheme();
  const extensions = useMemo(() => [markdown()], []);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      extensions={extensions}
      theme={theme === "dark" ? oneDark : undefined}
      className="h-full overflow-auto text-sm"
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
      }}
    />
  );
}
