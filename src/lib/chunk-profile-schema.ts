export const chunkProfileSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "research_problem",
    "methodology",
    "algorithms_models",
    "datasets",
    "evaluation_metrics",
    "key_results",
    "limitations",
    "future_work",
  ],
  properties: {
    research_problem: {
      type: "string",
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
      type: "string",
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
  },
} as const;