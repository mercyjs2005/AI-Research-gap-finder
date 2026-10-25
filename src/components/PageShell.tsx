import type { ReactNode } from "react";

/** Dark outer canvas with an amber glow behind a large off-white rounded container. */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[radial-gradient(ellipse_at_top,#303034_0%,#1e1e21_55%,#161618_100%)] px-3 py-3 sm:px-6 sm:py-6 lg:px-10 lg:py-10">
      <div className="relative mx-auto max-w-[1280px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-5 rounded-[3.5rem] bg-accent/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1 rounded-[2.5rem] bg-accent/40 blur-xl"
        />
        <div className="relative rounded-[1.75rem] bg-paper shadow-2xl sm:rounded-[2.25rem]">
          {children}
        </div>
      </div>
    </div>
  );
}
