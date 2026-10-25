
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getGeminiClient } from "@/lib/gemini";
import { createGeminiJson } from "@/lib/gemini-request";
import { literatureAnalysisSchema } from "@/lib/literature-analysis-schema";
import { verifyPaperClaims } from "@/lib/verify-paper-evidence";

const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
);

type PaperProfile = {
  paper_id: string;
  filename: string;
  profile: Record<string, unknown>;
};

type GapClassification =
  | "explicit_limitation"
  | "explicit_observation"
  | "explicit_future_work"
  | "design_tradeoff"
  | "inferred_research_opportunity";

type GapEvidence = {
  gap: string;
  supporting_papers: string[];
  reasoning: string;
  classification: GapClassification;
};

type EvidenceVerification = {
  paper_id: string;
  status: "supported" | "unsupported" | "uncertain";
  supporting_excerpt: string;
  explanation: string;
};

type VerifiedGapEvidence = GapEvidence & {
  verification_status:
    | "source_supported"
    | "partially_supported"
    | "not_source_verified";
  research_status: "not_verified_against_recent_literature";
  verification: EvidenceVerification[];
};

type GapAnalysis = {
  literature_summary: string;
  major_common_findings: string[];
  methodological_gaps: string[];
  dataset_gaps: string[];
  evaluation_gaps: string[];
  unresolved_problems: string[];
  contradictions: string[];
  unexplored_areas: string[];
  research_gaps: string[];
  potential_research_directions: string[];
  evidence: GapEvidence[];
};

type LiteratureAnalysis = {
  comparison: Record<string, unknown>;
  gap_analysis: GapAnalysis;
};

const VALID_CLASSIFICATIONS = new Set<GapClassification>([
  "explicit_limitation",
  "explicit_observation",
  "explicit_future_work",
  "design_tradeoff",
  "inferred_research_opportunity",
]);

