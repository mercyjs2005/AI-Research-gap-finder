export type PaperSection = {
  title: string;
  content: string;
};

const SECTION_PATTERNS = [
  {
    name: "Abstract",
    pattern: /^abstract$/i,
  },
  {
    name: "Introduction",
    pattern: /^(?:\d+[\.\)]?\s*)?introduction$/i,
  },
  {
    name: "Related Work",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(related work|literature review|background)$/i,
  },
  {
    name: "Methodology",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(methodology|method|methods|proposed method|approach)$/i,
  },
  {
    name: "Dataset",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(dataset|datasets|data|data collection)$/i,
  },
  {
    name: "Experimental Setup",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(experimental setup|experiments|experimental design)$/i,
  },
  {
    name: "Results",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(results|experimental results|findings)$/i,
  },
  {
    name: "Discussion",
    pattern:
      /^(?:\d+[\.\)]?\s*)?discussion$/i,
  },
  {
    name: "Limitations",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(limitations|limitations and challenges)$/i,
  },
  {
    name: "Future Work",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(future work|future research|future directions)$/i,
  },
  {
    name: "Conclusion",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(conclusion|conclusions|concluding remarks)$/i,
  },
  {
    name: "References",
    pattern:
      /^(?:\d+[\.\)]?\s*)?(references|bibliography)$/i,
  },
];

function normalizeHeading(line: string): string {
  return line
    .replace(/\s+/g, " ")
    .replace(/[:\-–—]+$/, "")
    .trim();
}

function detectSectionName(line: string): string | null {
  const normalized = normalizeHeading(line);

  for (const section of SECTION_PATTERNS) {
    if (section.pattern.test(normalized)) {
      return section.name;
    }
  }

  return null;
}

export function identifySections(
  text: string,
): PaperSection[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const sections: PaperSection[] = [];

  let currentTitle = "Document";
  let currentContent: string[] = [];

  function flushSection() {
    const content = currentContent
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (content) {
      sections.push({
        title: currentTitle,
        content,
      });
    }
  }

  for (const line of lines) {
    const detectedTitle =
      detectSectionName(line);

    if (detectedTitle) {
      flushSection();

      currentTitle = detectedTitle;
      currentContent = [];

      continue;
    }

    currentContent.push(line);
  }

  flushSection();

  return sections;
}