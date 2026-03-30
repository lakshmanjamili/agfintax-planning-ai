// =============================================================================
// Azure Document Intelligence — Tax Document Processing
// =============================================================================
// Uses specialized prebuilt models for tax forms (W-2, 1099, invoices)
// Falls back to general layout model for unrecognized documents

const ENDPOINT = process.env.AZURE_DOCINTEL_ENDPOINT || "";
const API_KEY = process.env.AZURE_DOCINTEL_KEY || "";
const API_VERSION = process.env.AZURE_DOCINTEL_API_VERSION || "2024-02-29-preview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OcrResult {
  text: string;
  pages: number;
  confidence: number;
  tables: Array<{
    rows: number;
    columns: number;
    cells: Array<{ rowIndex: number; columnIndex: number; content: string }>;
  }>;
}

export interface TaxDocumentResult {
  documentType: string;
  modelUsed: string;
  ocrText: string;
  confidence: number;
  pages: number;
  fields: Array<{ name: string; value: string; confidence: number }>;
  tables: OcrResult["tables"];
  rawAnalyzeResult?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Model Selection — picks the best Azure model for each document type
// ---------------------------------------------------------------------------

// Azure Document Intelligence prebuilt models for tax documents
const TAX_DOCUMENT_MODELS: Record<string, string> = {
  // Prebuilt specialized models
  "w2":              "prebuilt-tax.us.w2",
  "1099-nec":        "prebuilt-tax.us.1099NEC",  // Available in preview
  "1099-int":        "prebuilt-tax.us.1099Int",
  "1099-div":        "prebuilt-tax.us.1099Div",
  "1099-misc":       "prebuilt-tax.us.1099MISC",
  "1099-r":          "prebuilt-tax.us.1099R",
  "1099-k":          "prebuilt-tax.us.1099K",
  "1099-b":          "prebuilt-tax.us.1099B",
  "1098":            "prebuilt-tax.us.1098",
  "1098-e":          "prebuilt-tax.us.1098E",
  "1098-t":          "prebuilt-tax.us.1098T",
  "invoice":         "prebuilt-invoice",
  "receipt":         "prebuilt-receipt",
  "id":              "prebuilt-idDocument",
  // Fallback for everything else
  "default":         "prebuilt-layout",
};

/**
 * Select the best Azure model based on document type hint
 */
function selectModel(documentType: string): string {
  const type = documentType.toLowerCase().trim();

  // Direct match
  if (TAX_DOCUMENT_MODELS[type]) return TAX_DOCUMENT_MODELS[type];

  // Fuzzy match
  if (type.includes("w-2") || type.includes("w2")) return TAX_DOCUMENT_MODELS["w2"];
  if (type.includes("1099-nec") || type.includes("1099nec")) return TAX_DOCUMENT_MODELS["1099-nec"];
  if (type.includes("1099-int")) return TAX_DOCUMENT_MODELS["1099-int"];
  if (type.includes("1099-div")) return TAX_DOCUMENT_MODELS["1099-div"];
  if (type.includes("1099-misc")) return TAX_DOCUMENT_MODELS["1099-misc"];
  if (type.includes("1099-r")) return TAX_DOCUMENT_MODELS["1099-r"];
  if (type.includes("1099-k")) return TAX_DOCUMENT_MODELS["1099-k"];
  if (type.includes("1099-b")) return TAX_DOCUMENT_MODELS["1099-b"];
  if (type.includes("1098-e")) return TAX_DOCUMENT_MODELS["1098-e"];
  if (type.includes("1098-t")) return TAX_DOCUMENT_MODELS["1098-t"];
  if (type.includes("1098")) return TAX_DOCUMENT_MODELS["1098"];
  if (type.includes("1099")) return TAX_DOCUMENT_MODELS["1099-nec"]; // Default 1099
  if (type.includes("invoice")) return TAX_DOCUMENT_MODELS["invoice"];
  if (type.includes("receipt")) return TAX_DOCUMENT_MODELS["receipt"];

  return TAX_DOCUMENT_MODELS["default"];
}

// ---------------------------------------------------------------------------
// Core Analysis Functions
// ---------------------------------------------------------------------------

/**
 * Analyze a tax document using the best available Azure model
 */
export async function analyzeTaxDocument(
  fileBuffer: ArrayBuffer,
  contentType: string,
  documentTypeHint?: string
): Promise<TaxDocumentResult> {
  if (!ENDPOINT || !API_KEY) {
    throw new Error("Azure Document Intelligence credentials not configured");
  }

  const model = selectModel(documentTypeHint || "default");
  const baseUrl = ENDPOINT.replace(/\/$/, "");

  // Try specialized model first, fall back to layout
  let analyzeResult: Record<string, unknown>;
  let modelUsed = model;

  try {
    analyzeResult = await runAnalysis(baseUrl, model, fileBuffer, contentType);
  } catch (err) {
    // If specialized model fails, fall back to general layout
    if (model !== "prebuilt-layout") {
      console.warn(`Specialized model ${model} failed, falling back to prebuilt-layout:`, err);
      modelUsed = "prebuilt-layout";
      analyzeResult = await runAnalysis(baseUrl, "prebuilt-layout", fileBuffer, contentType);
    } else {
      throw err;
    }
  }

  return parseResult(analyzeResult, modelUsed, documentTypeHint || "unknown");
}

/**
 * General layout analysis — processes ALL pages
 * If Azure free tier limits to 2 pages, automatically chunks through the rest
 */
export async function analyzeDocument(
  fileBuffer: ArrayBuffer,
  contentType: string
): Promise<OcrResult> {
  if (!ENDPOINT || !API_KEY) {
    throw new Error("Azure Document Intelligence credentials not configured");
  }

  const baseUrl = ENDPOINT.replace(/\/$/, "");

  // First pass — try all pages at once
  const result = await runAnalysis(baseUrl, "prebuilt-layout", fileBuffer, contentType);
  const firstResult = parseOcrResult(result);

  // Check if Azure truncated (free tier = 2 pages)
  // If the PDF is large (>100KB) but we only got ≤2 pages, chunk through the rest
  const fileSizeKB = fileBuffer.byteLength / 1024;
  if (firstResult.pages <= 2 && fileSizeKB > 100) {
    console.log(`Azure returned only ${firstResult.pages} pages for a ${fileSizeKB.toFixed(0)}KB file — chunking remaining pages`);

    let allText = firstResult.text;
    let allPages = firstResult.pages;
    let allConfidence = firstResult.confidence * firstResult.pages;
    const allTables = [...firstResult.tables];

    // Process pages in chunks of 2 (free tier limit)
    let startPage = 3;
    const maxPage = 100; // safety limit
    let emptyCount = 0;

    while (startPage <= maxPage && emptyCount < 2) {
      const endPage = startPage + 1;
      try {
        console.log(`  Chunking pages ${startPage}-${endPage}...`);
        const chunkResult = await runAnalysisWithPages(baseUrl, "prebuilt-layout", fileBuffer, contentType, `${startPage}-${endPage}`);
        const chunk = parseOcrResult(chunkResult);

        if (chunk.pages === 0 || chunk.text.trim().length === 0) {
          emptyCount++;
          startPage += 2;
          continue;
        }

        emptyCount = 0;
        allText += "\n\n" + chunk.text;
        allPages += chunk.pages;
        allConfidence += chunk.confidence * chunk.pages;
        allTables.push(...chunk.tables);
        console.log(`  Pages ${startPage}-${endPage}: +${chunk.text.length} chars (total: ${allText.length})`);
      } catch (err) {
        console.log(`  Pages ${startPage}-${endPage}: done (${err instanceof Error ? err.message : "no more pages"})`);
        break;
      }
      startPage += 2;
    }

    console.log(`Azure OCR chunking complete: ${allPages} total pages, ${allText.length} total chars`);
    return {
      text: allText,
      pages: allPages,
      confidence: allPages > 0 ? allConfidence / allPages : 0,
      tables: allTables,
    };
  }

  return firstResult;
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

async function runAnalysisWithPages(
  baseUrl: string,
  model: string,
  fileBuffer: ArrayBuffer,
  contentType: string,
  pages: string
): Promise<Record<string, unknown>> {
  const outputFormat = model === "prebuilt-layout" ? "&outputContentFormat=markdown" : "";
  const analyzeUrl = `${baseUrl}/documentintelligence/documentModels/${model}:analyze?api-version=${API_VERSION}${outputFormat}&pages=${pages}`;

  const analyzeResponse = await fetch(analyzeUrl, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": API_KEY,
      "Content-Type": contentType,
    },
    body: fileBuffer,
  });

