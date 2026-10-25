import { NextResponse } from "next/server";

import { findResearchGaps } from "@/lib/find-gaps";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = body?.project_id;

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

    const result = await findResearchGaps(projectId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Research gap analysis error:", error);

    return NextResponse.json(
      {
        error: {
          code: "gap_analysis_failed",
          message:
            error instanceof Error
              ? error.message
              : "Research gap analysis failed.",
        },
      },
      { status: 500 },
    );
  }
}