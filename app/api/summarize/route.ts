import { createStreamingRoute, SYSTEM_PROMPTS } from "@/lib/ai-helpers";

export const POST = createStreamingRoute(SYSTEM_PROMPTS.summarize, (body) => {
  const content = (body.prompt as string) || (body.content as string) || "";
  return `Tóm tắt tài liệu markdown bên dưới theo cấu trúc: Tóm tắt nhanh → Tại sao quan trọng → Điểm cần nhớ:\n\n${content}`;
});
