import { NextResponse } from "next/server";

import { comparePapers } from "@/lib/compare-papers";

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

    const result = await comparePapers(projectId);

    return NextResponse.json({
      ...result,
      status: "compared",
    });
  } catch (error) {
    console.error("Paper comparison error:", error);

    return NextResponse.json(
      {
        error: {
          code: "comparison_failed",
          message:
            error instanceof Error
              ? error.message
              : "Paper comparison failed.",
        },
      },
      { status: 500 },
    );
  }
}