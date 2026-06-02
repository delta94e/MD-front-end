const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

const SYSTEM_PROMPT = `Bạn tạo flashcard học tập kỹ thuật, dành cho người MỚI HỌC lập trình (có thể trái ngành CNTT, yếu logic).

NHIỆM VỤ: Tạo flashcard từ nội dung markdown bên dưới.

QUY TẮC BẮT BUỘC:
- Tạo 5-15 flashcard bao quát các khái niệm quan trọng nhất
- Viết bằng Tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh
- Câu hỏi phải kiểm tra HIỂU, không phải học vẹt
- Trả lời ngắn gọn nhưng đầy đủ (1-3 câu), luôn kèm ví dụ hoặc analogy đời sống
- Câu hỏi phải tự hiểu được (không cần đọc lại source)

CẤU TRÚC MỖI FLASHCARD:
- "front": câu hỏi (tiếng Việt, rõ ràng)
- "back": trả lời (tiếng Việt + analogy/ví dụ + thuật ngữ Anh giữ nguyên)
- "tags": mảng 1-3 tag chủ đề
- "difficulty": "easy" | "medium" | "hard"
- "memoryTip": mẹo ghi nhớ nhanh (1 câu, tiếng Việt)

TRỘN CÁC LOẠI CÂU HỎI:
- Conceptual: "Tại sao React cần Virtual DOM?"
- Definition: "Closure là gì? Cho ví dụ đời thường"
- Application: "Khi nào bạn dùng useEffect với dependency array rỗng?"
- Comparison: "So sánh let và var — khác nhau ở đâu?"
- Debug: "Code sau bị gì? [code snippet]"

Return JSON:
{
  "cards": [
    {
      "front": "Tại sao useEffect cần dependency array?",
      "back": "Dependency array告诉 React khi nào cần chạy lại effect. Giống như bạn đặt báo thức — nếu không set ngày, nó sẽ reo MỖI NGÀY. Nếu set [count], nó chỉ reo khi count thay đổi.",
      "tags": ["react", "hooks", "useEffect"],
      "difficulty": "medium",
      "memoryTip": "Không có array = chạy mỗi lần. Array rỗng [] = chạy 1 lần. Array có biến = chạy khi biến đổi."
    }
  ]
}`;

const MAX_CONTENT_LENGTH = 15000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, filePath } = body as {
      content?: string;
      filePath?: string;
    };

    if (!content || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.MIMO_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "MIMO_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const truncated =
      content.length > MAX_CONTENT_LENGTH
        ? content.slice(0, MAX_CONTENT_LENGTH) + "\n\n[Content truncated...]"
        : content;

    const userPrompt = `${filePath ? `File nguồn: ${filePath}` : ""}

--- BEGIN CONTENT ---
${truncated}
--- END CONTENT ---

Tạo flashcard từ nội dung trên. Return JSON:
{
  "cards": [
    { "front": "câu hỏi (tiếng Việt)", "back": "trả lời + analogy/ví dụ", "tags": ["tag1", "tag2"], "difficulty": "easy|medium|hard", "memoryTip": "mẹo ghi nhớ" }
  ]
}`;

    const response = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-flashcards] API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: "No content in AI response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let parsed: { cards: Array<{ front: string; back: string; tags: string[]; difficulty?: string; memoryTip?: string }> };
    try {
      parsed = JSON.parse(aiContent);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in AI response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      return new Response(
        JSON.stringify({ error: "AI response missing cards array" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Sanitize: ensure each card has required fields
    const cards = parsed.cards
      .filter(
        (c) =>
          typeof c.front === "string" &&
          c.front.trim().length > 0 &&
          typeof c.back === "string" &&
          c.back.trim().length > 0
      )
      .map((c) => ({
        front: c.front.trim(),
        back: c.back.trim(),
        tags: Array.isArray(c.tags)
          ? c.tags.filter((t: unknown) => typeof t === "string")
          : [],
        ...(c.difficulty && { difficulty: c.difficulty }),
        ...(c.memoryTip && { memoryTip: c.memoryTip }),
      }));

    return Response.json({ cards });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
