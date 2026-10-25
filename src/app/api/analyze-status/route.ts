import { getRun } from "workflow/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const runId = url.searchParams.get("run_id");

    if (!runId) {
      return Response.json(
        {
          error: "run_id is required.",
        },
        { status: 400 },
      );
    }

    const run = getRun(runId);
    const status = await run.status;

    if (status === "completed") {
      const result = await run.returnValue;

      return Response.json({
        status: "completed",
        result,
      });
    }

   if (status === "failed") {
  let errorMessage = "The workflow failed.";

  try {
    await run.returnValue;
  } catch (error) {
    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.cause instanceof Error) {
        errorMessage += `: ${error.cause.message}`;
      }
    }
  }

  console.error("Workflow failed:", errorMessage);

  return Response.json({
    status: "failed",
    error: errorMessage,
  });
}

    return Response.json({
      status: "running",
    });
  } catch (error) {
    console.error("Failed to get workflow status:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get workflow status.",
      },
      { status: 500 },
    );
  }
}