  if (!analyzeResponse.ok) {
    const error = await analyzeResponse.text();
    throw new Error(`Azure analyze failed (${model} pages=${pages}): ${analyzeResponse.status} - ${error}`);
  }

  const operationLocation = analyzeResponse.headers.get("operation-location");
  if (!operationLocation) {
    throw new Error("No operation-location header");
  }

  return await pollForResult(operationLocation);
}

async function runAnalysis(
  baseUrl: string,
  model: string,
  fileBuffer: ArrayBuffer,
  contentType: string
): Promise<Record<string, unknown>> {
  const outputFormat = model === "prebuilt-layout" ? "&outputContentFormat=markdown" : "";
  const analyzeUrl = `${baseUrl}/documentintelligence/documentModels/${model}:analyze?api-version=${API_VERSION}${outputFormat}`;
  console.log(`Azure OCR: model=${model}, buffer=${(fileBuffer.byteLength / 1024).toFixed(0)}KB, contentType=${contentType}`);

  const analyzeResponse = await fetch(analyzeUrl, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": API_KEY,
      "Content-Type": contentType,
    },
    body: fileBuffer,
  });

  if (!analyzeResponse.ok) {
    const error = await analyzeResponse.text();
    throw new Error(`Azure analyze failed (${model}): ${analyzeResponse.status} - ${error}`);
  }

  const operationLocation = analyzeResponse.headers.get("operation-location");
  if (!operationLocation) {
    throw new Error("No operation-location header in Azure response");
  }

  return await pollForResult(operationLocation);
}

