/** The ten stages of the AI Research Gap Finder workflow (from the project PPT). */
export interface PipelineStage {
  id: string;
  title: string;
  description: string;
}

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  { id: "upload", title: "Upload Papers", description: "Add multiple research PDFs to a project." },
  { id: "pdf-processing", title: "PDF Processing", description: "Extract and clean the text of each paper." },
  { id: "sections", title: "Section Identification", description: "Find abstract, methodology, results, limitations and more." },
  { id: "extraction", title: "AI Information Extraction", description: "An LLM pulls structured facts from each section." },
  { id: "profiles", title: "Paper Profiles", description: "Every paper becomes a structured, comparable profile." },
  { id: "semantic", title: "Semantic Analysis", description: "Embeddings reveal related and diverging work." },
  { id: "comparison", title: "Cross-Paper Comparison", description: "Align problems, methods, datasets and metrics." },
  { id: "contradictions", title: "Contradiction Detection", description: "Flag conflicting findings and evaluation gaps." },
  { id: "gaps", title: "Research Gap Detection", description: "Surface dataset, method, application and evaluation gaps." },
  { id: "report", title: "Final Report", description: "A confidence-scored, evidence-backed gap report." },
] as const;
