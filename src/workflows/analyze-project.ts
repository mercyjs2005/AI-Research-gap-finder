import { comparePapers } from "@/lib/compare-papers";
import { analyzePaperStep } from "@/workflows/analyze-paper-step";

async function comparePapersStep(projectId: string) {
  "use step";

  return await comparePapers(projectId);
}

export async function analyzeProjectWorkflow(
  projectId: string,
  paperIds: string[],
) {
  "use workflow";

  const results = [];

  for (const paperId of paperIds) {
    const result = await analyzePaperStep(
      projectId,
      paperId,
    );

    results.push(result);
  }

  const literatureAnalysis =
    await comparePapersStep(projectId);

  return {
    project_id: projectId,
    papers: results,
    comparison: literatureAnalysis.comparison,
    gaps: literatureAnalysis.gap_analysis,
    status: "completed",
  };
}