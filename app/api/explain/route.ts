import { createStreamingRoute, SYSTEM_PROMPTS } from "@/lib/ai-helpers";

export const POST = createStreamingRoute(SYSTEM_PROMPTS.explain, (body) => {
  const selectedText = (body.prompt as string) || (body.selectedText as string) || "";
  const context = (body.surroundingContext as string) || "";
  const mode = (body.mode as string) || "technical";
  const prompt = mode === "eli5"
    ? `Giải thích đoạn bên dưới cho người hoàn toàn không biết lập trình. Dùng ví dụ đời sống, không dùng jargon:\n\nĐoạn cần giải thích: "${selectedText}"\n\nNgữ cảnh tài liệu:\n${context.slice(0, 2000)}`
    : `Giải thích đoạn bên dưới theo cấu trúc: Ví dụ thực tế → Giải thích đơn giản → Code walkthrough → Lưu ý hiệu năng → Lỗi thường gặp:\n\nĐoạn cần giải thích: "${selectedText}"\n\nNgữ cảnh tài liệu:\n${context.slice(0, 2000)}`;
  return prompt;
});
