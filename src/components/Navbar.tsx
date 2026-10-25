"use client";

import { buttonClasses } from "@/lib/ui";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark, CloseIcon, MenuIcon } from "./icons";

const NAV_LINKS = [
  { label: "Workflow", href: "/#workflow" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
] as const;

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="relative z-20 px-5 pt-5 sm:px-10 sm:pt-7">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg text-[15px] font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <BrandMark className="h-8 w-8" />
          AI Research Gap Finder
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1.5 shadow-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-stone-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-5 top-18 rounded-2xl border border-line bg-white p-3 shadow-xl md:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium hover:bg-stone-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/analyze"
            onClick={() => setOpen(false)}
            className={`${buttonClasses("primary", "md")} mt-2 w-full`}
          >
            Start Analysis
          </Link>
        </nav>
      )}
    </header>
  );
}
