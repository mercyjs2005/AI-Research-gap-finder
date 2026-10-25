import { PIPELINE_STAGES } from "@/lib/pipeline";
import { CheckIcon, LockIcon, SpinnerIcon } from "./icons";

interface ProcessingPipelineProps {
  completedStageId: string | null;
  currentStageId?: string | null;
}

export default function ProcessingPipeline({
  completedStageId,
  currentStageId = null,
}: ProcessingPipelineProps) {
  const completedIndex = completedStageId
    ? PIPELINE_STAGES.findIndex(
        (stage) => stage.id === completedStageId,
      )
    : -1;

  return (
    <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h3 className="text-sm font-bold text-ink">
        Processing pipeline
      </h3>

      <p className="mt-1 text-sm text-muted">
        Your papers move through each analysis stage automatically.
      </p>

      <ol className="mt-5 space-y-1">
        {PIPELINE_STAGES.map((stage, index) => {
          const isDone = index <= completedIndex;
          const isCurrent = stage.id === currentStageId;
          const isLocked =
            !isDone && !isCurrent;

          return (
            <li
              key={stage.id}
              className="flex items-start gap-3 rounded-xl px-2 py-2.5"
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isDone
                    ? "bg-success-soft text-success"
                    : isCurrent
                      ? "bg-stone-100 text-ink"
                      : "bg-stone-100 text-muted"
                }`}
              >
                {isDone ? (
                  <CheckIcon width={14} height={14} />
                ) : isCurrent ? (
                  <SpinnerIcon width={14} height={14} />
                ) : (
                  <LockIcon width={12} height={12} />
                )}
              </span>

              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    isDone || isCurrent
                      ? "text-ink"
                      : "text-muted"
                  }`}
                >
                  {stage.title}
                </p>

                <p className="text-xs text-muted">
                  {stage.description}
                </p>
              </div>

              {isDone && (
                <span className="ml-auto shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                  Done
                </span>
              )}

              {isCurrent && (
                <span className="ml-auto shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-ink">
                  Processing
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
