/** Shared client-side limits. Keep in sync with the Next.js route configuration. */
export const MAX_FILES = 20;
export const RECOMMENDED_MIN_FILES = 5;

const parsedSize = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB);
export const MAX_FILE_SIZE_MB =
  Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 25;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
