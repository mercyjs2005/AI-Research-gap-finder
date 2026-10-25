import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PDF_SIGNATURE = "%PDF-";
const MAX_SIGNATURE_WINDOW = 1024;
const MAX_STEM_LENGTH = 120;
const maxFiles = positiveInt(process.env.MAX_FILES, 20);
const maxFileSizeMb = positiveInt(process.env.MAX_FILE_SIZE_MB, 25);
const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));

type Paper = {
  paper_id: string;
  filename: string;
  size_bytes: number;
  status: "uploaded";
};

class UploadError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function errorResponse(error: UploadError | Error) {
  if (error instanceof UploadError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error("Unhandled upload error", error);
  return NextResponse.json(
    { error: { code: "internal_error", message: "Something went wrong on the server. Please try again." } },
    { status: 500 },
  );
}

function sanitizeFilename(name: string) {
  const basename = name.replaceAll("\\", "/").split("/").pop() ?? "";
  const withoutExtension = basename.toLowerCase().endsWith(".pdf") ? basename.slice(0, -4) : basename;
  const safe = withoutExtension
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}_.\- ()[\]]/gu, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[. ]+|[. ]+$/g, "");
  return `${(safe.slice(0, MAX_STEM_LENGTH).replace(/[. ]+$/g, "") || "paper")}.pdf`;
}

function hasPdfSignature(bytes: Uint8Array) {
  const window = new TextDecoder().decode(bytes.slice(0, MAX_SIGNATURE_WINDOW));
  return window.includes(PDF_SIGNATURE);
}

async function savePdf(file: File, destination: string, displayName: string) {
  if (file.size === 0) throw new UploadError(400, "empty_file", `"${displayName}" is empty.`);
  if (file.size > maxFileSizeBytes) {
    throw new UploadError(413, "file_too_large", `"${displayName}" is larger than the ${maxFileSizeMb} MB limit.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasPdfSignature(bytes)) {
    throw new UploadError(415, "invalid_pdf", `"${displayName}" does not look like a valid PDF file.`);
  }
  await writeFile(destination, bytes);
  return bytes.byteLength;
}

export async function POST(request: Request) {
  let projectDir: string | undefined;
  try {
    const form = await request.formData();
    const provided = form.getAll("files").filter((value): value is File => value instanceof File && Boolean(value.name));
    if (provided.length === 0) {
      throw new UploadError(400, "no_files", "No files were received. Select at least one PDF to upload.");
    }
    if (provided.length > maxFiles) {
      throw new UploadError(400, "too_many_files", `You can upload at most ${maxFiles} papers at once (you sent ${provided.length}).`);
    }

    const names: string[] = [];
    const seen = new Set<string>();
    for (const file of provided) {
      const display = sanitizeFilename(file.name);
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        throw new UploadError(415, "invalid_file_type", `"${display}" is not a PDF. Only .pdf files are accepted.`);
      }
      const key = display.toLocaleLowerCase();
      if (seen.has(key)) {
        throw new UploadError(400, "duplicate_filenames", `Duplicate filename: "${display}". Rename or remove one copy.`);
      }
      seen.add(key);
      names.push(display);
    }

    const projectId = `project_${randomBytes(4).toString("hex")}`;
    projectDir = path.join(uploadRoot, projectId);
    await mkdir(projectDir, { recursive: true });
    const papers: Paper[] = [];
    for (let index = 0; index < provided.length; index += 1) {
      const paperId = `paper_${String(index + 1).padStart(3, "0")}`;
      const size = await savePdf(provided[index], path.join(projectDir, `${paperId}.pdf`), names[index]);
      papers.push({ paper_id: paperId, filename: names[index], size_bytes: size, status: "uploaded" });
    }
    await writeFile(
      path.join(projectDir, "manifest.json"),
      JSON.stringify(
        {
          project_id: projectId,
          created_at: new Date().toISOString(),
          papers: papers.map((paper) => ({
            ...paper,
            original_filename: paper.filename,
            stored_filename: `${paper.paper_id}.pdf`,
          })),
        },
        null,
        2,
      ),
      "utf8",
    );
    return NextResponse.json({ project_id: projectId, paper_count: papers.length, papers, status: "uploaded" });
  } catch (error) {
    if (projectDir) await rm(projectDir, { recursive: true, force: true }).catch(() => undefined);
    return errorResponse(error instanceof Error ? error : new Error("Unknown upload error"));
  }
}
