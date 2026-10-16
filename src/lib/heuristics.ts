import { ClassifiedKeyword, ClassificationType } from '../types';

/**
 * Intelligent client-side heuristic classifier & clusterer.
 * Provides instant zero-latency processing and serves as a reliable fallback.
 */

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'in', 'on', 'at', 'to', 'of', 'a', 'an', 'is', 'are', 'by',
  'best', 'buy', 'online', 'top', 'near', 'me', 'sale', 'shop', 'get'
]);

export function classifyKeywordsOffline(
  keywords: string[],
  brandName: string,
  brandVariants: string[] = [],
  competitors: string[] = [],
  exclusions: string[] = []
): ClassifiedKeyword[] {
  const normBrand = brandName.toLowerCase().trim();
  const normVariants = brandVariants.map((v) => v.toLowerCase().trim()).filter(Boolean);
  const normCompetitors = competitors.map((c) => c.toLowerCase().trim()).filter(Boolean);
  const normExclusions = exclusions.map((e) => e.toLowerCase().trim()).filter(Boolean);

  const defaultIrrelevantTerms = [
    'free', 'job', 'jobs', 'career', 'careers', 'salary', 'internship', 'login', 'portal',
    'wholesale', 'supplier', 'download', 'pdf', 'wikipedia', 'torrent', 'crack', 'hack'
  ];

  const results: ClassifiedKeyword[] = [];

  // 1. Initial classification
  const classifiedPool: {
    keyword: string;
    classification: ClassificationType;
    tokens: string[];
  }[] = [];

  for (const kw of keywords) {
    const lower = kw.toLowerCase();
    const tokens = lower.split(/\s+/).filter((t) => t.length > 1);

    // Rule 1: Exclusions / Irrelevant check
    const isExcluded =
      normExclusions.some((exc) => lower.includes(exc)) ||
      defaultIrrelevantTerms.some((term) => tokens.includes(term) || lower.includes(` ${term}`) || lower.startsWith(`${term} `));

    if (isExcluded) {
      classifiedPool.push({ keyword: kw, classification: 'Irrelevant', tokens });
      continue;
    }

    // Rule 2: Brand check
    const isBrand =
      (normBrand && lower.includes(normBrand)) ||
      normVariants.some((v) => lower.includes(v));

    if (isBrand) {
      classifiedPool.push({ keyword: kw, classification: 'Brand', tokens });
      continue;
    }

    // Rule 3: Competitor check
    const isCompetitor = normCompetitors.some((comp) => lower.includes(comp));
    if (isCompetitor) {
      classifiedPool.push({ keyword: kw, classification: 'Competitor', tokens });
      continue;
    }

    // Rule 4: Generic
    classifiedPool.push({ keyword: kw, classification: 'Generic', tokens });
  }

  // 2. Clustering per bucket into 4-6 themes
  const buckets: ClassificationType[] = ['Generic', 'Brand', 'Competitor'];

  for (const bucket of buckets) {
    const itemsInBucket = classifiedPool.filter((item) => item.classification === bucket);
    if (itemsInBucket.length === 0) continue;

    // Find frequent meaningful tokens (excluding stop words and brand name)
    const tokenFreq = new Map<string, number>();
    for (const item of itemsInBucket) {
      for (const token of item.tokens) {
        if (STOP_WORDS.has(token)) continue;
        if (normBrand && token.includes(normBrand)) continue;
        tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1);
      }
    }

    // Sort tokens by frequency
    const sortedTokens = Array.from(tokenFreq.entries())
      .filter(([_, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1]);

    // Pick 4 to 6 top anchor tokens to form themes
    const targetThemesCount = Math.min(6, Math.max(3, Math.ceil(itemsInBucket.length / 5)));
    const anchorTokens = sortedTokens.slice(0, targetThemesCount).map(([token]) => token);

    if (anchorTokens.length === 0) {
      anchorTokens.push('Core');
    }

    // Map each item to the best matching anchor
    for (const item of itemsInBucket) {
      let matchedAnchor = '';
      for (const anchor of anchorTokens) {
        if (item.tokens.includes(anchor)) {
          matchedAnchor = anchor;
          break;
        }
      }

      if (!matchedAnchor) {
        matchedAnchor = anchorTokens[0] || 'Core';
      }

      // Format clean readable theme title
      const capitalizedTheme =
        matchedAnchor.charAt(0).toUpperCase() + matchedAnchor.slice(1) + ' Collection';

      results.push({
        keyword: item.keyword,
        classification: bucket,
        theme: capitalizedTheme,
        themeDistinguisher: matchedAnchor.toLowerCase(),
      });
    }
  }

  // Append Irrelevant keywords
  for (const item of classifiedPool.filter((i) => i.classification === 'Irrelevant')) {
    results.push({
      keyword: item.keyword,
      classification: 'Irrelevant',
      theme: 'Account Exclusions',
      themeDistinguisher: 'exclude',
    });
  }

  return results;
}
