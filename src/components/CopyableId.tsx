"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

export default function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser; the id is still visible to copy manually.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-lg bg-black/5 px-3 py-1.5 font-mono text-sm text-ink transition-colors hover:bg-black/10"
      aria-label={`Copy project id ${value}`}
    >
      {value}
      {copied ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
    </button>
  );
}
