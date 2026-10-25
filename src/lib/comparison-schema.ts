export const comparisonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    common_research_problems: {
      type: "array",
      items: {
        type: "string",
      },
    },

    common_methodologies: {
      type: "array",
      items: {
        type: "string",
      },
    },

    algorithm_comparison: {
      type: "array",
      items: {
        type: "string",
      },
    },

    dataset_comparison: {
      type: "array",
      items: {
        type: "string",
      },
    },

    evaluation_comparison: {
      type: "array",
      items: {
        type: "string",
      },
    },

    key_differences: {
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

    shared_limitations: {
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
} as const;