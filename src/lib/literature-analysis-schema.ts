
export const literatureAnalysisSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    comparison: {
      type: "object",
      additionalProperties: false,

      properties: {
        common_research_problems: {
          type: "array",
          items: { type: "string" },
        },

        common_methodologies: {
          type: "array",
          items: { type: "string" },
        },

        algorithm_comparison: {
          type: "array",
          items: { type: "string" },
        },

        dataset_comparison: {
          type: "array",
          items: { type: "string" },
        },

        evaluation_comparison: {
          type: "array",
          items: { type: "string" },
        },

        key_differences: {
          type: "array",
          items: { type: "string" },
        },

        contradictions: {
          type: "array",
          items: { type: "string" },
        },

        shared_limitations: {
          type: "array",
          items: { type: "string" },
        },

        unexplored_areas: {
          type: "array",
          items: { type: "string" },
        },

        research_gaps: {
          type: "array",
          items: { type: "string" },
        },

        potential_research_directions: {
          type: "array",
          items: { type: "string" },
        },
      },

      required: [
        "common_research_problems",
        "common_methodologies",
        "algorithm_comparison",
        "dataset_comparison",
        "evaluation_comparison",
        "key_differences",
        "contradictions",
        "shared_limitations",
        "unexplored_areas",
        "research_gaps",
        "potential_research_directions",
      ],
    },

    gap_analysis: {
      type: "object",
      additionalProperties: false,

      properties: {
        literature_summary: {
          type: "string",
        },

        major_common_findings: {
          type: "array",
          items: { type: "string" },
        },

        methodological_gaps: {
          type: "array",
          items: { type: "string" },
        },

        dataset_gaps: {
          type: "array",
          items: { type: "string" },
        },

        evaluation_gaps: {
          type: "array",
          items: { type: "string" },
        },

        unresolved_problems: {
          type: "array",
          items: { type: "string" },
        },

        contradictions: {
          type: "array",
          items: { type: "string" },
        },

        unexplored_areas: {
          type: "array",
          items: { type: "string" },
        },

        research_gaps: {
          type: "array",
          items: { type: "string" },
        },

        potential_research_directions: {
          type: "array",
          items: { type: "string" },
        },

        evidence: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,

            properties: {
              gap: {
                type: "string",
              },

              supporting_papers: {
                type: "array",
                items: { type: "string" },
              },

              reasoning: {
                type: "string",
              },

              classification: {
                type: "string",
                enum: [
                  "explicit_limitation",
                  "explicit_observation",
                  "explicit_future_work",
                  "design_tradeoff",
                  "inferred_research_opportunity",
                ],
              },
            },

            required: [
              "gap",
              "supporting_papers",
              "reasoning",
              "classification",
            ],
          },
        },
      },

      required: [
        "literature_summary",
        "major_common_findings",
        "methodological_gaps",
        "dataset_gaps",
        "evaluation_gaps",
        "unresolved_problems",
        "contradictions",
        "unexplored_areas",
        "research_gaps",
        "potential_research_directions",
        "evidence",
      ],
    },
  },

  required: [
    "comparison",
    "gap_analysis",
  ],
} as const;
