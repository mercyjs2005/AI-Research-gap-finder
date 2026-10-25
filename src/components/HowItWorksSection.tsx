import Link from "next/link";
import { buttonClasses } from "@/lib/ui";

const STEPS = [
  {
    title: "Upload your papers",
    body: "Drop in a set of research PDFs. They are stored together as one project.",
  },
  {
    title: "Review structured evidence",
    body: "Each paper is broken into sections and turned into a comparable profile.",
  },
  {
    title: "Read the gap report",
    body: "Comparisons, contradictions and research gaps are compiled with supporting evidence.",
  },
] as const;

const CHATBOT_LIMITS = [
  "Answers one prompt at a time",
  "No memory across a set of papers",
  "No comparison matrix or gap scoring",
];

const FINDER_STRENGTHS = [
  "Analyzes the whole collection together",
  "Evidence-linked, structured output",
  "Flags contradictions and scores gaps",
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-8 border-t border-line px-5 py-16 sm:px-10 lg:py-24">
      <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
        Three steps from a folder of PDFs to research directions
      </h2>

      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
              {index + 1}
            </span>
            <div>
              <h3 className="font-bold">{step.title}</h3>
              <p className="mt-1.5 leading-relaxed text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-7">
          <h3 className="font-bold text-muted">General-purpose chatbots</h3>
          <ul className="mt-4 space-y-2.5 text-muted">
            {CHATBOT_LIMITS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-ink p-7 text-white">
          <h3 className="font-bold">AI Research Gap Finder</h3>
          <ul className="mt-4 space-y-2.5 text-white/80">
            {FINDER_STRENGTHS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 flex flex-col items-start gap-5 rounded-3xl bg-accent-soft p-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xl font-bold tracking-tight">Ready to look for the gaps in your field?</p>
        <Link href="/analyze" className={buttonClasses("primary", "lg")}>
          Analyze Papers
        </Link>
      </div>
    </section>
  );
}
