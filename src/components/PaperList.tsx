"use client";

import { formatBytes } from "@/lib/format";
import { CloseIcon, PdfIcon } from "./icons";

export interface SelectedPaper {
  /** Stable key for React + removal; not sent to the backend. */
  key: string;
  file: File;
}

interface PaperListProps {
  papers: readonly SelectedPaper[];
  onRemove: (key: string) => void;
  disabled?: boolean;
}

export default function PaperList({ papers, onRemove, disabled = false }: PaperListProps) {
  if (papers.length === 0) return null;

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {papers.map(({ key, file }) => (
        <li key={key} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <PdfIcon width={18} height={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
            <p className="text-xs text-muted">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(key)}
            disabled={disabled}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-stone-100 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            aria-label={`Remove ${file.name}`}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
