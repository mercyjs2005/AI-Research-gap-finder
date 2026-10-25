
import { analyzePaper } from "@/lib/analyze-paper";
import { FatalError } from "workflow";

export async function analyzePaperStep(
  projectId: string,
  paperId: string,
) {
  "use step";

  try {
    return await analyzePaper(projectId, paperId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    const isQuotaExhausted =
      /quota|rate.?limit|resource_exhausted|429|billing/i.test(
        message,
      );

    if (isQuotaExhausted) {
      throw new FatalError(
        `Gemini quota or rate limit error. Check Google AI Studio. Details: ${message}`,
      );
    }

    throw error;
  }
}
