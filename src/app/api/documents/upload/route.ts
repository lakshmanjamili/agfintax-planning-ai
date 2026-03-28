import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // In production, upload to Supabase Storage
    // For now, return mock response
    const documentId = crypto.randomUUID();

    return NextResponse.json({
      id: documentId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "processing",
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
