import { TAX_SYSTEM_PROMPT } from "@/lib/ai/tax-system-prompt";

export const runtime = "edge";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface SmartPlanProfile {
  occupation: string;
  filingStatus: string;
  income: number;
  dependents: number;
  hasRealEstate: boolean;
  hasBusinessIncome: boolean;
  hasMortgage: boolean;
  state: string;
  additionalInfo: string;
}

export async function POST(req: Request) {
  try {
    const { profile } = await req.json() as { profile: SmartPlanProfile };
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const prompt = `Based on this taxpayer profile, generate personalized tax-saving strategies.

TAXPAYER PROFILE:
- Occupation: ${profile.occupation}
- Filing Status: ${profile.filingStatus}
- Annual Income: $${profile.income.toLocaleString()}
- Dependents: ${profile.dependents}
- Has Real Estate/Rental Properties: ${profile.hasRealEstate ? "Yes" : "No"}
- Has Business Income: ${profile.hasBusinessIncome ? "Yes" : "No"}
- Has Mortgage: ${profile.hasMortgage ? "Yes" : "No"}
- State: ${profile.state || "Not specified"}
- Additional Info: ${profile.additionalInfo || "None"}

Return a JSON object with this EXACT structure:
{
  "totalEstimatedSavings": <number>,
  "savingsRange": { "min": <number>, "max": <number> },
  "strategiesCount": <number>,
  "categoriesCount": <number>,
  "strategies": [
    {
      "id": "<unique-id>",
      "category": "<one of: Deductions, Credits, Retirement, Medical, Assets, Charity, Business, Entity, International>",
      "title": "<strategy name>",
      "description": "<2-3 sentence explanation of why this applies to this specific taxpayer>",
      "estimatedSavings": <number>,
      "savingsMin": <number>,
      "savingsMax": <number>,
      "ircReference": "<IRC section if applicable>",
      "applicability": "<High/Medium/Low>",
      "implementationSteps": ["step 1", "step 2", "step 3"]
    }
  ]
}

Generate 8-15 strategies specifically tailored to this taxpayer's situation. Be realistic with savings estimates based on their income level and filing status. Include strategies from multiple categories. For someone with $${profile.income.toLocaleString()} income, the total savings should be proportionally realistic.

Return ONLY the JSON object, no other text.`;

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://agfintax.com",
        "X-Title": "AgFinTax Smart Plan",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        temperature: 0.2,
        max_tokens: 4096,
        messages: [
          { role: "system", content: TAX_SYSTEM_PROMPT + "\n\nYou must respond with ONLY valid JSON. No markdown, no code blocks, just the raw JSON object." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      // Try fallback model
      const fallbackRes = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://agfintax.com",
          "X-Title": "AgFinTax Smart Plan",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          temperature: 0.2,
          max_tokens: 4096,
          messages: [
            { role: "system", content: "You are a tax strategy AI. Respond with ONLY valid JSON." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!fallbackRes.ok) {
        const errText = await fallbackRes.text();
        return Response.json({ error: "AI request failed", details: errText }, { status: 500 });
      }

      const fallbackData = await fallbackRes.json();
      const content = fallbackData.choices?.[0]?.message?.content || "";
      const parsed = JSON.parse(content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      return Response.json(parsed);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    // Clean potential markdown wrapping
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch (error) {
    console.error("Smart Plan API error:", error);
    return Response.json({ error: "Failed to generate plan", details: String(error) }, { status: 500 });
  }
}
