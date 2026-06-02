import { crawlUrl } from "@/lib/content-crawler";
import { hashInput, getCachedEntry, setCachedEntry, cleanupExpired } from "@/lib/content-cache";
import type { StudyGuide } from "@/lib/study-guide-types";

const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

const SYSTEM_PROMPT = `Bạn là chuyên gia tạo tài liệu học tập kỹ thuật, dành cho người TRÁI NGÀNH CNTT và YẾU VỀ LOGIC.

NHIỆM VỤ: Tạo study guide từ nội dung bên dưới.

PHƯƠNG PHÁP GIẢNG DẠY:
- Luôn bắt đầu bằng "Tại sao cần học cái này?" trước khi giải thích "Nó là gì?"
- Dùng ví dụ đời sống (analogy) trước khi nói technical
- Giải thích từng bước, không nhảy bước logic
- Khi code phức tạp → chia nhỏ, giải thích từng phần

QUY TẮC BẮT BUỘC:
- Viết bằng Tiếng Việt, giữ thuật ngữ kỹ thuật tiếng Anh (API, React, State...)
- Thuật ngữ lần đầu xuất hiện → giải thích trong ngoặc: "Closure (hàm đóng — biến bên trong vẫn tồn tại sau khi hàm chạy xong)"
- Giọng điệu thân thiện, như giải thích cho bạn bè
- Không dùng ngôn ngữ học thuật hay quá trang trọng

HƯỚNG DẪN TỪNG FIELD:

1. "title": Tiêu đề tiếng Việt rõ ràng, mô tả chủ đề

2. "summary": 4-6 câu tóm tắt TOÀN BỘ bức tranh:
   - Chủ đề này giải quyết VẤN ĐỀ GÌ trong thực tế?
   - Tại sao developer cần biết cái này?
   - Nó hoạt động như thế nào ở mức tổng quan?
   - KHÔNG chỉ lặp lại tiêu đề — cho context thật

3. "concepts": 6-10 khái niệm then chốt:
   - Mỗi khái niệm là MỘT CÂU ĐẦY ĐỦ (không phải cụm từ)
   - Luôn kèm ví dụ hoặc analogy đơn giản
   - Ví dụ đúng: "State management là cách ứng dụng theo dõi và cập nhật dữ liệu thay đổi — giống như bảng điểm điện tử luôn cập nhật điểm thi real-time"
   - Ví dụ sai: "State management"

4. "terms": 5-8 thuật ngữ kỹ thuật quan trọng:
   - "term": thuật ngữ tiếng Anh
   - "definition": giải thích 2-3 câu bằng tiếng Việt, BẮT BUỘC kèm 1 ví dụ/analogy đời sống
   - Ví dụ: "Promise — giống như bạn đặt hàng online, shop hẹn sẽ giao (resolve) hoặc hết hàng (reject). Promise trong JS cũng vậy — nó hứa sẽ trả kết quả trong tương lai."

5. "examples": 3-5 ví dụ code:
   - "code": code snippet giữ nguyên tiếng Anh
   - "explanation": giải thích TỪNG DÒNG bằng tiếng Việt, tối thiểu 3-4 câu, bao gồm:
     * Code làm gì? (step by step)
     * Tại sao viết theo cách này mà không phải cách khác?
     * Điều gì xảy ra nếu thay đổi X?
     * Hiệu năng (performance): nhanh/chậm ra sao?

6. "questions": 5-7 câu hỏi kiểm tra HIỂU (không phải học vẹt):
   - Conceptual: "Tại sao chúng ta cần...?"
   - Application: "Điều gì sẽ xảy ra nếu bạn dùng X trong trường hợp Y?"
   - Comparison: "So sánh X và Y — khi nào nên dùng cái nào? Tại sao?"
   - Debug: "Code sau bị lỗi gì? Sửa ra sao?"
   - Real-world: "Trong dự án thực tế, bạn sẽ dùng khái niệm này khi nào?"

7. "relatedTopics": 4-6 chủ đề liên quan:
   - Mỗi chủ đề kèm 1 câu giải thích TẠI SAO liên quan và NÊN học tiếp

- Return valid JSON only
- Every string must be meaningful and detailed — no filler, no generic placeholders`;

const MAX_CONTENT_LENGTH = 15000;
const MAX_INPUT_LENGTH = 100000;

let lastCleanup = 0;
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    lastCleanup = now;
    cleanupExpired();
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, text } = body as { url?: string; text?: string };

    if (!url && !text) {
      return new Response(
        JSON.stringify({ error: "Either url or text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (text && text.length > MAX_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text too long. Maximum ${MAX_INPUT_LENGTH} characters.` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    maybeCleanup();

    const cacheKey = url ? hashInput(url) : hashInput(text!);

    // Check cache
    const cached = getCachedEntry(cacheKey);
    if (cached?.studyGuide) {
      try {
        const parsed = JSON.parse(cached.studyGuide);
        const result: StudyGuide = { ...parsed, cached: true };
        return Response.json(result);
      } catch {
        // Corrupted cache entry, regenerate below
      }
    }

    // Get content: crawl or use provided text
    let content: string;
    let title: string;
    let sourceUrl: string | undefined;

    if (url) {
      if (cached) {
        content = cached.crawledContent;
        title = cached.title;
        sourceUrl = url;
      } else {
        const crawled = await crawlUrl(url);
        if (crawled.error) {
          return new Response(
            JSON.stringify({ error: crawled.error, needsManualInput: true }),
            { status: 422, headers: { "Content-Type": "application/json" } }
          );
        }
        content = crawled.content;
        title = crawled.title;
        sourceUrl = url;
        setCachedEntry(cacheKey, url, title, content);
      }
    } else {
      content = text!;
      title = "Pasted text";
      sourceUrl = undefined;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      content = content.slice(0, MAX_CONTENT_LENGTH) + "\n\n[Content truncated...]";
    }

    const apiKey = process.env.MIMO_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "MIMO_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Title: ${title}
${sourceUrl ? `Source: ${sourceUrl}` : ""}

--- BEGIN ARTICLE CONTENT ---
${content}
--- END ARTICLE CONTENT ---

Create a study guide. Return JSON:
{
  "title": "${title}",
  "summary": "2-3 sentence summary",
  "concepts": ["concept 1", "concept 2"],
  "terms": [{"term": "term", "definition": "definition"}],
  "examples": [{"code": "code snippet", "explanation": "what it does"}],
  "questions": ["question 1", "question 2"],
  "relatedTopics": ["topic 1", "topic 2"]
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
      console.error(`[study-guide] Mimo API error: ${response.status}`, errText);
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

    let result: StudyGuide;
    try {
      result = JSON.parse(aiContent);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in AI response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    result.sourceUrl = sourceUrl;
    result.cached = false;

    setCachedEntry(cacheKey, url || "", title, content, JSON.stringify(result));

    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
