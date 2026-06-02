import type { TopicFile } from "@/lib/topic-index";
import type { LearningPath } from "@/lib/learning-path-types";
import { saveAiOutput } from "@/lib/ai-output-saver";

const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

const SYSTEM_PROMPT = `Bạn là senior frontend engineer tạo lộ trình học tập, dành cho người TRÁI NGÀNH CNTT và MỚI BẮT ĐẦU.

NHIỆM VỤ: Tạo lộ trình học từ danh sách file có sẵn, sắp xếp từ cơ bản đến nâng cao.

PHƯƠNG PHÁP:
- Mỗi bước phải xây dựng trên kiến thức từ bước trước
- Bắt đầu từ nền tảng (biến, hàm, cấu trúc dữ liệu) trước khi vào framework
- Giải thích TẠI SAO học file này trước, không chỉ "học cái này trước"
- Đánh giá độ khó từng bước (1-5 sao) để người học biết trước

QUY TẮC BẮT BUỘC:
- Chỉ dùng file từ danh sách được cung cấp — không tự tạo path
- Ước tính thời gian đọc: 15-45 phút/file
- Viết rationale bằng Tiếng Việt, ngắn gọn nhưng có ý nghĩa
- Thêm "prerequisites" cho mỗi bước: kiến thức tối thiểu cần có trước khi học file này

OUTPUT JSON:
{
  "topic": "tên chủ đề",
  "steps": [
    {
      "order": 1,
      "title": "tên file",
      "path": "file/path.md",
      "rationale": "tại sao học file này đầu tiên (tiếng Việt)",
      "estimatedMinutes": 20,
      "difficulty": 2,
      "prerequisites": "kiến thức cần có trước khi học (tiếng Việt)",
      "outcome": "học xong bạn sẽ biết được gì (tiếng Việt)"
    }
  ],
  "totalEstimatedMinutes": 120,
  "tip": "mẹo học tập chung cho chủ đề này (tiếng Việt)"
}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, files } = body as { topic: string; files: unknown };

    if (!topic || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "Topic and files are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file shape
    const validFiles: TopicFile[] = files.filter(
      (f: unknown): f is TopicFile =>
        typeof f === "object" &&
        f !== null &&
        "title" in f &&
        "path" in f &&
        typeof (f as TopicFile).title === "string" &&
        typeof (f as TopicFile).path === "string"
    );

    if (validFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid files provided" }),
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

    const fileList = validFiles
      .map((f, i) => `${i + 1}. ${f.title} — ${f.path}`)
      .join("\n");

    const userPrompt = `Chủ đề: ${topic}

Danh sách file có sẵn:
${fileList}

Tạo lộ trình học tập có thứ tự. Return JSON:
{
  "topic": "${topic}",
  "steps": [
    {
      "order": 1,
      "title": "tên file",
      "path": "file/path.md",
      "rationale": "tại sao học file này trước (tiếng Việt)",
      "estimatedMinutes": 20,
      "difficulty": 2,
      "prerequisites": "kiến thức cần có trước (tiếng Việt)",
      "outcome": "học xong sẽ biết được gì (tiếng Việt)"
    }
  ],
  "totalEstimatedMinutes": 120,
  "tip": "mẹo học tập chung (tiếng Việt)"
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
      console.error(`[learning-path] Mimo API error: ${response.status}`, errText);
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content in API response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse and validate the JSON response
    let result: LearningPath;
    try {
      result = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in API response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate that returned paths exist in the input file list
    const validPaths = new Set(validFiles.map((f) => f.path));
    result.steps = result.steps.filter((step) => validPaths.has(step.path));

    // Re-number steps after filtering
    result.steps = result.steps.map((step, i) => ({ ...step, order: i + 1 }));

    // Auto-save learning path to ai-outputs/
    const mdContent = result.steps
      .map((s) => `${s.order}. **${s.title}** — ${s.rationale}\n   \`${s.path}\`${s.estimatedMinutes ? ` (${s.estimatedMinutes} min)` : ""}`)
      .join("\n\n");
    saveAiOutput("learning-path", topic, mdContent).catch(console.error);

    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
