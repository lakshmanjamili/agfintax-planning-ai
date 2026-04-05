import { TAX_SYSTEM_PROMPT } from "@/lib/ai/tax-system-prompt";

export const maxDuration = 60;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        "AgFinTax AI is running in demo mode. Configure OPENROUTER_API_KEY for live responses.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    const models = [
      "openai/gpt-5.4",
      "anthropic/claude-sonnet-4",
    ];

    let lastError = "";

    for (const model of models) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        const response = await fetch(OPENROUTER_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agfintax.com",
            "X-Title": "AgFinTax Planning AI",
          },
          body: JSON.stringify({
            model,
            stream: true,
            temperature: 0.3,
            max_tokens: 2000,
            messages: [
              { role: "system", content: TAX_SYSTEM_PROMPT },
              ...messages,
            ],
          }),
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `${model}: ${response.status} - ${errorText.slice(0, 200)}`;
          console.error(`Chat API: ${lastError}`);
          continue;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          lastError = `No response body from ${model}`;
          continue;
        }

        const stream = new ReadableStream({
          async start(streamController) {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            let buffer = "";

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed || !trimmed.startsWith("data: ")) continue;
                  const data = trimmed.slice(6);
                  if (data === "[DONE]") continue;

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      streamController.enqueue(encoder.encode(content));
                    }
                  } catch {
                    // Skip malformed SSE chunks
                  }
                }
              }
            } catch (err) {
              console.error("Stream error:", err);
            } finally {
              streamController.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      } catch (err) {
        lastError = `${model}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`Chat API: ${lastError}`);
        continue;
      }
    }

    console.error("Chat API: All models failed.", lastError);
    return new Response(
      "I'm temporarily unable to respond. Please try again in a moment.",
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      "Something went wrong. Please try again.",
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
