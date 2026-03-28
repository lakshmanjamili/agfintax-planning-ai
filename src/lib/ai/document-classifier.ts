import { getOpenRouterClient, MODELS } from "./openrouter";

export type TaxDocumentType =
  | "w2"
  | "1099-nec"
  | "1099-int"
  | "1099-div"
  | "1099-b"
  | "1099-r"
  | "1099-misc"
  | "1099-k"
  | "1040"
  | "1065"
  | "1120"
  | "1120s"
  | "k1"
  | "bank-statement"
  | "investment-statement"
  | "mortgage-statement"
  | "property-tax"
  | "charitable-receipt"
  | "medical-expense"
  | "business-expense"
  | "invoice"
  | "receipt"
  | "other";

export interface ClassificationResult {
  documentType: TaxDocumentType;
  confidence: number;
  taxYear: string | null;
  description: string;
}

export async function classifyDocument(
  extractedText: string
): Promise<ClassificationResult> {
  const openrouter = getOpenRouterClient();
  const response = await openrouter.chat.completions.create({
    model: MODELS.classification,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `You are a tax document classifier. Classify the document and return JSON:
{"documentType": "<type>", "confidence": <0-1>, "taxYear": "<year or null>", "description": "<brief description>"}
Types: w2, 1099-nec, 1099-int, 1099-div, 1099-b, 1099-r, 1099-misc, 1099-k, 1040, 1065, 1120, 1120s, k1, bank-statement, investment-statement, mortgage-statement, property-tax, charitable-receipt, medical-expense, business-expense, invoice, receipt, other`,
      },
      { role: "user", content: extractedText.slice(0, 4000) },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}
