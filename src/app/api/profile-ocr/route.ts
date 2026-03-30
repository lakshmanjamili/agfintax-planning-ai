import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120; // Azure OCR polling can take 30-60s + LLM analysis

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const entityType = (formData.get("entityType") as string) || "individual";
    const documentType = (formData.get("documentType") as string) || "tax-return";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    console.log("=== PROFILE OCR ===");
    console.log(`File: ${file.name}, Size: ${(file.size / 1024).toFixed(0)}KB, Entity: ${entityType}, DocType: ${documentType}`);

    // Step 1: OCR — Extract text from the document
    // Use specialized Azure model for known document types, layout for tax returns
    let ocrText = "";
    let ocrPages = 0;
    let ocrConfidence = 0;
    let ocrMethod = "none";
    let extractedFields: Array<{ name: string; value: string; confidence: number }> = [];

    const azureEndpoint = process.env.AZURE_DOCINTEL_ENDPOINT;
    const azureKey = process.env.AZURE_DOCINTEL_KEY;

    if (azureEndpoint && azureKey) {
      try {
        const buffer = await file.arrayBuffer();

        // Use specialized model for known form types, layout for general tax returns
        const useSpecializedModel = documentType !== "tax-return" && documentType !== "other" && documentType !== "k1";

        if (useSpecializedModel) {
          // Specialized model (W-2, 1099, 1098) — extracts structured fields directly
          console.log(`→ Using specialized Azure model for ${documentType}...`);
          const { analyzeTaxDocument } = await import("@/lib/ocr/azure-doc-intel");
          const result = await analyzeTaxDocument(buffer, file.type || "application/pdf", documentType);
          ocrText = result.ocrText;
          ocrPages = result.pages;
          ocrConfidence = result.confidence;
          extractedFields = result.fields;
          ocrMethod = `azure-${result.modelUsed}`;
          console.log(`  ✓ Specialized OCR: ${ocrText.length} chars, ${ocrPages} pages, ${extractedFields.length} fields extracted`);
          console.log(`  Fields: ${extractedFields.map(f => `${f.name}=${f.value}`).join(", ")}`);
        } else {
          // Layout model — full text extraction for multi-page tax returns
          console.log("→ Using Azure layout model (full OCR)...");
          const { analyzeDocument } = await import("@/lib/ocr/azure-doc-intel");
          const result = await analyzeDocument(buffer, file.type || "application/pdf");
          ocrText = result.text;
          ocrPages = result.pages;
          ocrConfidence = result.confidence;
          ocrMethod = "azure-layout";
          console.log(`  ✓ Layout OCR: ${ocrText.length} chars, ${ocrPages} pages, confidence: ${(ocrConfidence * 100).toFixed(0)}%`);
        }
      } catch (ocrError) {
        console.error("  ✗ Azure OCR failed:", ocrError);
        ocrMethod = "azure-failed";
      }
    } else {
      console.log("→ Azure not configured, will use LLM-only analysis");
    }

    // Step 2: LLM Analysis — extract structured profile data
    const entityLabel = entityType === "s_corp" ? "S-Corporation (1120-S)"
      : entityType === "c_corp" ? "C-Corporation (1120)"
      : entityType === "partnership" ? "Partnership (1065)"
      : entityType === "sole_prop" ? "Sole Proprietorship (Schedule C)"
      : "Individual (1040)";

    // Build OCR content for LLM — include both text and any specialized fields
    let ocrContent: string;
    if (ocrText.length > 100) {
      ocrContent = `FULL OCR TEXT FROM ${documentType.toUpperCase()} DOCUMENT (${ocrPages} pages, ${(ocrConfidence * 100).toFixed(0)}% confidence):\n\n${ocrText}`;
    } else {
      ocrContent = `Document uploaded: ${file.name} (no OCR text available)`;
    }

    // Append specialized extracted fields if available
    if (extractedFields.length > 0) {
      ocrContent += `\n\nSPECIALIZED OCR EXTRACTED FIELDS (high-confidence structured data):\n`;
      for (const f of extractedFields) {
        ocrContent += `- ${f.name}: ${f.value} (${(f.confidence * 100).toFixed(0)}% confidence)\n`;
      }
    }

    console.log(`  Total content for LLM: ${ocrContent.length} chars (no truncation)`);

    const llmPrompt = `You are an expert tax analyst for AG FinTax. Analyze this ${entityLabel} tax return and extract a comprehensive client profile.

${ocrContent}

INSTRUCTIONS:
1. Read EVERY line of the tax return text carefully
2. Extract ALL income sources, deductions, credits, and schedules present
3. Calculate or identify the AGI, total tax, effective rate, and key line items
4. Identify what tax strategies the client is currently using and what they're missing
5. Be specific with dollar amounts — use exact numbers from the return

Return ONLY valid JSON:
{
  "summary": "<3-4 sentence comprehensive summary. Include: filing status, AGI, total tax paid, number of dependents, state, key deductions/credits used. Be specific with numbers.>",
  "extractedFields": {
    "occupation": "<from W-2 employer or Schedule C business>",
    "filingStatus": "<single|mfj|mfs|hoh|qss — detect from the return>",
    "annualIncome": "<AGI or total income as string, e.g. '$319,298'>",
    "dependents": <number — count from exemptions/credits>,
    "state": "<state from address or state return>",
    "businessName": "<if Schedule C/1120-S present>",
    "businessIncome": "<Schedule C net profit or business revenue>",
    "incomeSources": ["<W-2>", "<1099>", "<Rental>", "<Capital Gains>", "<Interest>", "<Dividends>"],
    "hasRealEstate": <boolean — Schedule E, rental income, or mortgage interest>,
    "hasBusinessIncome": <boolean — Schedule C, 1120-S, or partnership income>,
    "hasMortgage": <boolean — Schedule A mortgage interest deduction>,
    "hasRetirementAccounts": <boolean — IRA deductions, 401k, pension>,
    "retirementAccountTypes": ["<401(k)>", "<Traditional IRA>", "<Roth IRA>"],
    "hasInvestments": <boolean — Schedule D, capital gains, dividends>,
    "hasCharitableGiving": <boolean — Schedule A charitable deductions>,
    "hasHealthInsurance": <boolean — any health-related deductions>,
    "hasStudentLoans": <boolean — student loan interest deduction>,
    "taxWithheld": "<total federal tax withheld>",
    "taxOwed": "<tax owed or refund amount — specify which>",
    "effectiveRate": "<effective tax rate as percentage>",
    "agi": "<adjusted gross income>",
    "totalDeductions": "<total itemized or standard deduction amount>",
    "taxableIncome": "<taxable income after deductions>",
    "schedulesPresent": ["<A>", "<B>", "<C>", "<D>", "<E>", "<SE>"],
    "creditsUsed": ["<Child Tax Credit>", "<Education Credit>", "<etc>"],
    "stateIncomeTax": "<state income tax paid if visible>"
  },
  "profileSuggestions": [
    "<Specific actionable suggestion based on what you see in the return — reference actual numbers>",
    "<Another specific suggestion>",
    "<Third suggestion>"
  ],
  "keyFindings": [
    "<Important observation 1 — e.g., 'Client is not maximizing 401(k) contributions'>",
    "<Important observation 2>",
    "<Important observation 3>"
  ]
}`;

    console.log("→ Sending to LLM for analysis...");

    // Try models in order
    const models = [
      "anthropic/claude-sonnet-4",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
    ];

    let lastError = "";

    for (const model of models) {
      try {
        console.log(`  Trying ${model}...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        const response = await fetch(OPENROUTER_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agfintax.com",
            "X-Title": "AgFinTax Profile OCR",
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            max_tokens: 4096,
            messages: [
              {
                role: "system",
                content: "You are an expert tax return analyst. Extract comprehensive profile data from tax returns. Respond with ONLY valid JSON — no markdown, no explanation.",
              },
              { role: "user", content: llmPrompt },
            ],
          }),
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${model}: ${response.status} - ${errText.slice(0, 200)}`;
          console.error(`  ✗ ${lastError}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";
        const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // Try to repair
          const repaired = cleaned
            .replace(/,\s*([\]}])/g, "$1")
            .replace(/[\x00-\x1F]+/g, " ");
          parsed = JSON.parse(repaired);
        }

        const elapsed = Date.now() - startTime;
        console.log(`  ✓ SUCCESS with ${model} in ${(elapsed / 1000).toFixed(1)}s`);
        console.log(`  Summary: ${(parsed.summary || "").slice(0, 100)}...`);
        console.log(`  Fields extracted: ${Object.keys(parsed.extractedFields || {}).length}`);

        return NextResponse.json({
          ...parsed,
          ocrMethod,
          ocrTextLength: ocrText.length,
          ocrPages,
          ocrConfidence,
          processingTime: elapsed,
        });
      } catch (err) {
        lastError = `${model}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`  ✗ ${lastError}`);
        continue;
      }
    }

    // All models failed
    console.error("=== ALL MODELS FAILED for profile OCR ===", lastError);
    return NextResponse.json({
      summary: `Tax return uploaded: ${file.name}. AI analysis failed — please fill in your profile manually.`,
      extractedFields: {},
      profileSuggestions: ["Complete your profile manually for best results"],
      error: lastError,
    });
  } catch (error) {
    console.error("Profile OCR error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: String(error) },
      { status: 500 }
    );
  }
}
