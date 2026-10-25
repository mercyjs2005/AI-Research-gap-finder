import { extractPdfText } from "@/lib/pdf";
import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
);

type ManifestPaper = {
  paper_id: string;
  filename: string;
  stored_filename: string;
};

type Manifest = {
  project_id: string;
  papers: ManifestPaper[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const projectId = body?.project_id;

    if (typeof projectId !== "string" || !/^project_[a-f0-9]+$/.test(projectId)) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_project_id",
            message: "A valid project ID is required.",
          },
        },
        { status: 400 },
      );
    }

    const projectDir = path.join(uploadRoot, projectId);
    const manifestPath = path.join(projectDir, "manifest.json");

    const manifestRaw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestRaw) as Manifest;

    const processedPapers = [];

    for (const paper of manifest.papers) {
      const pdfPath = path.join(projectDir, paper.stored_filename);

      const pdfBuffer = await readFile(pdfPath);

      const text = await extractPdfText(pdfBuffer);

      const textPath = path.join(
        projectDir,
        `${paper.paper_id}.txt`,
      );

      await writeFile(textPath, text, "utf8");

      processedPapers.push({
        paper_id: paper.paper_id,
        filename: paper.filename,
        characters: text.length,
        words: text.split(/\s+/).filter(Boolean).length,
        status: "processed",
      });
    }

    return NextResponse.json({
      project_id: projectId,
      paper_count: processedPapers.length,
      papers: processedPapers,
      status: "processed",
    });
  } catch (error) {
    console.error("PDF processing error:", error);

    return NextResponse.json(
      {
        error: {
          code: "processing_failed",
          message:
            error instanceof Error
              ? error.message
              : "PDF processing failed.",
        },
      },
      { status: 500 },
    );
  }
}