
export type EvidenceCheck = {
  claim: string;
  status: "supported" | "unsupported" | "uncertain";
  source_excerpt: string;
  reason: string;
};

export type EvidenceValidationResult = {
  total_claims: number;
  supported: number;
  unsupported: number;
  uncertain: number;
  checks: EvidenceCheck[];
};

/**
 * Checks whether important terms from a claim occur in the
 * extracted source text.
 *
 * This is a preliminary lexical check, not proof of factual truth.
 * Paraphrases may be marked uncertain even when they are correct.
 */
export function checkClaimAgainstSource(
  claim: string,
  sourceText: string,
): EvidenceCheck {
  const normalizedSource = sourceText
    .toLowerCase()
    .replace(/\s+/g, " ");

  const normalizedClaim = claim
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedClaim) {
    return {
      claim,
      status: "uncertain",
      source_excerpt: "",
      reason: "The claim is empty.",
    };
  }

  // Exact sentence match is strong lexical evidence, but does
  // not independently prove that the statement is correct.
  if (normalizedSource.includes(normalizedClaim)) {
    const index = normalizedSource.indexOf(normalizedClaim);

    return {
      claim,
      status: "supported",
      source_excerpt: sourceText.slice(
        Math.max(0, index - 100),
        Math.min(sourceText.length, index + claim.length + 200),
      ),
      reason: "The claim text appears in the extracted source.",
    };
  }

  // Check distinctive terms rather than common English words.
  const stopWords = new Set([
    "the", "and", "for", "with", "from", "that", "this",
    "into", "their", "they", "were", "was", "are", "has",
    "have", "had", "using", "used", "based", "paper",
    "model", "models", "method", "methods", "approach",
    "result", "results", "show", "shows", "study",
  ]);

  const terms = normalizedClaim
    .replace(/[^\p{L}\p{N}.[\]_-]+/gu, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 3 && !stopWords.has(term));

  if (terms.length === 0) {
    return {
      claim,
      status: "uncertain",
      source_excerpt: "",
      reason: "The claim contains too few distinctive terms to check.",
    };
  }

  const matchedTerms = terms.filter((term) =>
    normalizedSource.includes(term),
  );

  const ratio = matchedTerms.length / terms.length;

  return {
    claim,
    status: ratio >= 0.8 ? "supported" : ratio < 0.4 ? "unsupported" : "uncertain",
    source_excerpt: "",
    reason:
      `Matched ${matchedTerms.length} of ${terms.length} distinctive terms. ` +
      "Term overlap alone cannot establish whether a claim is factually correct.",
  };
}

export function validateClaimsAgainstSource(
  claims: string[],
  sourceText: string,
): EvidenceValidationResult {
  const checks = claims.map((claim) =>
    checkClaimAgainstSource(claim, sourceText),
  );

  return {
    total_claims: checks.length,
    supported: checks.filter((item) => item.status === "supported").length,
    unsupported: checks.filter((item) => item.status === "unsupported").length,
    uncertain: checks.filter((item) => item.status === "uncertain").length,
    checks,
  };
}
