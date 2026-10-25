
"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { ApiError, uploadPapers } from "@/lib/api";
import { MAX_FILES, RECOMMENDED_MIN_FILES } from "@/lib/config";
import { pluralize } from "@/lib/format";
import type { UploadResponse } from "@/lib/types";
import { buttonClasses } from "@/lib/ui";
import { validateSelection } from "@/lib/validation";

import CopyableId from "./CopyableId";
import {
  AlertIcon,
  ArrowRightIcon,
  SpinnerIcon,
} from "./icons";
import PaperList, { type SelectedPaper } from "./PaperList";
import ProcessingPipeline from "./ProcessingPipeline";
import UploadZone from "./UploadZone";

type Status =
  | "idle"
  | "uploading"
  | "processing"
  | "analyzing"
  | "comparing"
  | "finding-gaps"
  | "done"
  | "error";

interface PaperAnalysis {
  paper_id: string;
  profile?: unknown;
  [key: string]: unknown;
}

interface AnalysisResult {
  project_id: string;
  papers: PaperAnalysis[];
  comparison: unknown;
  gaps: unknown;
  status: string;
}

interface WorkflowStatusResponse {
  status: "running" | "completed" | "failed";
  result?: AnalysisResult;
  error?: string;
}

async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message ??
      data?.error ??
      "The analysis request failed.";

    throw new Error(
      typeof message === "string"
        ? message
        : "The analysis request failed.",
    );
  }

  return data as T;
}

