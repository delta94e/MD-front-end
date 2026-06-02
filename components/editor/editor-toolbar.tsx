"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import { $createQuoteNode, $createHeadingNode, HeadingNode } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  KEY_MODIFIER_COMMAND,
  ParagraphNode,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type LexicalNode,
} from "lexical";
import { $findMatchingParent } from "@lexical/utils";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  CodeSquare,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";
import { ToolbarButton } from "./toolbar-button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function getBlockType(node: LexicalNode): string {
  const target = $isRootOrShadowRoot(node)
    ? node.getFirstChild()
    : $findMatchingParent(node, (parent) => {
        const type = parent.getType();
        return (
          type === "root" ||
          type === "paragraph" ||
          type === "heading" ||
          type === "quote" ||
          type === "list" ||
          type === "code"
        );
      });
  if (!target) return "paragraph";
  const type = target.getType();
  if (type === "heading") return (target as HeadingNode).getTag() ?? "h1";
  if (type === "quote") return "quote";
  if (type === "code") return "code";
  if (type === "list") return $isListNode(target) ? target.getListType() : "bullet";
  return "paragraph";
}

export function EditorToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [isLink, setIsLink] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsStrikethrough(selection.hasFormat("strikethrough"));
    setIsCode(selection.hasFormat("code"));

    const anchor = selection.anchor.getNode();
    setBlockType(getBlockType(anchor));

    const parent = anchor.getParent();
    setIsLink($isLinkNode(parent) || $isLinkNode(anchor));
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "k") {
          event.preventDefault();
          if (isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
          } else {
            setLinkUrl("");
            setLinkDialogOpen(true);
          }
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, isLink]);

  const handleHeading = useCallback(
    (tag: "h1" | "h2" | "h3") => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (blockType === tag) {
            $setBlocksType(selection, () =>
              new ParagraphNode()
            );
          } else {
            $setBlocksType(selection, () => $createHeadingNode(tag));
          }
        }
      });
    },
    [editor, blockType]
  );

  const handleQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (blockType === "quote") {
          $setBlocksType(selection, () =>
            new ParagraphNode()
          );
        } else {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      }
    });
  }, [editor, blockType]);

  const handleCodeBlock = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (blockType === "code") {
          $setBlocksType(selection, () =>
            new ParagraphNode()
          );
        } else {
          $setBlocksType(selection, () => $createCodeNode());
        }
      }
    });
  }, [editor, blockType]);

  const handleInsertLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      setLinkUrl("");
      setLinkDialogOpen(true);
    }
  }, [editor, isLink]);

  const handleLinkSubmit = useCallback(() => {
    if (linkUrl.trim()) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim());
    }
    setLinkDialogOpen(false);
  }, [editor, linkUrl]);

  return (
    <>
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-secondary shrink-0">
        {/* Text format group */}
        <ToolbarButton
          icon={Bold}
          label="Bold (Ctrl+B)"
          active={isBold}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic (Ctrl+I)"
          active={isItalic}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strikethrough"
          active={isStrikethrough}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
          }
        />
        <ToolbarButton
          icon={Code2}
          label="Inline Code"
          active={isCode}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Block format group */}
        <ToolbarButton
          icon={Heading1}
          label="Heading 1"
          active={blockType === "h1"}
          onClick={() => handleHeading("h1")}
        />
        <ToolbarButton
          icon={Heading2}
          label="Heading 2"
          active={blockType === "h2"}
          onClick={() => handleHeading("h2")}
        />
        <ToolbarButton
          icon={Heading3}
          label="Heading 3"
          active={blockType === "h3"}
          onClick={() => handleHeading("h3")}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          icon={List}
          label="Bullet List"
          active={blockType === "bullet"}
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered List"
          active={blockType === "number"}
          onClick={() =>
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
        />
        <ToolbarButton
          icon={Quote}
          label="Blockquote"
          active={blockType === "quote"}
          onClick={handleQuote}
        />
        <ToolbarButton
          icon={CodeSquare}
          label="Code Block"
          active={blockType === "code"}
          onClick={handleCodeBlock}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Insert group */}
        <ToolbarButton
          icon={Link2}
          label="Insert Link (Ctrl+K)"
          active={isLink}
          onClick={handleInsertLink}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* History group */}
        <ToolbarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo (Ctrl+Shift+Z)"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        />
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLinkSubmit();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkSubmit}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
