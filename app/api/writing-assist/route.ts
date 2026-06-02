import { createStreamingRoute, SYSTEM_PROMPTS } from "@/lib/ai-helpers";

export const POST = createStreamingRoute(SYSTEM_PROMPTS.write, (body) => {
  const text = (body.prompt as string) || (body.text as string) || "";
  const action = (body.action as string) || "fix-grammar";
  const fullDoc = (body.fullDoc as string) || "";

  const actionInstructions: Record<string, string> = {
    expand:
      "Expand on the following text with more detail, examples, and explanations.",
    "fix-grammar":
      "Fix grammar, spelling, and punctuation errors in the following text. Keep the original meaning and style.",
    format:
      "Format the following text properly with correct markdown structure, headings, lists, and code blocks.",
    simplify:
      "Simplify the following text to be clearer and easier to understand.",
  };

  const instruction = actionInstructions[action] || actionInstructions["fix-grammar"];

  return `${instruction}\n\nText to improve:\n${text}\n\n${fullDoc ? `Full document context:\n${fullDoc.slice(0, 2000)}` : ""}`;
});
