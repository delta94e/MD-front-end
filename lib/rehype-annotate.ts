import type { Root, Element, Text } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export interface RehypeAnnotation {
  id: string;
  startOffset: number;
  endOffset: number;
  color: string;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_RE.test(color);
}

/**
 * Rehype plugin that wraps annotated text ranges in <mark> elements.
 * Runs after rehypePrism to avoid breaking code highlighting.
 */
const rehypeAnnotate: Plugin<[RehypeAnnotation[]], Root> = (annotations) => {
  return (tree: Root) => {
    if (!annotations.length) return;

    // Validate and sort annotations
    const sorted = annotations
      .filter((a) => a.startOffset < a.endOffset && isValidHexColor(a.color))
      .sort((a, b) => a.startOffset - b.startOffset);

    if (!sorted.length) return;

    // Skip code blocks entirely
    const skipNodes = new Set<Element>();
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "pre" || node.tagName === "code") {
        skipNodes.add(node);
      }
    });

    // Collect mutations to apply in reverse order (avoids splice breaking visitor)
    type Mutation = {
      parent: Element;
      index: number;
      replacements: (Text | Element)[];
    };
    const mutations: Mutation[] = [];

    // Walk all text nodes and track cumulative offset
    let globalOffset = 0;

    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined || index === null) return;
      if (parent.type !== "element") return;
      const element = parent as Element;
      if (skipNodes.has(element)) {
        globalOffset += node.value.length;
        return;
      }

      const text = node.value;
      const textStart = globalOffset;
      const textEnd = globalOffset + text.length;

      // Find annotations that overlap with this text node
      const overlapping = sorted.filter(
        (a) => a.startOffset < textEnd && a.endOffset > textStart
      );

      if (overlapping.length === 0) {
        globalOffset += text.length;
        return;
      }

      // Build new children: split text around annotations
      const children: (Text | Element)[] = [];
      let cursor = 0;

      for (const ann of overlapping) {
        const localStart = Math.max(0, ann.startOffset - textStart);
        const localEnd = Math.min(text.length, ann.endOffset - textStart);

        if (localStart >= localEnd) continue;

        // Add text before annotation
        if (localStart > cursor) {
          children.push({
            type: "text",
            value: text.slice(cursor, localStart),
          });
        }

        // Add annotated text wrapped in <mark>
        children.push({
          type: "element",
          tagName: "mark",
          properties: {
            "data-annotation-id": ann.id,
            style: `background-color: ${ann.color}40; border-bottom: 2px solid ${ann.color}; cursor: pointer;`,
            className: ["annotation-highlight"],
          },
          children: [
            {
              type: "text",
              value: text.slice(localStart, localEnd),
            },
          ],
        });

        cursor = localEnd;
      }

      // Add remaining text
      if (cursor < text.length) {
        children.push({
          type: "text",
          value: text.slice(cursor),
        });
      }

      // Collect mutation instead of splicing immediately
      mutations.push({ parent: element, index, replacements: children });
      globalOffset += text.length;
    });

    // Apply mutations in reverse order to preserve indices
    for (let i = mutations.length - 1; i >= 0; i--) {
      const m = mutations[i];
      m.parent.children.splice(m.index, 1, ...m.replacements);
    }
  };
};

export default rehypeAnnotate;