function normalizeGap(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function deduplicateStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") continue;

    const trimmed = value.trim();
    const key = normalizeGap(trimmed);

    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function validateAndNormalizeGapAnalysis(
  analysis: GapAnalysis,
  validPaperIds: Set<string>,
): GapAnalysis {
  if (!Array.isArray(analysis.evidence)) {
    throw new Error("Research-gap evidence must be an array.");
  }

  for (const item of analysis.evidence) {
    if (
      !item ||
      typeof item.gap !== "string" ||
      typeof item.reasoning !== "string" ||
      !Array.isArray(item.supporting_papers)
    ) {
      throw new Error("Invalid research-gap evidence entry.");
    }

    if (!VALID_CLASSIFICATIONS.has(item.classification)) {
      throw new Error(
        `Invalid classification for research gap: ${item.gap}`,
      );
    }

    if (item.supporting_papers.length === 0) {
      throw new Error(
        `Research gap has no supporting papers: ${item.gap}`,
      );
    }

    const unknownIds = item.supporting_papers.filter(
      (paperId) =>
        typeof paperId !== "string" ||
        !validPaperIds.has(paperId),
    );

    if (unknownIds.length > 0) {
      throw new Error(
        `Research-gap evidence references unknown paper ID(s): ` +
          `${unknownIds.join(", ")}. Valid paper IDs: ` +
          `${[...validPaperIds].join(", ")}.`,
      );
    }
  }

  // Merge duplicate evidence while retaining supporting paper IDs.
  const evidenceByGap = new Map<string, GapEvidence>();

  for (const item of analysis.evidence) {
    const gap = item.gap.trim();
    const key = normalizeGap(gap);

    if (!key) continue;

    const existing = evidenceByGap.get(key);

    if (!existing) {
      evidenceByGap.set(key, {
        gap,
        supporting_papers: [...new Set(item.supporting_papers)],
        reasoning: item.reasoning.trim(),
        classification: item.classification,
      });
      continue;
    }

    existing.supporting_papers = [
      ...new Set([
        ...existing.supporting_papers,
        ...item.supporting_papers,
      ]),
    ];

    const oldReasoning = existing.reasoning.trim();
    const newReasoning = item.reasoning.trim();

    if (newReasoning && !oldReasoning.includes(newReasoning)) {
      existing.reasoning = [oldReasoning, newReasoning]
        .filter(Boolean)
        .join("\n\n");
    }
  }

  const evidence = [...evidenceByGap.values()];

  // Ensure every evidence-backed gap appears in the main list.
  const researchGaps = deduplicateStrings([
    ...analysis.research_gaps,
    ...evidence.map((item) => item.gap),
  ]);

  return {
    ...analysis,
    major_common_findings: deduplicateStrings(
      analysis.major_common_findings,
    ),
    methodological_gaps: deduplicateStrings(
      analysis.methodological_gaps,
    ),
    dataset_gaps: deduplicateStrings(analysis.dataset_gaps),
    evaluation_gaps: deduplicateStrings(
      analysis.evaluation_gaps,
    ),
    unresolved_problems: deduplicateStrings(
      analysis.unresolved_problems,
    ),
    contradictions: deduplicateStrings(analysis.contradictions),
    unexplored_areas: deduplicateStrings(analysis.unexplored_areas),
    research_gaps: researchGaps,
    potential_research_directions: deduplicateStrings(
      analysis.potential_research_directions,
    ),
    evidence,
  };
}

async function verifyGapEvidence(
  evidence: GapEvidence[],
  projectDir: string,
): Promise<VerifiedGapEvidence[]> {
  const verifiedEvidence: VerifiedGapEvidence[] = [];

  for (const item of evidence) {
    const checks: EvidenceVerification[] = [];

    for (const paperId of item.supporting_papers) {
      const textPath = path.join(projectDir, `${paperId}.txt`);

      let sourceText: string;

      try {
        sourceText = await readFile(textPath, "utf8");
      } catch {
        checks.push({
          paper_id: paperId,
          status: "uncertain",
          supporting_excerpt: "",
          explanation:
            "The extracted source text could not be loaded.",
        });
        continue;
      }

      try {
        const results = await verifyPaperClaims(
          [item.gap],
          sourceText,
        );

        const result = results[0];

        checks.push({
          paper_id: paperId,
          status: result?.status ?? "uncertain",
          supporting_excerpt:
            result?.supporting_excerpt ?? "",
          explanation:
            result?.explanation ??
            "The verifier returned no result.",
        });
      } catch (error) {
        console.error(
          `Evidence verification failed for ${paperId}:`,
          error,
        );

        checks.push({
          paper_id: paperId,
          status: "uncertain",
          supporting_excerpt: "",
          explanation:
            "Verification failed. Manual review is required.",
        });
      }
    }

    const supportedCount = checks.filter(
      (check) => check.status === "supported",
    ).length;

    const verificationStatus =
      checks.length > 0 && supportedCount === checks.length
        ? "source_supported"
        : supportedCount > 0
          ? "partially_supported"
          : "not_source_verified";

    verifiedEvidence.push({
      ...item,
      verification_status: verificationStatus,
      research_status: "not_verified_against_recent_literature",
      verification: checks,
    });
  }

  return verifiedEvidence;
}

export async function comparePapers(projectId: string) {
  // Validate the project ID before constructing file paths.
  if (!/^project_[a-f0-9]+$/.test(projectId)) {
    throw new Error("Invalid project ID.");
  }

  const projectDir = path.join(uploadRoot, projectId);

  // Declare output paths once and reuse them for reading and writing.
  const comparisonPath = path.join(
    projectDir,
    "comparison.json",
  );

  const gapsPath = path.join(
    projectDir,
    "research-gaps.json",
  );

  // Reuse completed results for this project.
  try {
    const [comparisonRaw, gapsRaw, manifestRaw] =
      await Promise.all([
        readFile(comparisonPath, "utf8"),
        readFile(gapsPath, "utf8"),
        readFile(
          path.join(projectDir, "manifest.json"),
          "utf8",
        ),
      ]);

    const comparison = JSON.parse(comparisonRaw);
    const gapAnalysis = JSON.parse(gapsRaw);
    const manifest = JSON.parse(manifestRaw);

    if (
      comparison &&
      typeof comparison === "object" &&
      !Array.isArray(comparison) &&
      gapAnalysis &&
      typeof gapAnalysis === "object" &&
      !Array.isArray(gapAnalysis) &&
      Array.isArray(gapAnalysis.research_gaps) &&
      Array.isArray(gapAnalysis.evidence)
    ) {
      console.log(
        `Using cached comparison and research gaps for ${projectId}.`,
      );

      return {
        project_id: projectId,
        paper_count: Array.isArray(manifest.papers)
          ? manifest.papers.length
          : undefined,
        comparison,
        comparison_path: "comparison.json",
        gap_analysis: gapAnalysis,
        gaps_path: "research-gaps.json",
        status: "completed",
        cached: true,
      };
    }
  } catch {
    // Missing or invalid cache: generate fresh results.
  }

  const manifestPath = path.join(
    projectDir,
    "manifest.json",
  );

  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  if (
    !Array.isArray(manifest.papers) ||
    manifest.papers.length < 2
  ) {
    throw new Error(
      "At least two analyzed papers are required for comparison.",
    );
  }

  const profiles: PaperProfile[] = [];

  // STEP 1: Load analyzed paper profiles.
  for (const paper of manifest.papers) {
    if (
      typeof paper.paper_id !== "string" ||
      !/^paper_[a-zA-Z0-9_-]+$/.test(paper.paper_id)
    ) {
      throw new Error("The manifest contains an invalid paper ID.");
    }

    const profilePath = path.join(
      projectDir,
      `${paper.paper_id}-profile.json`,
    );

    try {
      const profileRaw = await readFile(profilePath, "utf8");

      profiles.push({
        paper_id: paper.paper_id,
        filename:
          typeof paper.filename === "string"
            ? paper.filename
            : paper.paper_id,
        profile: JSON.parse(profileRaw),
      });
    } catch (error) {
      console.error(
        `Could not load profile for ${paper.paper_id}:`,
        error,
      );
    }
  }

  if (profiles.length < 2) {
    throw new Error(
      "At least two valid paper profiles are required. " +
        "Check that their profile JSON files exist and contain valid JSON.",
    );
  }

  const validPaperIds = new Set(
    profiles.map((paper) => paper.paper_id),
  );

  const ai = getGeminiClient();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  console.log(
    `Running comparison and gap analysis for ${profiles.length} papers with Gemini...`,
  );

  // STEP 2: Generate the comparison and research-gap analysis.
  const prompt = `
You are an expert systematic literature review and research-gap analysis assistant.

Analyze the supplied structured paper profiles and return JSON matching the provided schema.

CROSS-PAPER COMPARISON

Compare research problems, methodologies, algorithms, datasets, evaluation metrics, findings, limitations, contradictions, and potential research directions.

RESEARCH-GAP ANALYSIS

Identify explicit limitations, methodological gaps, dataset gaps, evaluation gaps, unresolved problems, unexplored areas, research gaps, and potential research directions.

CLASSIFICATIONS

Each evidence item must use exactly one classification:

- explicit_limitation: a limitation acknowledged by the authors.
- explicit_observation: a problem or behavior directly reported in experiments.
- explicit_future_work: a direction explicitly proposed by the authors.
- design_tradeoff: a documented engineering or methodological compromise.
- inferred_research_opportunity: a cautious opportunity inferred by comparing papers.

STRICT EVIDENCE RULES

1. Use only information supported by the supplied profiles.
2. Do not invent facts, results, citations, paper IDs, or research gaps.
3. Distinguish explicit limitations from inferred opportunities.
4. A paper's silence about a topic does not establish a gap.
5. Keep unrelated limitations separate.
6. Do not describe complementary approaches as empirical contradictions.
7. Every supporting_papers entry must be an exact paper_id.
8. Explain the evidence supporting each item.
9. Do not claim novelty across the entire field without a broader literature review.
10. Keep potential research directions distinct from established findings.
11. Historical limitations and proposed future work are not proof of currently unresolved gaps.
12. Do not label a limitation as shared unless both papers support it.
13. Distinguish pre-training datasets, downstream evaluation datasets, and external retrieval indexes.
14. Do not infer that two papers used the same evaluation setup merely because both mention a dataset.
15. Return only valid JSON matching the provided schema.

If the supplied profiles correspond to BERT and RAG, check the following only when supported by the profiles:

- BERT's masked-language-model pre-training and fine-tuning mismatch.
- BERT-LARGE fine-tuning instability on small datasets.
- RAG's proposed joint pre-training of retriever and generator.
- The cost of updating the RAG document encoder and index.
- Reported retrieval collapse on certain generation tasks.
- RAG's limitation concerning FEVER sentence-level evidence extraction.

Do not pretend that a profile supports a detail it does not contain. If evidence is insufficient, omit the claim.

PAPER PROFILES:

${JSON.stringify(profiles, null, 2)}

END PAPER PROFILES.
  `.trim();

  const rawAnalysis =
    await createGeminiJson<LiteratureAnalysis>(
      ai,
      model,
      prompt,
      literatureAnalysisSchema,
    );

  // STEP 3: Validate and normalize generated evidence.
  const normalizedGapAnalysis =
    validateAndNormalizeGapAnalysis(
      rawAnalysis.gap_analysis,
      validPaperIds,
    );

  // STEP 4: Verify each evidence item against its supporting source text.
  // Verification failures are recorded for review, not used to delete gaps.
  const verifiedEvidence = await verifyGapEvidence(
    normalizedGapAnalysis.evidence,
    projectDir,
  );

  const gapAnalysis = {
    ...normalizedGapAnalysis,
    evidence: verifiedEvidence,
  };

  // Keep the existing comparison output structure.
  const comparison = {
    ...rawAnalysis.comparison,
    research_gaps: gapAnalysis.research_gaps,
  };

  const literatureAnalysis = {
    ...rawAnalysis,
    comparison,
    gap_analysis: gapAnalysis,
  };

  // STEP 5: Save both outputs using the paths declared above.
  await Promise.all([
    writeFile(
      comparisonPath,
      JSON.stringify(literatureAnalysis.comparison, null, 2),
      "utf8",
    ),
    writeFile(
      gapsPath,
      JSON.stringify(literatureAnalysis.gap_analysis, null, 2),
      "utf8",
    ),
  ]);

  console.log(`Saved comparison: ${comparisonPath}`);
  console.log(`Saved research gaps: ${gapsPath}`);

  return {
    project_id: projectId,
    paper_count: profiles.length,
    comparison: literatureAnalysis.comparison,
    comparison_path: "comparison.json",
    gap_analysis: literatureAnalysis.gap_analysis,
    gaps_path: "research-gaps.json",
    status: "completed",
  };
}
