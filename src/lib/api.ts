import type { UploadResponse } from "./types";

export const API_URL = "";

/** An error whose message is safe and helpful to show directly to the user. */
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUploadResponse(value: unknown): value is UploadResponse {
  if (!isRecord(value)) return false;
  if (typeof value.project_id !== "string") return false;
  if (typeof value.paper_count !== "number") return false;
  if (typeof value.status !== "string") return false;
  if (!Array.isArray(value.papers)) return false;
  return value.papers.every(
    (paper) =>
      isRecord(paper) &&
      typeof paper.paper_id === "string" &&
      typeof paper.filename === "string" &&
      typeof paper.status === "string" &&
      (paper.size_bytes === undefined || typeof paper.size_bytes === "number"),
  );
}

function fallbackMessage(status: number): string {
  if (status === 413) return "The upload is too large. Remove some files and try again.";
  if (status >= 500) return "The server ran into a problem. Please try again in a moment.";
  return "The upload could not be completed. Please check your files and try again.";
}

async function readApiError(response: Response): Promise<ApiError> {
  let code = "upload_failed";
  let message = fallbackMessage(response.status);

  try {
    const body: unknown = await response.json();
    if (isRecord(body) && isRecord(body.error) && typeof body.error.message === "string") {
      message = body.error.message;
      if (typeof body.error.code === "string") code = body.error.code;
    } else if (isRecord(body) && typeof body.detail === "string") {
      message = body.detail;
    }
  } catch {
    // Response body was not JSON; keep the fallback message.
  }

  return new ApiError(message, code, response.status);
}

/** Upload PDFs to the Next.js route. Files are sent under the multipart field "files". */
export async function uploadPapers(files: File[]): Promise<UploadResponse> {
  if (files.length === 0) {
    throw new ApiError("Select at least one PDF before starting.", "no_files");
  }

  const form = new FormData();
  for (const file of files) {
    form.append("files", file, file.name);
  }

  let response: Response;
  try {
    // No Content-Type header: the browser sets the multipart boundary itself.
    response = await fetch("/api/upload", { method: "POST", body: form });
  } catch {
    throw new ApiError(
      "Could not reach the analysis server. Make sure the Next.js app is running, then try again.",
      "network_error",
    );
  }

  if (!response.ok) {
    throw await readApiError(response);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("The server sent an unreadable response. Please try again.", "malformed_response");
  }

  if (!isUploadResponse(data)) {
    throw new ApiError("The server sent an unexpected response. Please try again.", "malformed_response");
  }

  return data;
}
