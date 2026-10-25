/**
 * Conceptual illustration of the workflow: papers -> AI analysis -> comparison -> gaps.
 * Purely decorative; it shows no data or results.
 */

function PaperCard({ label, lines }: { label: string; lines: [string, string, string] }) {
  return (
    <div className="mx-1.5 rounded-xl border border-white/10 bg-white/[0.06] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-white/80">{label}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
      </div>
      <div className="mt-3 space-y-1.5">
        {lines.map((width, index) => (
          <div key={index} className={`h-1.5 rounded-full bg-white/15 ${width}`} />
        ))}
      </div>
    </div>
  );
}

function ConvergingLines() {
  return (
    <svg
      viewBox="0 0 300 44"
      preserveAspectRatio="none"
      className="h-11 w-full text-white/30"
      aria-hidden="true"
    >
      {["M50 0 C50 26 150 18 150 44", "M150 0 L150 44", "M250 0 C250 26 150 18 150 44"].map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          className="flow-line"
        />
      ))}
    </svg>
  );
}

function VerticalConnector() {
  return (
    <svg viewBox="0 0 2 28" className="mx-auto h-7 w-0.5 text-white/30" aria-hidden="true">
      <line x1="1" y1="0" x2="1" y2="28" stroke="currentColor" strokeWidth="2" className="flow-line" />
    </svg>
  );
}

export default function HeroVisual() {
  const matrix = [
    [0, 1, 0, 0],
    [1, 0, 0, 1],
    [0, 0, 1, 0],
  ];

  return (
    <div
      role="img"
      aria-label="Illustration: three papers flow through AI analysis and comparison to produce research gaps."
      className="relative mx-auto w-full max-w-[460px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-6 -bottom-6 h-24 rounded-full bg-accent/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-[1.75rem] bg-[#19191c] p-5 shadow-2xl ring-1 ring-black/10 sm:p-6"
      >
        <div className="grid grid-cols-3">
          <PaperCard label="Paper A" lines={["w-full", "w-4/5", "w-3/5"]} />
          <PaperCard label="Paper B" lines={["w-4/5", "w-full", "w-2/3"]} />
          <PaperCard label="Paper C" lines={["w-full", "w-3/5", "w-4/5"]} />
        </div>

        <ConvergingLines />

        <div className="mx-auto flex w-fit items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-semibold text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          AI Analysis
        </div>

        <VerticalConnector />

        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <span className="text-sm font-semibold text-white">Comparison</span>
          <div className="grid grid-cols-4 gap-1.5">
            {matrix.flat().map((highlighted, index) => (
              <span
                key={index}
                className={`h-3 w-5 rounded-[4px] ${highlighted ? "bg-accent/80" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>

        <VerticalConnector />

        <div className="rounded-xl border border-accent/50 bg-accent/15 px-4 py-3">
          <span className="text-sm font-semibold text-white">Research Gaps</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Dataset", "Methodology", "Evaluation"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-accent/40 bg-black/20 px-2.5 py-0.5 text-[11px] font-medium text-white/85"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/40">Conceptual view of the analysis workflow</p>
      </div>
    </div>
  );
}
