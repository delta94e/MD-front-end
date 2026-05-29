import { NextResponse } from "next/server";
import { SYSTEM_PROMPTS } from "@/lib/ai-helpers";

const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content) {
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
      const errText = await response.text();
      return NextResponse.json(
        { error: `Mimo API error: ${response.status} - ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "[]";

    // Extract JSON array from response (may be wrapped in markdown code block)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ exercises: [], error: "Invalid AI response format" });
    }

    try {
      const exercises = JSON.parse(jsonMatch[0]);
      return NextResponse.json(exercises);
    } catch {
      return NextResponse.json({ exercises: [], error: "Failed to parse exercises" });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
