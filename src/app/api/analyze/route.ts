import { NextResponse } from "next/server";

import { analyzePaper } from "@/lib/analyze-paper";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const projectId = body?.project_id;
    const paperId = body?.paper_id ?? "paper_001";

    if (
      typeof projectId !== "string" ||
      !/^project_[a-f0-9]+$/.test(projectId)
    ) {
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

    if (
      typeof paperId !== "string" ||
      !/^paper_\d+$/.test(paperId)
    ) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_paper_id",
            message: "A valid paper ID is required.",
          },
        },
        { status: 400 },
      );
    }

    const result = await analyzePaper(projectId, paperId);

    return NextResponse.json({
      project_id: projectId,
      ...result,
      status: "analyzed",
    });
  } catch (error) {
    console.error("AI analysis error:", error);

    return NextResponse.json(
      {
        error: {
          code: "analysis_failed",
          message:
            error instanceof Error
              ? error.message
              : "AI analysis failed.",
        },
      },
      { status: 500 },
    );
  }
}