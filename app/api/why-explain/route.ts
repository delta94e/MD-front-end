import { createStreamingRoute, SYSTEM_PROMPTS } from "@/lib/ai-helpers";

export const POST = createStreamingRoute(SYSTEM_PROMPTS.whyExplain, (body) => {
  const selectedText = (body.selectedText as string) || "";
  const context = (body.surroundingContext as string) || "";
  return `Giải thích LÝ DO THIẾT KẾ của đoạn code này — tại sao viết theo cách này, trade-offs, cách khác, và ảnh hưởng hiệu năng:\n\nCode cần phân tích:\n"${selectedText}"\n\nNgữ cảnh:\n${context.slice(0, 2000)}`;
});
