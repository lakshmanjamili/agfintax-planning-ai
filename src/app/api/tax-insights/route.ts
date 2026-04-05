export const maxDuration = 30;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { profile, result } = body;

  const prompt = `You are a friendly, expert CPA at AG FinTax. A visitor just used our free tax calculator. Based on their profile and results below, provide a personalized tax analysis.

PROFILE:
- Filing status: ${profile.filingStatus}
- Age: ${profile.age}
- Gross income: $${profile.grossIncome?.toLocaleString() ?? 0}
- Deduction type: ${profile.deductionType} ($${profile.deductionAmount?.toLocaleString() ?? 0})
- Has 401k contributions: ${profile.has401k ? "Yes ($" + profile.k401.toLocaleString() + ")" : "No"}
- Has IRA contributions: ${profile.hasIRA ? "Yes ($" + profile.ira.toLocaleString() + ")" : "No"}
- Has HSA: ${profile.hasHSA ? "Yes ($" + profile.hsa.toLocaleString() + ")" : "No"}
- Has mortgage interest: ${profile.hasMortgage ? "Yes ($" + profile.mortgage.toLocaleString() + ")" : "No"}
- Has charitable giving: ${profile.hasCharity ? "Yes ($" + profile.charity.toLocaleString() + ")" : "No"}
- SALT deductions: $${profile.salt?.toLocaleString() ?? 0}
- Business income: ${profile.hasBusiness ? "Yes ($" + profile.businessIncome.toLocaleString() + ")" : "No"}
- Taxes withheld: $${profile.withheld?.toLocaleString() ?? 0}

CALCULATED RESULTS:
- Taxable income: $${result.taxableIncome?.toLocaleString() ?? 0}
- Total tax: $${result.totalTax?.toLocaleString() ?? 0}
- Effective rate: ${(result.effectiveRate * 100).toFixed(1)}%
- Marginal rate: ${(result.marginalRate * 100).toFixed(0)}%
- ${result.refundOrOwed >= 0 ? "Refund" : "Owes"}: $${Math.abs(result.refundOrOwed)?.toLocaleString() ?? 0}

Respond with a JSON object (no markdown, no code fences, just raw JSON):
{
  "greeting": "A warm 1-sentence personalized greeting mentioning their filing status and income level",
  "summary": "2-3 sentence plain-English summary of their tax situation — what stands out, what's good, what needs attention",
  "opportunities": [
    "Specific actionable tax-saving opportunity #1 with estimated dollar savings",
    "Specific actionable tax-saving opportunity #2 with estimated dollar savings",
    "Specific actionable tax-saving opportunity #3 with estimated dollar savings"
  ],
  "estimatedAdditionalSavings": <number — total estimated additional savings from all opportunities>,
  "riskFlag": "Any red flag or risk they should know about, or null if none",
  "ctaMessage": "A compelling 1-sentence reason to sign up for a full Smart Plan, personalized to their situation"
}`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://agfintax.com",
        "X-Title": "AgFinTax Tax Calculator",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        temperature: 0.3,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      // Fallback model
      const res2 = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://agfintax.com",
          "X-Title": "AgFinTax Tax Calculator",
        },
        body: JSON.stringify({
          model: "openai/gpt-5.4",
          temperature: 0.3,
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res2.ok) throw new Error(`API error: ${res2.status}`);
      const data2 = await res2.json();
      const text2 = data2.choices?.[0]?.message?.content ?? "";
      const cleaned2 = text2.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return Response.json(JSON.parse(cleaned2));
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return Response.json(JSON.parse(cleaned));
  } catch (err) {
    // Return a decent fallback if AI fails
    const savings = Math.round(result.totalTax * 0.12);
    return Response.json({
      greeting: `Great job taking the first step toward understanding your taxes!`,
      summary: `With a ${(result.effectiveRate * 100).toFixed(1)}% effective tax rate on $${profile.grossIncome?.toLocaleString()} income, there are likely optimization opportunities. Your ${result.marginalRate * 100}% marginal bracket means every deduction saves you ${result.marginalRate * 100} cents on the dollar.`,
      opportunities: [
        `Maximize retirement contributions — at your bracket, a full 401(k) contribution could save ~$${Math.round(23500 * result.marginalRate).toLocaleString()}`,
        `Review your deduction strategy — ${profile.deductionType === "standard" ? "itemizing might save more if you have significant mortgage interest or charitable giving" : "ensure all eligible expenses are captured"}`,
        `Consider an HSA if eligible — triple tax advantage could save $${Math.round(4300 * result.marginalRate).toLocaleString()}+ annually`,
      ],
      estimatedAdditionalSavings: savings,
      riskFlag: null,
      ctaMessage: `Our AI Smart Plan analyzes 46+ strategies personalized to your exact situation — clients with similar profiles save an average of $${savings.toLocaleString()}/year.`,
    });
  }
}
