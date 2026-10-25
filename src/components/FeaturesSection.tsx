const FEATURES = [
  {
    title: "Multi-paper analysis",
    body: "Work across a whole collection of roughly 5–20 papers at once instead of reading them one by one.",
  },
  {
    title: "Structured paper profiles",
    body: "Each paper is captured as a structured record of its problem, methodology, datasets, metrics, findings and limitations.",
  },
  {
    title: "Cross-paper comparison matrix",
    body: "See studies side by side to spot methodological differences, benchmark gaps and where prior work falls short.",
  },
  {
    title: "Contradiction detection",
    body: "Conflicting findings, conclusions and evaluation setups are flagged so you can ask why studies disagree.",
  },
  {
    title: "Categorized research gaps",
    body: "Dataset, methodology, application and evaluation gaps, plus unexplored areas, each backed by supporting evidence.",
  },
  {
    title: "Confidence-scored report",
    body: "The final report ranks gaps with confidence scores and suggests future research directions.",
  },
] as const;

export default function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-8 border-t border-line px-5 py-16 sm:px-10 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Built for literature review, not conversation
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            The output is a structured research report you can verify, not a chat answer you have to
            trust.
          </p>
        </div>

        <dl className="divide-y divide-line border-y border-line">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="grid gap-1 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
              <dt className="font-bold">{feature.title}</dt>
              <dd className="leading-relaxed text-muted">{feature.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
