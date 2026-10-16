import {
  ClassifiedKeyword,
  ClassificationType,
  MatchType,
  CampaignData,
  AdGroupData,
  SpreadsheetRow,
  GoogleAdsEditorRow,
  ProcessedArchitecture,
} from '../types';

/**
 * Deterministic Campaign Architect & Negative Keyword Sculptor
 */
export function buildCampaignArchitecture(
  classifiedKeywords: ClassifiedKeyword[],
  userGlobalExclusions: string[],
  totalRawInputCount: number,
  totalDeduplicatedCount: number
): ProcessedArchitecture {
  // 1. Separate valid keywords from Irrelevant keywords
  const validKeywords = classifiedKeywords.filter((k) => k.classification !== 'Irrelevant');
  const irrelevantKeywords = classifiedKeywords.filter((k) => k.classification === 'Irrelevant');

  // Group valid keywords by classification
  const classificationGroups = new Map<ClassificationType, ClassifiedKeyword[]>();
  for (const kw of validKeywords) {
    if (!classificationGroups.has(kw.classification)) {
      classificationGroups.set(kw.classification, []);
    }
    classificationGroups.get(kw.classification)!.push(kw);
  }

  const campaigns: CampaignData[] = [];
  const spreadsheetRows: SpreadsheetRow[] = [];
  const editorRows: GoogleAdsEditorRow[] = [];

  let crossMatchNegativesCount = 0;
  let crossThemeNegativesCount = 0;
  let totalAdGroupsCount = 0;

  // Process each classification bucket (e.g. Generic, Brand, Competitor)
  const buckets: ClassificationType[] = ['Generic', 'Brand', 'Competitor'];

  for (const bucket of buckets) {
    const bucketKeywords = classificationGroups.get(bucket);
    if (!bucketKeywords || bucketKeywords.length === 0) continue;

    // Group keywords by theme within this bucket
    const themeMap = new Map<string, { theme: string; distinguisher: string; keywords: ClassifiedKeyword[] }>();

    for (const item of bucketKeywords) {
      const themeKey = item.theme.trim() || 'General';
      if (!themeMap.has(themeKey)) {
        themeMap.set(themeKey, {
          theme: themeKey,
          distinguisher: item.themeDistinguisher?.trim() || themeKey.toLowerCase(),
          keywords: [],
        });
      }
      themeMap.get(themeKey)!.keywords.push(item);
    }

    const themesList = Array.from(themeMap.values());
    totalAdGroupsCount += themesList.length * 2; // Two campaigns (Exact & Phrase)

    // Build unique exact keyword texts for this bucket (used for Cross-Match Negatives)
    const exactKeywordSet = new Set<string>();
    for (const item of bucketKeywords) {
      exactKeywordSet.add(item.keyword.trim());
    }
    const exactNegativeStrings = Array.from(exactKeywordSet).map((kw) => `[${kw}]`);

    // Create campaigns for Exact and Phrase
    const matchTypes: MatchType[] = ['Exact', 'Phrase'];

    for (const matchType of matchTypes) {
      const campaignName = `${bucket} - ${matchType}`;
      const campaignNegatives = matchType === 'Phrase' ? exactNegativeStrings : [];

      if (matchType === 'Phrase') {
        crossMatchNegativesCount += campaignNegatives.length;
      }

      const campaignAdGroups: AdGroupData[] = [];

      // For each theme, generate ad group and compute cross-theme negatives
      for (const themeItem of themesList) {
        const adGroupId = `${campaignName}__${themeItem.theme}`;

        // Compute Cross-Theme Ad Group Negatives:
        // Aggregate distinguisher tokens of all SIBLING ad groups within this campaign
        const siblingDistinguishersSet = new Set<string>();
        for (const sibling of themesList) {
          if (sibling.theme !== themeItem.theme && sibling.distinguisher) {
            // Support comma-separated distinguishers if present
            const tokens = sibling.distinguisher.split(/[\s,]+/).filter(Boolean);
            for (const t of tokens) {
              const cleanToken = t.toLowerCase().trim();
              if (cleanToken && cleanToken !== themeItem.distinguisher.toLowerCase()) {
                siblingDistinguishersSet.add(cleanToken);
              }
            }
          }
        }

        const siblingDistinguishers = Array.from(siblingDistinguishersSet);
        crossThemeNegativesCount += siblingDistinguishers.length;

        campaignAdGroups.push({
          id: adGroupId,
          theme: themeItem.theme,
          themeDistinguisher: themeItem.distinguisher,
          keywords: themeItem.keywords,
          siblingDistinguishers,
        });

        // Generate Spreadsheet rows for each keyword in this ad group
        for (const kwItem of themeItem.keywords) {
          const rawKw = kwItem.keyword;
          const wrappedKw = matchType === 'Exact' ? `[${rawKw}]` : `"${rawKw}"`;

          spreadsheetRows.push({
            id: `${adGroupId}__${rawKw}`,
            campaign: campaignName,
            adGroup: themeItem.theme,
            keyword: rawKw,
            wrappedKeyword: wrappedKw,
            matchType,
            classification: bucket,
            adGroupNegatives: siblingDistinguishers,
            campaignNegatives,
          });

          // Google Ads Editor regular keyword row
          editorRows.push({
            Campaign: campaignName,
            'Ad Group': themeItem.theme,
            Keyword: rawKw,
            'Criterion Type': matchType,
          });
        }

        // Add Ad Group Negative rows for Google Ads Editor (Negative Phrase)
        for (const negToken of siblingDistinguishers) {
          editorRows.push({
            Campaign: campaignName,
            'Ad Group': themeItem.theme,
            Keyword: negToken,
            'Criterion Type': 'Negative Phrase',
          });
        }
      }

      // If this is Phrase campaign, append Campaign-level Negative Exact rows for Google Ads Editor
      if (matchType === 'Phrase') {
        for (const exactKw of Array.from(exactKeywordSet)) {
          editorRows.push({
            Campaign: campaignName,
            'Ad Group': '', // Campaign level negative has empty Ad Group in Google Ads Editor
            Keyword: exactKw,
            'Criterion Type': 'Negative Exact',
          });
        }
      }

      campaigns.push({
        id: campaignName,
        name: campaignName,
        classification: bucket,
        matchType,
        adGroups: campaignAdGroups,
        campaignNegatives,
      });
    }
  }

  // Aggregate Account-Level Negatives:
  // User exclusions + LLM flagged irrelevant keywords
  const accountNegativesMap = new Map<string, 'user_exclusion' | 'llm_irrelevant'>();

  for (const exc of userGlobalExclusions) {
    const clean = exc.trim().toLowerCase();
    if (clean) accountNegativesMap.set(clean, 'user_exclusion');
  }

  for (const irr of irrelevantKeywords) {
    const clean = irr.keyword.trim().toLowerCase();
    if (clean && !accountNegativesMap.has(clean)) {
      accountNegativesMap.set(clean, 'llm_irrelevant');
    }
  }

  const accountNegatives = Array.from(accountNegativesMap.entries()).map(([term, source]) => ({
    term,
    source,
  }));

  const brandCount = classifiedKeywords.filter((k) => k.classification === 'Brand').length;
  const genericCount = classifiedKeywords.filter((k) => k.classification === 'Generic').length;
  const competitorCount = classifiedKeywords.filter((k) => k.classification === 'Competitor').length;
  const irrelevantCount = irrelevantKeywords.length;

  return {
    campaigns,
    spreadsheetRows,
    editorRows,
    accountNegatives,
    summary: {
      totalRawKeywords: totalRawInputCount,
      totalDeduplicated: totalDeduplicatedCount,
      brandCount,
      genericCount,
      competitorCount,
      irrelevantCount,
      campaignsCount: campaigns.length,
      adGroupsCount: totalAdGroupsCount,
      crossMatchNegativesCount,
      crossThemeNegativesCount,
      totalEditorRows: editorRows.length,
    },
  };
}
