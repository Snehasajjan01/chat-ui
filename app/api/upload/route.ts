import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_LENGTH = 15000; // chars sent to LLM

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    const mimeType = file.type;
    const fileName = file.name.toLowerCase();
    const bytes = await file.arrayBuffer();

    // ── Images ───────────────────────────────────────────────────────────────
    if (
      mimeType.startsWith("image/") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif") ||
      fileName.endsWith(".webp")
    ) {
      const base64 = Buffer.from(bytes).toString("base64");
      return NextResponse.json({
        type: "image",
        content: base64,
        mimeType: mimeType || "image/jpeg",
        fileName: file.name,
      });
    }

    // ── PDFs ─────────────────────────────────────────────────────────────────
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      try {
        // Dynamic import to avoid build issues if not installed
        const pdfParse = (await import("pdf-parse")).default;
        const buffer = Buffer.from(bytes);
        const data = await pdfParse(buffer);
        const text = data.text.replace(/\s+/g, " ").trim();
        return NextResponse.json({
          type: "text",
          content: text.slice(0, MAX_TEXT_LENGTH),
          fileName: file.name,
          truncated: text.length > MAX_TEXT_LENGTH,
          pageCount: data.numpages,
        });
      } catch {
        return NextResponse.json(
          { error: "Failed to parse PDF. Make sure pdf-parse is installed: npm install pdf-parse" },
          { status: 500 }
        );
      }
    }

    // ── DOCX / DOC ───────────────────────────────────────────────────────────
    if (
      mimeType.includes("word") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".doc")
    ) {
      try {
        const mammoth = await import("mammoth");
        const buffer = Buffer.from(bytes);
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value.replace(/\s+/g, " ").trim();
        return NextResponse.json({
          type: "text",
          content: text.slice(0, MAX_TEXT_LENGTH),
          fileName: file.name,
          truncated: text.length > MAX_TEXT_LENGTH,
        });
      } catch {
        return NextResponse.json(
          { error: "Failed to parse DOCX. Make sure mammoth is installed: npm install mammoth" },
          { status: 500 }
        );
      }
    }

    // ── Plain text / code / markdown / CSV / JSON ────────────────────────────
    if (
      mimeType.startsWith("text/") ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".json") ||
      fileName.endsWith(".js") ||
      fileName.endsWith(".ts") ||
      fileName.endsWith(".tsx") ||
      fileName.endsWith(".jsx") ||
      fileName.endsWith(".py") ||
      fileName.endsWith(".java") ||
      fileName.endsWith(".cpp") ||
      fileName.endsWith(".c") ||
      fileName.endsWith(".go") ||
      fileName.endsWith(".rs") ||
      fileName.endsWith(".html") ||
      fileName.endsWith(".css") ||
      fileName.endsWith(".xml") ||
      fileName.endsWith(".yaml") ||
      fileName.endsWith(".yml")
    ) {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      return NextResponse.json({
        type: "text",
        content: text.slice(0, MAX_TEXT_LENGTH),
        fileName: file.name,
        truncated: text.length > MAX_TEXT_LENGTH,
      });
    }

    // ── Fallback: try reading as text ────────────────────────────────────────
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return NextResponse.json({
        type: "text",
        content: text.slice(0, MAX_TEXT_LENGTH),
        fileName: file.name,
        truncated: text.length > MAX_TEXT_LENGTH,
      });
    } catch {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType || fileName}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}