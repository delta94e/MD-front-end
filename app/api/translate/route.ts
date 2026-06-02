import { createStreamingRoute, SYSTEM_PROMPTS } from "@/lib/ai-helpers";

export const POST = createStreamingRoute(SYSTEM_PROMPTS.translate, (body) => {
  const text = (body.prompt as string) || (body.text as string) || "";
  const direction = (body.direction as string) || "en-to-vi";
  const target = direction === "en-to-vi" ? "Vietnamese" : "English";
  return `Dịch đoạn text bên dưới sang ${target}. Giữ nguyên code blocks, giải thích thuật ngữ kỹ thuật lần đầu xuất hiện:\n\n${text}`;
});
