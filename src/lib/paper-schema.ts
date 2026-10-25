
export const paperProfileSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    title: {
      type: "string",
    },

    authors: {
      type: "array",
      items: {
        type: "string",
      },
    },

    abstract: {
      type: "string",
    },

    research_problem: {
      type: "string",
    },

    objectives: {
      type: "array",
      items: {
        type: "string",
      },
    },

    methodology: {
      type: "string",
    },

    algorithms_models: {
      type: "array",
      items: {
        type: "string",
      },
    },

    datasets: {
      type: "array",
      items: {
        type: "string",
      },
    },

    evaluation_metrics: {
      type: "array",
      items: {
        type: "string",
      },
    },

    key_results: {
      type: "array",
      items: {
        type: "string",
      },
    },

    limitations: {
      type: "array",
      items: {
        type: "string",
      },
    },

    future_work: {
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
  },

  required: [
    "title",
    "authors",
    "abstract",
    "research_problem",
    "objectives",
    "methodology",
    "algorithms_models",
    "datasets",
    "evaluation_metrics",
    "key_results",
    "limitations",
    "future_work",
    "research_gaps",
  ],
} as const;
