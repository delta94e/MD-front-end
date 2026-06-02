"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { TRANSFORMERS } from "@lexical/markdown";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { $setBlocksType } from "@lexical/selection";
import {
  $getSelection,
  $isRangeSelection,
  type EditorState,
} from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { editorTheme } from "./editor-theme";
import { EditorToolbar } from "./editor-toolbar";

interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/** Load markdown content into the editor on mount and when value changes externally */
function LoadContentPlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const lastValueRef = useRef(value);
  const isUserEditingRef = useRef(false);

  // Track when user is actively editing
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      isUserEditingRef.current = true;
      // Reset after a short delay
      const timer = setTimeout(() => {
        isUserEditingRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    });
  }, [editor]);

  // Load content when value changes externally (not from user typing)
  useEffect(() => {
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;

    // Don't overwrite user edits with stale external updates
    if (isUserEditingRef.current) return;

    editor.update(() => {
      $convertFromMarkdownString(value, TRANSFORMERS);
    });
  }, [editor, value]);

  // Initial load
  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(value, TRANSFORMERS);
    });
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function LexicalEditor({ value, onChange }: LexicalEditorProps) {
  const lastMarkdownRef = useRef(value);

  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        if (markdown !== lastMarkdownRef.current) {
          lastMarkdownRef.current = markdown;
          onChange(markdown);
        }
      });
    },
    [onChange]
  );

  const initialConfig = {
    namespace: "md-knowledge-hub",
    theme: editorTheme,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      AutoLinkNode,
      TableNode,
      TableRowNode,
      TableCellNode,
    ],
    onError: (error: Error) => {
      console.error("[LexicalEditor]", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex flex-col h-full">
        <EditorToolbar />
        <div className="flex-1 overflow-y-auto relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="outline-none min-h-full p-6 max-w-4xl mx-auto" />
            }
            ErrorBoundary={({ children }) => <>{children}</>}
          />
          <LoadContentPlugin value={value} />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <ListPlugin />
          <LinkPlugin />
        </div>
      </div>
    </LexicalComposer>
  );
}
