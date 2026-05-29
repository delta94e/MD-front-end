import { NextResponse } from "next/server";
import { SYSTEM_PROMPTS } from "@/lib/ai-helpers";

const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const apiKey = process.env.MIMO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "MIMO_API_KEY not configured" }, { status: 500 });
    }

    const response = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS.generateExercises },
          {
            role: "user",
            content: `Generate exercises from this note:\n\n${content.slice(0, 4000)}`,
          },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error("[generate-exercises] Mimo API error:", response.status);
      return NextResponse.json(
        { error: "Failed to generate exercises" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "[]";

    // Extract JSON array from response (may be wrapped in markdown code block)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json([]);
    }

    try {
      const exercises = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(exercises)) {
        return NextResponse.json([]);
      }
      return NextResponse.json(exercises);
    } catch {
      console.error("[generate-exercises] Failed to parse AI response as JSON");
      return NextResponse.json([]);
    }
  } catch (err) {
    console.error("[generate-exercises] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