async function getWorkflowStatus(
  runId: string,
): Promise<WorkflowStatusResponse> {
  const response = await fetch(
    `/api/analyze-status?run_id=${encodeURIComponent(runId)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message ??
      data?.error ??
      "Failed to get workflow status.";

    throw new Error(
      typeof message === "string"
        ? message
        : "Failed to get workflow status.",
    );
  }

  return data as WorkflowStatusResponse;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// -----------------------------------------
// RESULT FORMATTING
// -----------------------------------------

function formatLabel(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/^./, (character) =>
      character.toUpperCase(),
    );
}

function ResultValue({
  value,
  depth = 0,
}: {
  value: unknown;
  depth?: number;
}) {
  if (value === null || value === undefined) {
    return (
      <p className="text-sm text-muted">
        No data returned.
      </p>
    );
  }

  if (typeof value === "string") {
    return (
      <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-ink">
        {value}
      </p>
    );
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return (
      <p className="text-sm leading-7 text-ink">
        {String(value)}
      </p>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <p className="text-sm text-muted">
          No items returned.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            key={index}
            className={
              depth < 2
                ? "rounded-xl border border-line bg-white p-4"
                : "border-l-2 border-line pl-4"
            }
          >
            {typeof item === "object" &&
              item !== null && (
                <p className="mb-2 text-xs font-semibold text-muted">
                  Item {index + 1}
                </p>
              )}

            <ResultValue
              value={item}
              depth={depth + 1}
            />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(
      value as Record<string, unknown>,
    );

    if (entries.length === 0) {
      return (
        <p className="text-sm text-muted">
          No details returned.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {entries.map(([key, item]) => (
          <div key={key}>
            <h4 className="mb-1 text-sm font-semibold text-ink">
              {formatLabel(key)}
            </h4>

            <ResultValue
              value={item}
              depth={depth + 1}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// -----------------------------------------
// ANALYSIS RESULTS
// -----------------------------------------

function AnalysisResults({
  analysis,
  uploadedPapers,
}: {
  analysis: AnalysisResult;
  uploadedPapers: UploadResponse["papers"];
}) {
  const downloadResults = () => {
    const blob = new Blob(
      [JSON.stringify(analysis, null, 2)],
      {
        type: "application/json",
      },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${analysis.project_id}-analysis.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-12 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">
            Research Analysis Results
          </h2>

          <p className="mt-2 text-sm text-muted">
            AI-generated findings from your uploaded
            research papers.
          </p>
        </div>

        <button
          type="button"
          onClick={downloadResults}
          className={buttonClasses("secondary", "md")}
        >
          Download Results (JSON)
        </button>
      </div>

      {/* INDIVIDUAL PAPER ANALYSIS */}

      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-ink">
            Individual Paper Analysis
          </h3>

          <p className="mt-2 text-sm text-muted">
            Detailed information extracted from each
            research paper.
          </p>
        </div>

        {analysis.papers.length > 0 ? (
          <div className="space-y-6">
            {analysis.papers.map((paper, index) => {
              const uploaded = uploadedPapers.find(
                (item) =>
                  item.paper_id === paper.paper_id,
              );

              return (
                <article
                  key={paper.paper_id || index}
                  className="rounded-xl border border-line p-5"
                >
                  <div className="mb-5 border-b border-line pb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Paper {index + 1}
                    </p>

                    <h4 className="mt-1 wrap-break-word text-lg font-bold text-ink">
                      {uploaded?.filename ??
                        paper.paper_id}
                    </h4>
                  </div>

                  <ResultValue
                    value={paper.profile ?? paper}
                  />

                  {paper.profile !== undefined &&
                    Object.keys(paper).some(
                      (key) =>
                        key !== "paper_id" &&
                        key !== "profile",
                    ) && (
                      <div className="mt-5 border-t border-line pt-4">
                        <h5 className="mb-3 font-semibold text-ink">
                          Additional Analysis Details
                        </h5>

                        <ResultValue
                          value={Object.fromEntries(
                            Object.entries(paper).filter(
                              ([key]) =>
                                key !== "paper_id" &&
                                key !== "profile",
                            ),
                          )}
                        />
                      </div>
                    )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">
            No individual paper analyses were returned.
          </p>
        )}
      </section>

      {/* CROSS-PAPER COMPARISON */}

      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-ink">
            Cross-Paper Comparison
          </h3>

          <p className="mt-2 text-sm text-muted">
            Comparative findings across the analyzed
            research papers.
          </p>
        </div>

        <ResultValue value={analysis.comparison} />
      </section>

      {/* RESEARCH GAPS */}

      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-ink">
            Identified Research Gaps
          </h3>

          <p className="mt-2 text-sm text-muted">
            Potential research opportunities identified
            by the analysis workflow.
          </p>
        </div>

        <ResultValue value={analysis.gaps} />
      </section>
    </section>
  );
}

// -----------------------------------------
// MAIN COMPONENT
// -----------------------------------------

let nextKey = 0;

export default function AnalyzeExperience() {
  const [papers, setPapers] =
    useState<SelectedPaper[]>([]);

  const [selectionErrors, setSelectionErrors] =
    useState<string[]>([]);

  const [status, setStatus] =
    useState<Status>("idle");

  const [uploadError, setUploadError] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<UploadResponse | null>(null);

  const [completedAnalysis, setCompletedAnalysis] =
    useState<AnalysisResult | null>(null);

  const [completedStageId, setCompletedStageId] =
    useState<string | null>(null);

  const [currentStageId, setCurrentStageId] =
    useState<string | null>(null);

  const errorsId = useId();

  const isBusy =
    status === "uploading" ||
    status === "processing" ||
    status === "analyzing" ||
    status === "comparing" ||
    status === "finding-gaps";

  const isDone = status === "done";

  const helperText = useMemo(() => {
    if (papers.length === 0) {
      return `Select ${RECOMMENDED_MIN_FILES}–${MAX_FILES} PDFs to get the most out of an analysis.`;
    }

    return `${pluralize(papers.length, "paper")} selected.`;
  }, [papers.length]);

  // FILE SELECTION

  function handleFilesSelected(incoming: File[]) {
    const { accepted, errors } = validateSelection(
      papers.map((p) => p.file),
      incoming,
    );

    setSelectionErrors(errors);

    if (accepted.length > 0) {
      setPapers((current) => [
        ...current,
        ...accepted.map((file) => ({
          key: `${nextKey++}`,
          file,
        })),
      ]);
    }
  }

  function handleRemove(key: string) {
    setPapers((current) =>
      current.filter((p) => p.key !== key),
    );

    setSelectionErrors([]);
  }

  // WAIT FOR BACKGROUND WORKFLOW

  async function waitForWorkflow(
    runId: string,
  ): Promise<AnalysisResult> {
    while (true) {
      const workflow =
        await getWorkflowStatus(runId);

      if (workflow.status === "failed") {
        throw new Error(
          workflow.error ??
            "The background analysis workflow failed.",
        );
      }

      if (workflow.status === "completed") {
        if (!workflow.result) {
          throw new Error(
            "The workflow completed without returning a result.",
          );
        }

        return workflow.result;
      }

      await sleep(5000);
    }
  }

  // START ANALYSIS

  async function handleStartAnalysis() {
    if (papers.length === 0) {
      setSelectionErrors([
        "Select at least one PDF before starting.",
      ]);
      return;
    }

    setStatus("uploading");
    setUploadError(null);
    setCompletedAnalysis(null);
    setResult(null);
    setCompletedStageId(null);
    setCurrentStageId("upload");

    try {
      // 1. Upload papers

      const uploadResult = await uploadPapers(
        papers.map((p) => p.file),
      );

      setResult(uploadResult);

      setCompletedStageId("upload");
      setCurrentStageId("pdf-processing");

      // 2. Process PDFs

      setStatus("processing");

      await postJson("/api/process", {
        project_id: uploadResult.project_id,
      });

      setCompletedStageId("pdf-processing");
      setCurrentStageId("profiles");

      // 3. Start background workflow

      setStatus("analyzing");

      const workflow = await postJson<{
        status: string;
        project_id: string;
        paper_count: number;
        run_id: string;
      }>("/api/analyze-all", {
        project_id: uploadResult.project_id,
      });

      if (!workflow.run_id) {
        throw new Error(
          "The analysis workflow did not return a run ID.",
        );
      }

      // 4. Wait for workflow results

      setCurrentStageId("profiles");

      const completedWorkflow =
        await waitForWorkflow(workflow.run_id);

      // 5. Save actual results

      setCompletedAnalysis(completedWorkflow);
      setCompletedStageId("gaps");
      setCurrentStageId(null);
      setStatus("done");

      console.log(
        "Analysis workflow completed:",
        completedWorkflow,
      );
    } catch (error) {
      console.error(
        "Analysis pipeline failed:",
        error,
      );

      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Something went wrong during analysis.";

      setUploadError(message);
      setStatus("error");
      setCurrentStageId(null);
    }
  }

  // RESET

  function handleReset() {
    setPapers([]);
    setSelectionErrors([]);
    setUploadError(null);
    setResult(null);
    setCompletedAnalysis(null);
    setCompletedStageId(null);
    setCurrentStageId(null);
    setStatus("idle");
  }

  // ANALYSIS COMPLETE

  if (isDone && result && completedAnalysis) {
    return (
      <div className="px-5 py-14 sm:px-10 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <span className="inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
              Analysis complete
            </span>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Research analysis completed successfully.
            </h1>

            <p className="mt-3 text-muted">
              Your papers were processed, analyzed,
              compared, and evaluated for research gaps.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted">
                Project ID
              </span>

              <CopyableId value={result.project_id} />
            </div>

            <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
              {result.papers.map((paper) => (
                <li
                  key={paper.paper_id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <span className="truncate text-sm font-medium text-ink">
                    {paper.filename}
                  </span>

                  <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
                    analyzed
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleReset}
                className={buttonClasses("secondary", "md")}
              >
                Analyze another set
              </button>

              <Link
                href="/"
                className={buttonClasses("secondary", "md")}
              >
                Back to home
              </Link>
            </div>
          </div>

          <ProcessingPipeline
            completedStageId={completedStageId}
            currentStageId={currentStageId}
          />
        </div>

        <AnalysisResults
          analysis={completedAnalysis}
          uploadedPapers={result.papers}
        />
      </div>
    );
  }

  // UPLOAD AND PROCESSING

  return (
    <div className="grid gap-8 px-5 py-14 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Analyze Research Papers
        </h1>

        <p className="mt-3 max-w-xl text-muted">
          Upload multiple research papers to identify
          patterns, contradictions, and research gaps.
        </p>

        <div className="mt-8">
          <UploadZone
            onFilesSelected={handleFilesSelected}
            disabled={isBusy}
            selectedCount={papers.length}
          />
        </div>

        <p className="mt-3 text-sm text-muted">
          {helperText}
        </p>

        {selectionErrors.length > 0 && (
          <div
            id={errorsId}
            role="alert"
            className="mt-4 space-y-1.5 rounded-xl bg-danger-soft p-4"
          >
            {selectionErrors.map((message) => (
              <p
                key={message}
                className="flex items-start gap-2 text-sm text-danger"
              >
                <AlertIcon
                  width={16}
                  height={16}
                  className="mt-0.5 shrink-0"
                />

                {message}
              </p>
            ))}
          </div>
        )}

        {papers.length > 0 && (
          <div className="mt-6">
            <PaperList
              papers={papers}
              onRemove={handleRemove}
              disabled={isBusy}
            />
          </div>
        )}

        {uploadError && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2 rounded-xl bg-danger-soft p-4 text-sm text-danger"
          >
            <AlertIcon
              width={16}
              height={16}
              className="mt-0.5 shrink-0"
            />

            <span>{uploadError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleStartAnalysis}
          disabled={isBusy || papers.length === 0}
          className={`${buttonClasses("primary", "lg")} mt-8 w-full sm:w-auto`}
        >
          {isBusy ? (
            <>
              <SpinnerIcon width={18} height={18} />

              {status === "uploading" && "Uploading…"}
              {status === "processing" && "Processing PDFs…"}
              {status === "analyzing" && "Analyzing papers…"}
              {status === "comparing" && "Comparing papers…"}
              {status === "finding-gaps" && "Finding research gaps…"}
            </>
          ) : (
            <>
              Start Analysis
              <ArrowRightIcon width={18} height={18} />
            </>
          )}
        </button>
      </div>

      <ProcessingPipeline
        completedStageId={completedStageId}
        currentStageId={currentStageId}
      />
    </div>
  );
}