async function pollForResult(
  operationUrl: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<Record<string, unknown>> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(operationUrl, {
      headers: { "Ocp-Apim-Subscription-Key": API_KEY },
    });

    if (!response.ok) throw new Error(`Poll failed: ${response.status}`);
    const result = await response.json();

    if (result.status === "succeeded") {
      const ar = result.analyzeResult;
      const pageCount = (ar?.pages as unknown[])?.length || 0;
      const contentLen = ((ar?.content as string) || "").length;
      console.log(`Azure OCR complete: ${pageCount} pages extracted, ${contentLen} chars of content`);
      return ar;
    }
    if (result.status === "failed") throw new Error(`Analysis failed: ${JSON.stringify(result.error)}`);

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("OCR polling timed out");
}

/**
 * Parse result from specialized tax document model
 * Extracts named fields (W-2 boxes, 1099 amounts, etc.)
 */
function parseResult(
  analyzeResult: Record<string, unknown>,
  modelUsed: string,
  documentType: string
): TaxDocumentResult {
  const content = (analyzeResult.content as string) || "";
  const pages = (analyzeResult.pages as Array<Record<string, unknown>>) || [];
  const documents = (analyzeResult.documents as Array<Record<string, unknown>>) || [];
  const tables = (analyzeResult.tables as Array<Record<string, unknown>>) || [];

  // Extract structured fields from specialized models
  const fields: Array<{ name: string; value: string; confidence: number }> = [];

  for (const doc of documents) {
    const docFields = (doc.fields as Record<string, Record<string, unknown>>) || {};
    for (const [fieldName, fieldData] of Object.entries(docFields)) {
      const value = extractFieldValue(fieldData);
      const confidence = (fieldData.confidence as number) || 0;
      if (value) {
        fields.push({
          name: formatFieldName(fieldName),
          value,
          confidence,
        });
      }
    }
  }

  // Calculate overall confidence
  let totalConfidence = 0;
  let wordCount = 0;
  for (const page of pages) {
    const words = (page.words as Array<{ confidence: number }>) || [];
    for (const word of words) {
      totalConfidence += word.confidence || 0;
      wordCount++;
    }
  }

  return {
    documentType,
    modelUsed,
    ocrText: content,
    confidence: wordCount > 0 ? totalConfidence / wordCount : (fields.length > 0 ? 0.95 : 0),
    pages: pages.length,
    fields,
    tables: tables.map((table) => ({
      rows: (table.rowCount as number) || 0,
      columns: (table.columnCount as number) || 0,
      cells: ((table.cells as Array<Record<string, unknown>>) || []).map((cell) => ({
        rowIndex: (cell.rowIndex as number) || 0,
        columnIndex: (cell.columnIndex as number) || 0,
        content: (cell.content as string) || "",
      })),
    })),
    rawAnalyzeResult: analyzeResult,
  };
}

function parseOcrResult(analyzeResult: Record<string, unknown>): OcrResult {
  const content = (analyzeResult.content as string) || "";
  const pages = (analyzeResult.pages as Array<Record<string, unknown>>) || [];
  const tables = (analyzeResult.tables as Array<Record<string, unknown>>) || [];

  let totalConfidence = 0;
  let wordCount = 0;
  for (const page of pages) {
    const words = (page.words as Array<{ confidence: number }>) || [];
    for (const word of words) {
      totalConfidence += word.confidence || 0;
      wordCount++;
    }
  }

  return {
    text: content,
    pages: pages.length,
    confidence: wordCount > 0 ? totalConfidence / wordCount : 0,
    tables: tables.map((table) => ({
      rows: (table.rowCount as number) || 0,
      columns: (table.columnCount as number) || 0,
      cells: ((table.cells as Array<Record<string, unknown>>) || []).map((cell) => ({
        rowIndex: (cell.rowIndex as number) || 0,
        columnIndex: (cell.columnIndex as number) || 0,
        content: (cell.content as string) || "",
      })),
    })),
  };
}

/**
 * Extract the display value from an Azure field object
 */
function extractFieldValue(field: Record<string, unknown>): string {
  if (field.valueString) return field.valueString as string;
  if (field.valueNumber !== undefined) return String(field.valueNumber);
  if (field.valueCurrency) {
    const currency = field.valueCurrency as { amount: number; currencySymbol?: string };
    return `$${currency.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
  if (field.valueDate) return field.valueDate as string;
  if (field.valueAddress) {
    const addr = field.valueAddress as Record<string, string>;
    return [addr.streetAddress, addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ");
  }
  if (field.content) return field.content as string;
  if (field.valueArray) {
    return (field.valueArray as Array<Record<string, unknown>>)
      .map((item) => extractFieldValue(item))
      .filter(Boolean)
      .join("; ");
  }
  return "";
}

/**
 * Format camelCase/PascalCase field names to readable labels
 * e.g., "employerNameAddress" → "Employer Name Address"
 */
function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, " ")
    .trim();
}
