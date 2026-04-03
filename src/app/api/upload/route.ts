import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      const allowedTypes = [
        "application/pdf",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/markdown",
        "text/plain",
      ];
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isAllowed = allowedTypes.includes(file.type) || ["pdf","csv","xlsx","xls","md","txt"].includes(ext || "");

      if (!isAllowed) {
        return NextResponse.json(
          { error: `File type not supported: ${file.name}` },
          { status: 400 }
        );
      }

      if (file.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name} (max 50MB)` },
          { status: 400 }
        );
      }

      uploadedFiles.push({
        id: Math.random().toString(36).substring(2, 10),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, files: uploadedFiles });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
