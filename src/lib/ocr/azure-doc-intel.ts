const ENDPOINT = process.env.AZURE_DOCINTEL_ENDPOINT || "";
const API_KEY = process.env.AZURE_DOCINTEL_KEY || "";
const API_VERSION = process.env.AZURE_DOCINTEL_API_VERSION || "2024-02-29-preview";

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

export async function analyzeDocument(
  fileBuffer: ArrayBuffer,
  contentType: string
): Promise<OcrResult> {
  if (!ENDPOINT || !API_KEY) {
    throw new Error("Azure Document Intelligence credentials not configured");
  }

  const baseUrl = ENDPOINT.replace(/\/$/, "");
  const analyzeUrl = `${baseUrl}/documentintelligence/documentModels/prebuilt-layout:analyze?api-version=${API_VERSION}&outputContentFormat=markdown`;

  // Start analysis
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
    throw new Error(`Azure OCR analyze failed: ${analyzeResponse.status} - ${error}`);
  }

  const operationLocation = analyzeResponse.headers.get("operation-location");
  if (!operationLocation) {
    throw new Error("No operation-location header in Azure response");
  }

  // Poll for results
  const result = await pollForResult(operationLocation);
  return parseAnalyzeResult(result);
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

    if (!response.ok) {
      throw new Error(`Poll failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === "succeeded") {
      return result.analyzeResult;
    }

    if (result.status === "failed") {
      throw new Error(`Analysis failed: ${JSON.stringify(result.error)}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("OCR polling timed out after 60 seconds");
}

function parseAnalyzeResult(analyzeResult: Record<string, unknown>): OcrResult {
  const content = (analyzeResult.content as string) || "";
  const pages = (analyzeResult.pages as Array<Record<string, unknown>>) || [];
  const tables = (analyzeResult.tables as Array<Record<string, unknown>>) || [];

  // Calculate average confidence from pages
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
