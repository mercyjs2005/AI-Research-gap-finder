import { buttonClasses } from "@/lib/ui";
import Link from "next/link";
import HeroVisual from "./HeroVisual";

export default function Hero() {
  return (
    <section className="grid items-center gap-14 px-5 pb-16 pt-14 sm:px-10 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24 lg:pt-24">
      <div>
        <h1 className="text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.1rem]">
          Turn Research Papers <br className="hidden sm:block" />
          Into Research Opportunities.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Analyze multiple research papers, compare methodologies and findings, detect contradictions,
          and uncover evidence-backed research gaps.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/analyze" className={buttonClasses("primary", "lg")}>
            Analyze Papers
          </Link>
        </div>
        <p className="mt-7 text-sm font-medium text-muted">
          Multi-paper analysis • Structured evidence • Research gap detection
        </p>
      </div>

      <HeroVisual />
    </section>
  );
}
