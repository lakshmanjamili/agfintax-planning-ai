import { TAX_SYSTEM_PROMPT } from "@/lib/ai/tax-system-prompt";

export const runtime = "edge";

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

    // Try primary model, fall back if needed
    const models = [
      "anthropic/claude-sonnet-4",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
    ];

    let lastError = "";

    for (const model of models) {
      try {
        const response = await fetch(OPENROUTER_URL, {
          method: "POST",
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
            max_tokens: 4096,
            messages: [
              { role: "system", content: TAX_SYSTEM_PROMPT },
              ...messages,
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `Model ${model}: ${response.status} - ${errorText}`;
          console.error(`OpenRouter error with ${model}:`, lastError);
          continue; // try next model
        }

        // Stream the response back
        const reader = response.body?.getReader();
        if (!reader) {
          lastError = `No response body from ${model}`;
          continue;
        }

        const stream = new ReadableStream({
          async start(controller) {
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
                      controller.enqueue(encoder.encode(content));
                    }
                  } catch {
                    // Skip malformed JSON chunks
                  }
                }
              }
            } catch (err) {
              console.error("Stream read error:", err);
            } finally {
              controller.close();
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
        lastError = `Model ${model}: ${String(err)}`;
        console.error(lastError);
        continue;
      }
    }

    // All models failed
    console.error("All models failed. Last error:", lastError);
    return new Response(
      `I apologize, but I'm temporarily unable to process your request. Please try again in a moment.\n\nError details: ${lastError}`,
      {
        status: 200, // Return 200 so the client shows the message
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      "Sorry, something went wrong processing your request. Please try again.",
      {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }
}
