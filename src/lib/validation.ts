import { MAX_FILES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "./config";
import { formatBytes } from "./format";

export interface SelectionResult {
  accepted: File[];
  errors: string[];
}

export function isPdf(file: Pick<File, "name" | "type">): boolean {
  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
  // Some browsers/OSes leave `type` empty; only reject when it is clearly not a PDF.
  const hasPdfType = file.type === "" || file.type === "application/pdf";
  return hasPdfExtension && hasPdfType;
}

function summarize(names: string[], max = 3): string {
  const shown = names.slice(0, max).join(", ");
  const rest = names.length - max;
  return rest > 0 ? `${shown} and ${rest} more` : shown;
}

/**
 * Validate newly chosen files against the current selection.
 * Valid files are accepted; everything else produces a friendly message.
 */
export function validateSelection(
  existing: readonly File[],
  incoming: readonly File[],
): SelectionResult {
  const accepted: File[] = [];
  const seen = new Set(existing.map((file) => file.name.toLowerCase()));

  const notPdf: string[] = [];
  const empty: string[] = [];
  const tooLarge: string[] = [];
  const duplicates: string[] = [];
  let overLimit = 0;

  for (const file of incoming) {
    if (!isPdf(file)) {
      notPdf.push(file.name);
    } else if (file.size === 0) {
      empty.push(file.name);
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      tooLarge.push(`${file.name} (${formatBytes(file.size)})`);
    } else if (seen.has(file.name.toLowerCase())) {
      duplicates.push(file.name);
    } else if (existing.length + accepted.length >= MAX_FILES) {
      overLimit += 1;
    } else {
      seen.add(file.name.toLowerCase());
      accepted.push(file);
    }
  }

  const errors: string[] = [];
  if (notPdf.length > 0) errors.push(`Only PDF files are supported. Skipped: ${summarize(notPdf)}.`);
  if (empty.length > 0) errors.push(`These files are empty and were skipped: ${summarize(empty)}.`);
  if (tooLarge.length > 0) {
    errors.push(`Each PDF must be ${MAX_FILE_SIZE_MB} MB or smaller. Skipped: ${summarize(tooLarge)}.`);
  }
  if (duplicates.length > 0) {
    errors.push(`Duplicate filenames were skipped: ${summarize(duplicates)}. Rename a file to add it again.`);
  }
  if (overLimit > 0) {
    errors.push(
      `You can upload at most ${MAX_FILES} papers. ${overLimit} ${overLimit === 1 ? "file was" : "files were"} not added.`,
    );
  }

  return { accepted, errors };
}
