import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ocr/azure-doc-intel";
import { classifyDocument } from "@/lib/ai/document-classifier";
import { getOpenRouterClient, MODELS } from "@/lib/ai/openrouter";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentId = (formData.get("documentId") as string) || crypto.randomUUID();

    // If file is provided, do real OCR processing
    if (file) {
      const startTime = Date.now();
      const buffer = await file.arrayBuffer();
      const contentType = file.type || "application/pdf";

      // Step 1: OCR with Azure Document Intelligence
      let ocrText = "";
      let ocrConfidence = 0;
      let pageCount = 0;

      try {
        const ocrResult = await analyzeDocument(buffer, contentType);
        ocrText = ocrResult.text;
        ocrConfidence = ocrResult.confidence;
        pageCount = ocrResult.pages;
      } catch (ocrError) {
        console.error("OCR failed, using filename fallback:", ocrError);
        ocrText = `Document: ${file.name}`;
        ocrConfidence = 0.5;
      }

      // Step 2: AI Classification
      let classification = {
        documentType: inferDocType(file.name),
        confidence: 0.8,
        taxYear: "2024" as string | null,
        description: file.name,
      };

      if (ocrText.length > 50 && process.env.OPENROUTER_API_KEY) {
        try {
          classification = await classifyDocument(ocrText);
        } catch (classifyError) {
          console.error("Classification failed, using fallback:", classifyError);
        }
      }

      // Step 3: AI Data Extraction
      let extractedFields: Array<{ name: string; value: string; confidence: number }> = [];

      if (ocrText.length > 50 && process.env.OPENROUTER_API_KEY) {
        try {
          extractedFields = await extractTaxData(ocrText, classification.documentType);
        } catch (extractError) {
          console.error("Extraction failed:", extractError);
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;

      return NextResponse.json({
        documentId,
        status: "processed",
        fileName: file.name,
        classification,
        ocr: {
          text: ocrText.slice(0, 2000),
          confidence: ocrConfidence,
          pages: pageCount,
        },
        extractedData: { fields: extractedFields },
        processingTime,
      });
    }

    // Fallback: mock response for demo (no file provided)
    const { fileName } = await req.json().catch(() => ({ fileName: "document.pdf" }));

    return NextResponse.json({
      documentId,
      status: "processed",
      fileName,
      classification: {
        documentType: inferDocType(fileName),
        confidence: 0.95,
        taxYear: "2024",
      },
      extractedData: {
        fields: [
          { name: "Employer", value: "Tech Corp Inc.", confidence: 0.98 },
          { name: "Wages", value: "$125,000.00", confidence: 0.97 },
          { name: "Federal Tax Withheld", value: "$28,500.00", confidence: 0.96 },
          { name: "Social Security Wages", value: "$125,000.00", confidence: 0.95 },
        ],
      },
      processingTime: 3.2,
    });
  } catch (error) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: String(error) },
      { status: 500 }
    );
  }
}

async function extractTaxData(
  ocrText: string,
  documentType: string
): Promise<Array<{ name: string; value: string; confidence: number }>> {
  const openrouter = getOpenRouterClient();

  const response = await openrouter.chat.completions.create({
    model: MODELS.extraction,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `You are a tax document data extractor. Extract key financial fields from this ${documentType} document.
Return JSON array: [{"name": "Field Name", "value": "extracted value", "confidence": 0.0-1.0}]
Focus on: income amounts, tax withheld, employer/payer info, SSN (masked), dates, addresses, and any tax-relevant figures.
Return only the JSON array, no other text.`,
      },
      { role: "user", content: ocrText.slice(0, 6000) },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.fields || [];
}

function inferDocType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("w2") || lower.includes("w-2")) return "w2";
  if (lower.includes("1099")) return "1099-nec";
  if (lower.includes("k1") || lower.includes("k-1")) return "k1";
  if (lower.includes("1040")) return "1040";
  if (lower.includes("1065")) return "1065";
  if (lower.includes("1120")) return "1120";
  if (lower.includes("bank")) return "bank-statement";
  if (lower.includes("mortgage")) return "mortgage-statement";
  if (lower.includes("property") && lower.includes("tax")) return "property-tax";
  if (lower.includes("charit") || lower.includes("donat")) return "charitable-receipt";
  if (lower.includes("receipt") || lower.includes("expense")) return "business-expense";
  if (lower.includes("invest")) return "investment-statement";
  return "other";
}
