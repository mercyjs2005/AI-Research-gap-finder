export function chunkText(
  text: string,
  maxCharacters = 24000,
): string[] {
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (!cleanText) {
    return [];
  }

  const chunks: string[] = [];

  for (let start = 0; start < cleanText.length; start += maxCharacters) {
    chunks.push(cleanText.slice(start, start + maxCharacters));
  }

  return chunks;
}