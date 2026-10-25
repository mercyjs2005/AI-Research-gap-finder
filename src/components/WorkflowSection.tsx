import { PIPELINE_STAGES } from "@/lib/pipeline";

export default function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-8 border-t border-line px-5 py-16 sm:px-10 lg:py-24">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          From uploaded PDFs to a research gap report
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Every paper passes through the same ten stages, so findings stay comparable and every gap
          traces back to evidence.
        </p>
      </div>

      <ol className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
        {PIPELINE_STAGES.map((stage, index) => (
          <li key={stage.id} className="border-t border-ink/15 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-accent">{index + 1}</span>
              {index === 0 && (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                  Available now
                </span>
              )}
            </div>
            <h3 className="mt-2 text-base font-bold leading-snug">{stage.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{stage.description}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-sm text-muted">
        Stages after upload are being built one milestone at a time.
      </p>
    </section>
  );
}
