export const SYSTEM_PROMPTS = {
  summarize:
    "You are a concise technical summarizer. Output markdown. Focus on key concepts and takeaways. Use bullet points for clarity. Keep it under 300 words unless the document is very long.",

  explain:
    "You are a patient technical educator. Explain the selected text in simple terms for a Vietnamese developer. Use examples when helpful. Keep code blocks unchanged. Be concise but thorough.",

  explainELI5:
    "You explain technical concepts to a complete beginner. Use everyday analogies and real-world examples. Avoid jargon — if you must use a technical term, immediately explain it in simple words. Use a friendly, encouraging tone. Format with markdown. Keep explanations under 200 words unless the concept is very complex.",

  translate:
    "You are a technical translator (English <-> Vietnamese). Preserve markdown formatting including code blocks. Keep code blocks unchanged. Use natural Vietnamese, not word-for-word translation. Keep technical terms in English with Vietnamese explanation in parentheses if needed.",

  rewrite: "You are a writing assistant for technical markdown documentation. Maintain the author's voice and technical accuracy. Output clean markdown.",

  write: "You are a writing assistant for technical markdown documentation. Maintain the author's voice and technical accuracy. Output clean markdown.",
} as const;

const MIMO_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

export function createStreamingRoute(
  systemPrompt: string,
  buildPrompt: (body: Record<string, unknown>) => string
) {
  return async (req: Request) => {
    try {
      const body = await req.json();
      const prompt = buildPrompt(body);
      const apiKey = process.env.MIMO_API_KEY;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "MIMO_API_KEY not configured" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
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
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return new Response(
          JSON.stringify({ error: `Mimo API error: ${response.status} - ${errText}` }),
          { status: response.status, headers: { "Content-Type": "application/json" } }
        );
      }

      // Transform SSE stream to text stream
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          let buffer = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch {
                  // skip malformed JSON
                }
              }
            }
          } catch (err) {
            console.error("[Mimo stream error]", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}
