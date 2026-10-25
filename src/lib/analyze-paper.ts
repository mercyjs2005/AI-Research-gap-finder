
import { getGeminiClient } from "@/lib/gemini";
import { createGeminiJson } from "@/lib/gemini-request";
import { paperProfileSchema } from "@/lib/paper-schema";
import { verifyPaperClaims } from "@/lib/verify-paper-evidence";
import {
  access,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
);

export async function analyzePaper(
  projectId: string,
  paperId: string,
) {
  // Validate IDs before constructing file paths.
  if (!/^project_[a-f0-9]+$/.test(projectId)) {
    throw new Error("Invalid project ID.");
  }

  if (!/^paper_[a-zA-Z0-9_-]+$/.test(paperId)) {
    throw new Error("Invalid paper ID.");
  }

  const projectDir = path.join(uploadRoot, projectId);

  const profilePath = path.join(
    projectDir,
    `${paperId}-profile.json`,
  );

  // Reuse a cached profile only if it already has an evidence audit.
  try {
    await access(profilePath);

    const existingProfileRaw = await readFile(
      profilePath,
      "utf8",
    );

    const existingProfile = JSON.parse(existingProfileRaw);

    if (existingProfile.evidence_validation) {
      console.log(`Using cached verified profile for ${paperId}.`);

      return {
        paper_id: paperId,
        chunk_count: 0,
        profile: existingProfile,
        profile_path: `${paperId}-profile.json`,
        cached: true,
      };
    }

    console.log(
      `Cached profile for ${paperId} has no evidence audit. Regenerating.`,
    );
  } catch {
    console.log(`No usable cached profile found for ${paperId}.`);
  }

  const textPath = path.join(
    projectDir,
    `${paperId}.txt`,
  );

  const paperText = await readFile(textPath, "utf8");

  if (!paperText.trim()) {
    throw new Error(`Extracted text is empty for ${paperId}.`);
  }

  console.log(`Analyzing paper ${paperId} with Gemini...`);

  const ai = getGeminiClient();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const prompt = `
You are a rigorous scientific literature extraction assistant.

Analyze the supplied research paper and return one structured
profile matching the provided JSON schema.

ACCURACY RULES

1. Extract only information supported by the paper.
2. Distinguish pre-training, fine-tuning, evaluation datasets,
   and external retrieval indexes.
3. Report results with the correct model, dataset, metric,
   and experimental conditions.
4. Separate author-acknowledged limitations, observed failures,
   design trade-offs, and explicit future work.
5. Research gaps must be cautious opportunities grounded in
   the paper. Do not claim they remain unsolved today.
6. Do not invent facts, numerical results, quotations, or citations.
7. Use empty strings or arrays when information is unavailable.
8. Keep all fields consistent with one another.
9. Return only valid JSON matching the supplied schema.

--- EXTRACTED RESEARCH PAPER ---
${paperText}
--- END EXTRACTED RESEARCH PAPER ---
  `.trim();

  const finalProfile =
    await createGeminiJson<Record<string, unknown>>(
      ai,
      model,
      prompt,
      paperProfileSchema,
    );

  // Verify important extracted claims against the source text.
  const arrayFields = [
    "datasets",
    "evaluation_metrics",
    "key_results",
    "limitations",
    "future_work",
    "research_gaps",
  ] as const;

  const claimsToVerify = arrayFields.flatMap((field) => {
    const value = finalProfile[field];

    return Array.isArray(value)
      ? value.filter(
          (item): item is string => typeof item === "string",
        )
      : [];
  });

  // Keep the request bounded and avoid sending duplicate claims.
  const uniqueClaims = [...new Set(claimsToVerify)].slice(0, 30);

  const evidenceChecks = await verifyPaperClaims(
    uniqueClaims,
    paperText,
  );

  const evidenceValidation = {
    checked_at: new Date().toISOString(),
    total_claims: evidenceChecks.length,
    supported: evidenceChecks.filter(
      (item) => item.status === "supported",
    ).length,
    unsupported: evidenceChecks.filter(
      (item) => item.status === "unsupported",
    ).length,
    uncertain: evidenceChecks.filter(
      (item) => item.status === "uncertain",
    ).length,
    checks: evidenceChecks,
  };

  const verifiedProfile = {
    ...finalProfile,
    evidence_validation: evidenceValidation,
  };

  await writeFile(
    profilePath,
    JSON.stringify(verifiedProfile, null, 2),
    "utf8",
  );

  console.log(
    `Evidence audit for ${paperId}: ` +
      `${evidenceValidation.supported} supported, ` +
      `${evidenceValidation.unsupported} unsupported, ` +
      `${evidenceValidation.uncertain} uncertain.`,
  );

  console.log(`Saved profile with evidence audit: ${profilePath}`);

  return {
    paper_id: paperId,
    chunk_count: 1,
    profile: verifiedProfile,
    profile_path: `${paperId}-profile.json`,
    cached: false,
  };
}
