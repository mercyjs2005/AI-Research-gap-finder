
import { GoogleGenAI } from "@google/genai";

type JsonSchema = {
  type?: string;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
};

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 10_000;
const REQUEST_TIMEOUT_MS = 120_000;

function matchesType(value: unknown, type: string | undefined): boolean {
  if (!type) return true;

  switch (type) {
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "string":
      return typeof value === "string";
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    default:
      return true;
  }
}

function validateJsonSchema(
  value: unknown,
  schema: JsonSchema,
  path = "$",
): string | null {
  if (!matchesType(value, schema.type)) {
    return `${path} must be ${schema.type}.`;
  }

  if (schema.enum && !schema.enum.some((item) => item === value)) {
    return `${path} must be one of the allowed values.`;
  }

  if (
    schema.type === "object" &&
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    const record = value as Record<string, unknown>;
    const properties = schema.properties ?? {};

    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in record)) {
        return `${path}.${requiredKey} is required.`;
      }
    }

    for (const [key, childValue] of Object.entries(record)) {
      const childSchema = properties[key];

      if (!childSchema) {
        if (schema.additionalProperties === false) {
          return `${path}.${key} is not allowed.`;
        }

        if (typeof schema.additionalProperties === "object") {
          const error = validateJsonSchema(
            childValue,
            schema.additionalProperties,
            `${path}.${key}`,
          );
          if (error) return error;
        }

        continue;
      }

      const error = validateJsonSchema(
        childValue,
        childSchema,
        `${path}.${key}`,
      );
      if (error) return error;
    }
  }

  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    for (let index = 0; index < value.length; index += 1) {
      const error = validateJsonSchema(
        value[index],
        schema.items,
        `${path}[${index}]`,
      );
      if (error) return error;
    }
  }

  return null;
}

type ProviderErrorDetails = {
  status?: number;
  code?: string | number;
  message?: string;
  error?: {
    code?: string | number;
    message?: string;
    status?: string;
  };
};

function getErrorDetails(error: unknown): {
  status?: number;
  code: string;
  message: string;
  normalized: string;
} {
  const details =
    typeof error === "object" && error !== null
      ? (error as ProviderErrorDetails)
      : {};

  const status =
    typeof details.status === "number"
      ? details.status
      : undefined;

  const code = String(details.code ?? details.error?.code ?? "");
  const message =
    details.message ??
    details.error?.message ??
    String(error);

  return {
    status,
    code,
    message,
    normalized: `${code} ${message} ${details.error?.status ?? ""}`.toLowerCase(),
  };
}

function isQuotaExhausted(error: unknown): boolean {
  const { status, normalized } = getErrorDetails(error);

  return (
    /resource_exhausted|quota.*exceed|exceeded.*quota|billing.*(disabled|account)|insufficient.*quota/.test(
      normalized,
    ) ||
    (status === 429 &&
      /quota exceeded|limit: 0|billing/.test(normalized))
  );
}

function isRetryable(error: unknown): boolean {
  const { status, normalized } = getErrorDetails(error);

  if (isQuotaExhausted(error)) return false;

  if (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return true;
  }

  return /temporarily unavailable|internal server error|deadline_exceeded|timed out|timeout|connection reset|fetch failed|econnreset/.test(
    normalized,
  );
}

function getProviderError(error: unknown, model: string): Error {
  const { status, normalized, message } = getErrorDetails(error);

  if (isQuotaExhausted(error)) {
    return new Error(
      `Gemini quota appears exhausted. Check your Google AI Studio project, model quota, and billing. Details: ${message}`,
    );
  }

  if (
    status === 429 ||
    /rate.?limit|too many requests/.test(normalized)
  ) {
    return new Error(
      `Gemini rate limit reached. Wait before retrying, or reduce concurrent requests. Details: ${message}`,
    );
  }

  if (
    status === 401 ||
    status === 403 ||
    /api key not valid|api_key_invalid|permission denied|unauthorized/.test(
      normalized,
    )
  ) {
    return new Error(
      "Gemini authentication or permission failed. Check GEMINI_API_KEY and confirm the project has Gemini API access.",
    );
  }

  if (
    status === 404 ||
    /model.*not found|not supported for generatecontent/.test(normalized)
  ) {
    return new Error(
      `Gemini model "${model}" is unavailable. Set GEMINI_MODEL to a supported model.`,
    );
  }

  if (/deadline_exceeded|timed out|timeout|request_timeout/.test(normalized)) {
    return new Error(
      `Gemini request timed out or exceeded its ${REQUEST_TIMEOUT_MS / 1000}-second limit. Try again later or analyze fewer papers at once.`,
    );
  }

  return new Error(
    `Gemini API request failed${status ? ` (HTTP ${status})` : ""}. Details: ${message}`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `request_timeout: Gemini request exceeded ${timeoutMs / 1000} seconds.`,
        ),
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export async function createGeminiJson<T>(
  ai: GoogleGenAI,
  model: string,
  contents: string,
  responseSchema: Record<string, unknown>,
): Promise<T> {
  let response;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();

    console.log(
      `[Gemini] Starting request: model=${model}, attempt=${attempt}/${MAX_ATTEMPTS}, inputChars=${contents.length}`,
    );

    try {
      response = await withTimeout(
        ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: responseSchema,
          },
        }),
        REQUEST_TIMEOUT_MS,
      );

      console.log(
        `[Gemini] Request completed in ${(
          (Date.now() - startedAt) /
          1000
        ).toFixed(1)}s`,
      );

      break;
    } catch (error) {
      const finalAttempt = attempt === MAX_ATTEMPTS;
      const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
      const details = getErrorDetails(error);

      console.error(
        `[Gemini] Request failed after ${elapsedSeconds}s: ` +
          `attempt=${attempt}/${MAX_ATTEMPTS}, ` +
          `status=${details.status ?? "unknown"}, ` +
          `message=${details.message}`,
      );

      if (isQuotaExhausted(error)) {
        throw getProviderError(error, model);
      }

      if (!isRetryable(error) || finalAttempt) {
        throw getProviderError(error, model);
      }

      const delay = Math.min(
        BASE_DELAY_MS * 2 ** (attempt - 1),
        MAX_DELAY_MS,
      );

      console.warn(
        `[Gemini] Temporary failure. Retry ${attempt + 1}/${MAX_ATTEMPTS} in ${delay / 1000}s.`,
      );

      await sleep(delay);
    }
  }

  if (!response) {
    throw new Error("Gemini did not return a response.");
  }

  const responseText = response.text?.trim();

  if (!responseText) {
    throw new Error(
      "Gemini returned an empty response. Retry the request.",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Gemini returned invalid JSON. Retry the request.",
    );
  }

  const validationError = validateJsonSchema(
    parsed,
    responseSchema as JsonSchema,
  );

  if (validationError) {
    throw new Error(
      `Gemini's JSON response did not match the required schema: ${validationError}`,
    );
  }

  return parsed as T;
}
