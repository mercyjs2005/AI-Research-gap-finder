
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { gapAnalysisSchema } from "@/lib/gap-schema";
import { getGeminiClient } from "@/lib/gemini";
import { createGeminiJson } from "@/lib/gemini-request";

const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
);

export async function findResearchGaps(projectId: string) {
  const projectDir = path.join(uploadRoot, projectId);

  const comparisonPath = path.join(
    projectDir,
    "comparison-batches.json",
  );

  const comparisonRaw = await readFile(comparisonPath, "utf8");
  const comparisons = JSON.parse(comparisonRaw);

  if (!Array.isArray(comparisons) || comparisons.length === 0) {
    throw new Error(
      "No comparison results were found.",
    );
  }

  const ai = getGeminiClient();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  console.log(
    `Generating research gaps from ${comparisons.length} comparison batch(es) with Gemini...`,
  );

  const prompt = `
You are an expert systematic literature review and
research-gap analysis assistant.

You are given structured cross-paper comparisons from
a collection of research papers.

Your task is to identify meaningful research gaps supported
by the provided evidence.

IMPORTANT RULES:

1. Do not invent facts, papers, datasets, methods, or results.

2. Do not claim that something is a research gap simply
   because one paper does not mention it.

3. Prefer gaps supported by multiple papers or by explicit
   limitations, unresolved problems, future-work statements,
   conflicting findings, methodological weaknesses,
   dataset limitations, or evaluation limitations.

4. Distinguish clearly between:
   - established findings
   - limitations
   - unexplored areas
   - genuine research gaps
   - possible future research directions

5. Every research gap should have supporting papers whenever
   possible.

6. Explain WHY the evidence supports each identified gap.

7. Do not exaggerate the novelty of a gap.

8. If the supplied evidence is insufficient to establish a gap,
   say so rather than inventing one.

9. Base the analysis ONLY on the supplied comparison results.

10. Return ONLY valid JSON matching the provided schema.

--- CROSS-PAPER COMPARISONS ---

${JSON.stringify(comparisons, null, 2)}

--- END CROSS-PAPER COMPARISONS ---
  `.trim();

  const gapAnalysis =
    await createGeminiJson<Record<string, unknown>>(
      ai,
      model,
      prompt,
      gapAnalysisSchema,
    );

  const outputPath = path.join(
    projectDir,
    "research-gaps.json",
  );

  await writeFile(
    outputPath,
    JSON.stringify(gapAnalysis, null, 2),
    "utf8",
  );

  console.log(
    `Saved research-gap analysis: ${outputPath}`,
  );

  return {
    project_id: projectId,
    analysis: gapAnalysis,
    output_path: "research-gaps.json",
    status: "completed",
  };
}
