import type { TopicFile } from "@/lib/topic-index";
import type { LearningPath } from "@/lib/learning-path-types";
import { saveAiOutput } from "@/lib/ai-output-saver";

const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

const SYSTEM_PROMPT = `You are a senior frontend engineer creating study paths.
Given a topic and list of available learning files, create an ordered study path from foundational to advanced.

Rules:
- Order files so each builds on knowledge from previous files
- Start with basics/fundamentals, then move to advanced topics
- Keep rationale concise (1 sentence per step)
- Only use files from the provided list — do not invent paths
- Estimate reading time in minutes per file (15-45 min range)
- Return valid JSON only`;

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

    const userPrompt = `Topic: ${topic}

Available files in this category:
${fileList}

Create an ordered learning path. Return JSON with this structure:
{
  "topic": "${topic}",
  "steps": [
    { "order": 1, "title": "file title", "path": "file/path.md", "rationale": "why study this first", "estimatedMinutes": 20 }
  ],
  "totalEstimatedMinutes": 120
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
