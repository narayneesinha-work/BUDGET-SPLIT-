export type ClassificationType = 'Brand' | 'Generic' | 'Competitor' | 'Irrelevant';

export type MatchType = 'Exact' | 'Phrase';

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'offline';

export interface ClassifiedKeyword {
  keyword: string;
  classification: ClassificationType;
  theme: string;
  themeDistinguisher: string;
}

export interface AdGroupData {
  id: string;
  theme: string;
  themeDistinguisher: string;
  keywords: ClassifiedKeyword[];
  siblingDistinguishers: string[]; // Negative tokens from other ad groups in same campaign
}

export interface CampaignData {
  id: string;
  name: string; // e.g., "Generic - Exact" or "Generic - Phrase"
  classification: ClassificationType;
  matchType: MatchType;
  adGroups: AdGroupData[];
  campaignNegatives: string[]; // For Phrase campaign: cross-match exact negatives [keyword]
}

export interface SpreadsheetRow {
  id: string;
  campaign: string;
  adGroup: string;
  keyword: string;
  wrappedKeyword: string;
  matchType: MatchType;
  classification: ClassificationType;
  adGroupNegatives: string[]; // Array of sibling theme distinguishers
  campaignNegatives: string[]; // Array of bracketed cross-match exact negatives
}

export interface GoogleAdsEditorRow {
  Campaign: string;
  'Ad Group': string;
  Keyword: string;
  'Criterion Type': 'Exact' | 'Phrase' | 'Negative Exact' | 'Negative Phrase';
}

export interface InputFormData {
  brandName: string;
  brandVariants: string;
  competitors: string;
  seedKeywords: string;
  expandedKeywords: string;
  globalNegatives: string;
  provider: LLMProvider;
  model: string;
  apiKey: string;
}

export interface ProcessedArchitecture {
  campaigns: CampaignData[];
  spreadsheetRows: SpreadsheetRow[];
  editorRows: GoogleAdsEditorRow[];
  accountNegatives: {
    term: string;
    source: 'user_exclusion' | 'llm_irrelevant';
  }[];
  summary: {
    totalRawKeywords: number;
    totalDeduplicated: number;
    brandCount: number;
    genericCount: number;
    competitorCount: number;
    irrelevantCount: number;
    campaignsCount: number;
    adGroupsCount: number;
    crossMatchNegativesCount: number;
    crossThemeNegativesCount: number;
    totalEditorRows: number;
  };
}

export interface ProcessingStep {
  step: number;
  title: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'error';
}
