import { readFile } from "node:fs/promises";
import path from "node:path";
import { start } from "workflow/api";

import { analyzeProjectWorkflow } from "@/workflows/analyze-project";

const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const projectId = body?.project_id;

    if (
      typeof projectId !== "string" ||
      !projectId.trim()
    ) {
      return Response.json(
        { error: "project_id is required." },
        { status: 400 },
      );
    }

    const manifestPath = path.join(
      uploadRoot,
      projectId,
      "manifest.json",
    );

    const manifestRaw = await readFile(
      manifestPath,
      "utf8",
    );

    const manifest = JSON.parse(manifestRaw);

    const papers = Array.isArray(manifest.papers)
      ? manifest.papers
      : [];

    if (papers.length < 2) {
      return Response.json(
        {
          error:
            "At least two papers are required for analysis.",
        },
        { status: 400 },
      );
    }

    const paperIds = papers
      .map((paper: { paper_id?: unknown }) => paper.paper_id)
      .filter(
        (paperId: unknown): paperId is string =>
          typeof paperId === "string" &&
          paperId.trim().length > 0,
      );

    if (paperIds.length < 2) {
      return Response.json(
        {
          error:
            "At least two valid paper IDs are required.",
        },
        { status: 400 },
      );
    }

    const run = await start(
      analyzeProjectWorkflow,
      [projectId, paperIds],
    );

    return Response.json({
      status: "started",
      project_id: projectId,
      paper_count: paperIds.length,
      run_id: run.runId,
    });
  } catch (error) {
    console.error(
      "Failed to start analysis workflow:",
      error,
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start analysis workflow.",
      },
      { status: 500 },
    );
  }
}