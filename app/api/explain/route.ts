import { createStreamingRoute, SYSTEM_PROMPTS } from "@/lib/ai-helpers";

export const POST = createStreamingRoute(SYSTEM_PROMPTS.explain, (body) => {
  const selectedText = (body.prompt as string) || (body.selectedText as string) || "";
  const context = (body.surroundingContext as string) || "";
  const mode = (body.mode as string) || "technical";
  const prompt = mode === "eli5"
    ? `Explain this text like I'm 5 years old. Use simple analogies, everyday examples, and avoid all jargon:\n\nSelected: "${selectedText}"\n\nDocument context:\n${context.slice(0, 2000)}`
    : `Explain this text in simple terms:\n\nSelected: "${selectedText}"\n\nDocument context:\n${context.slice(0, 2000)}`;
  return prompt;
});
