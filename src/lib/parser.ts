/**
 * Keyword cleaning, sanitization, and Keyword Planner raw paste parser.
 */

export function cleanSingleKeyword(text: string): string {
  if (!text) return '';
  // Remove enclosing quotes, brackets, leading/trailing punctuation
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^["'\[]+|["'\]]+$/g, '');
  // Normalize multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Parses Google Keyword Planner raw copy-pastes or CSV/tabbed data.
 * Example lines from Google Keyword Planner:
 * "oversized t shirt\t10K - 100K\tHigh\t$1.20\t$2.50"
 * "vintage graphic tee,1000,Medium,0.45"
 * Or header rows: "Keyword\tAvg. monthly searches..."
 */
export function parseKeywordPlannerPaste(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const extractedKeywords: string[] = [];

  const ignoredHeaderTerms = [
    'keyword',
    'avg. monthly searches',
    'avg monthly searches',
    'search volume',
    'competition',
    'top of page bid',
    'currency',
    'three month change',
    'yoy change',
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line is tab-separated or comma-separated
    let candidate = '';
    if (trimmed.includes('\t')) {
      const parts = trimmed.split('\t');
      candidate = parts[0]?.trim() || '';
    } else if (trimmed.includes(',') && !trimmed.startsWith('"')) {
      // Check if it's CSV-like with numeric volume in 2nd column
      const parts = trimmed.split(',');
      candidate = parts[0]?.trim() || '';
    } else {
      // Sometimes people paste lines with search volume attached like "men oversized tee 10,000"
      // Strip trailing numbers, currency, or ranges
      candidate = trimmed.replace(/(\s+[\$£€¥]?\d+[\d,\.]*(\s*-\s*[\$£€¥]?\d+[\d,\.]*)?(\s*(K|M|B))?|\s+(High|Medium|Low)|\s+[\d\.]+%?)+$/i, '');
    }

    const cleaned = cleanSingleKeyword(candidate);
    if (!cleaned) continue;

    // Skip header rows
    const lower = cleaned.toLowerCase();
    if (ignoredHeaderTerms.some((h) => lower === h || lower.startsWith(h))) {
      continue;
    }

    // Skip if it is pure number or currency
    if (/^[\$£€¥\d\s,\.\-%]+$/.test(cleaned)) {
      continue;
    }

    extractedKeywords.push(cleaned);
  }

  return extractedKeywords;
}

/**
 * Parses standard seed keywords (separated by line breaks, commas, or semicolons).
 */
export function parseSeedKeywords(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];
  // Split on newlines, commas (unless inside quotes), or semicolons
  const tokens = rawText
    .split(/[\r\n;,]+/)
    .map((k) => cleanSingleKeyword(k))
    .filter((k) => k.length > 0);

  return tokens;
}

/**
 * Combines seed keywords and expanded keywords, sanitizes and deduplicates them.
 */
export function combineAndDeduplicateKeywords(
  seedRaw: string,
  expandedRaw: string
): {
  keywords: string[];
  totalRawCount: number;
  duplicateCount: number;
} {
  const seeds = parseSeedKeywords(seedRaw);
  const expanded = parseKeywordPlannerPaste(expandedRaw);
  const combined = [...seeds, ...expanded];
  const totalRawCount = combined.length;

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const kw of combined) {
    const norm = kw.toLowerCase();
    if (!seen.has(norm)) {
      seen.add(norm);
      unique.push(kw);
    }
  }

  return {
    keywords: unique,
    totalRawCount,
    duplicateCount: totalRawCount - unique.length,
  };
}

/**
 * Parses comma-separated lists (e.g. brand variants, competitors, exclusions).
 */
export function parseCommaSeparatedList(text: string): string[] {
  if (!text || !text.trim()) return [];
  return text
    .split(/[\r\n,]+/)
    .map((s) => cleanSingleKeyword(s))
    .filter((s) => s.length > 0);
}
