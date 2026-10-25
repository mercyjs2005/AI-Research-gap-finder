export const gapAnalysisSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    literature_summary: {
      type: "string",
    },

    major_common_findings: {
      type: "array",
      items: {
        type: "string",
      },
    },

    methodological_gaps: {
      type: "array",
      items: {
        type: "string",
      },
    },

    dataset_gaps: {
      type: "array",
      items: {
        type: "string",
      },
    },

    evaluation_gaps: {
      type: "array",
      items: {
        type: "string",
      },
    },

    unresolved_problems: {
      type: "array",
      items: {
        type: "string",
      },
    },

    contradictions: {
      type: "array",
      items: {
        type: "string",
      },
    },

    unexplored_areas: {
      type: "array",
      items: {
        type: "string",
      },
    },

    research_gaps: {
      type: "array",
      items: {
        type: "string",
      },
    },

    potential_research_directions: {
      type: "array",
      items: {
        type: "string",
      },
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
            items: {
              type: "string",
            },
          },
          reasoning: {
            type: "string",
          },
        },
        required: [
          "gap",
          "supporting_papers",
          "reasoning",
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
} as const;