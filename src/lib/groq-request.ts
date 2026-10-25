import Groq from "groq-sdk";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getRetrySeconds(error: unknown): number {
  if (typeof error !== "object" || error === null) {
    return 60;
  }

  const err = error as {
    headers?: Headers;
    message?: string;
  };

  const headerValue = err.headers?.get("retry-after");

  if (headerValue) {
    const seconds = Number(headerValue);

    if (Number.isFinite(seconds)) {
      return Math.max(1, seconds);
    }
  }

  return 60;
}

export async function createGroqCompletion(
  groq: Groq,
  request: Parameters<Groq["chat"]["completions"]["create"]>[0],
  maxRetries = 2,
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await groq.chat.completions.create({
  ...request,
  stream: false,
});

return response as Groq.Chat.Completions.ChatCompletion;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      const isRequestTooLarge =
        message.includes("Request too large for model") ||
        message.includes("tokens per minute");

      if (isRequestTooLarge) {
        throw new Error(
          "Groq request exceeds the current token-per-minute limit. " +
            "Reduce the paper chunk size or completion token limit.",
        );
      }

      const isRateLimit =
        message.includes("rate_limit_exceeded") ||
        message.includes("Rate limit");

      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }

      const retrySeconds = getRetrySeconds(error);

      // Never block the application for many minutes.
      if (retrySeconds > 60) {
        throw new Error(
          `Groq rate limit requires waiting ${retrySeconds}s. ` +
            "Please retry the analysis later.",
        );
      }

      console.log(
        `Groq rate limit reached. Waiting ${retrySeconds}s ` +
          `before retry ${attempt + 1}/${maxRetries}...`,
      );

      await sleep(retrySeconds * 1000);
    }
  }

  throw new Error("Groq request failed after retries.");
}