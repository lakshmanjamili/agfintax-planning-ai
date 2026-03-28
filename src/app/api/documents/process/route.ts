import { NextRequest, NextResponse } from "next/server";
import { analyzeTaxDocument, analyzeDocument } from "@/lib/ocr/azure-doc-intel";
import { classifyDocument } from "@/lib/ai/document-classifier";
import { getOpenRouterClient, MODELS } from "@/lib/ai/openrouter";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentId = (formData.get("documentId") as string) || crypto.randomUUID();
    const documentTypeHint = (formData.get("documentType") as string) || "";

    // If file is provided, do real OCR processing
    if (file) {
      const startTime = Date.now();
      const buffer = await file.arrayBuffer();
      const contentType = file.type || "application/pdf";

      // Step 1: Determine document type from hint or filename
      const detectedType = documentTypeHint || inferDocType(file.name);
      const isSpecializedType = ["w2", "1099-nec", "1099-int", "1099-div", "1099-misc", "1099-r", "1099-k", "1099-b", "1098", "invoice", "receipt"].includes(detectedType);

      // Step 2: OCR with Azure Document Intelligence
      // Use specialized model (prebuilt-tax.us.w2, etc.) for known tax forms
      // Falls back to general layout model
      let ocrText = "";
      let ocrConfidence = 0;
      let pageCount = 0;
      let extractedFields: Array<{ name: string; value: string; confidence: number }> = [];

      try {
        if (isSpecializedType) {
          // Use specialized Azure model for W-2, 1099, etc.
          const taxResult = await analyzeTaxDocument(buffer, contentType, detectedType);
          ocrText = taxResult.ocrText;
          ocrConfidence = taxResult.confidence;
          pageCount = taxResult.pages;
          extractedFields = taxResult.fields; // Pre-extracted named fields!
          console.log(`Used Azure model: ${taxResult.modelUsed} — extracted ${taxResult.fields.length} fields`);
        } else {
          // General layout model
          const ocrResult = await analyzeDocument(buffer, contentType);
          ocrText = ocrResult.text;
          ocrConfidence = ocrResult.confidence;
          pageCount = ocrResult.pages;
        }
      } catch (ocrError) {
        console.error("Azure OCR failed, using filename fallback:", ocrError);
        ocrText = `Document: ${file.name}`;
        ocrConfidence = 0.5;
      }

      // Step 3: AI Classification (skip if we already know the type)
      let classification = {
        documentType: detectedType,
        confidence: isSpecializedType ? 0.99 : 0.8,
        taxYear: "2024" as string | null,
        description: file.name,
      };

      if (!isSpecializedType && ocrText.length > 50 && process.env.OPENROUTER_API_KEY) {
        try {
          classification = await classifyDocument(ocrText);
        } catch (classifyError) {
          console.error("Classification failed, using fallback:", classifyError);
        }
      }

      // Step 4: AI Data Extraction (only if Azure didn't already extract fields)
      if (extractedFields.length === 0 && ocrText.length > 50 && process.env.OPENROUTER_API_KEY) {
        try {
          extractedFields = await extractTaxData(ocrText, classification.documentType);
        } catch (extractError) {
          console.error("AI extraction failed:", extractError);
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
