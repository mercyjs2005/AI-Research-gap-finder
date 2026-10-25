"use client";

import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { MAX_FILES } from "@/lib/config";
import { AlertIcon, UploadIcon } from "./icons";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  selectedCount: number;
}

export default function UploadZone({ onFilesSelected, disabled = false, selectedCount }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const describedById = useId();
  const atLimit = selectedCount >= MAX_FILES;

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFilesSelected(Array.from(fileList));
    },
    [onFilesSelected],
  );

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-describedby={describedById}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:py-16 ${
        isDragActive ? "border-accent bg-accent-soft" : "border-line bg-stone-50 hover:border-ink/25"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <UploadIcon width={26} height={26} />
      </span>
      <p className="mt-5 text-lg font-bold text-ink">Drop your research papers here</p>
      <p className="mt-1.5 text-sm text-muted">or choose PDF files</p>

      <span className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-black">
        Choose Files
      </span>

      <p id={describedById} className="mt-6 text-xs text-muted">
        Upload multiple PDF research papers · up to {MAX_FILES} files
      </p>

      {atLimit && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-danger">
          <AlertIcon width={14} height={14} />
          You&apos;ve reached the {MAX_FILES}-file limit. Remove a file to add another.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        disabled={disabled}
        className="sr-only"
        onClick={(event) => {
          // Allow re-selecting the same file after removing it.
          event.currentTarget.value = "";
        }}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
