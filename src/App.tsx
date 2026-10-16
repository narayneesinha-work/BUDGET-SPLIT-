import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  FileSpreadsheet,
  GitFork,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { StatsBar } from './components/StatsBar';
import { SpreadsheetView } from './components/SpreadsheetView';
import { SummaryView } from './components/SummaryView';
import { ExportDropdown } from './components/ExportDropdown';
import {
  InputFormData,
  ProcessedArchitecture,
  ClassifiedKeyword,
} from './types';
import { SAMPLE_DATASET } from './lib/sampleData';
import {
  combineAndDeduplicateKeywords,
  parseCommaSeparatedList,
  parseSeedKeywords,
  parseKeywordPlannerPaste,
} from './lib/parser';
import { classifyKeywordsOffline } from './lib/heuristics';
import { buildCampaignArchitecture } from './lib/sculptor';

export default function App() {
  const [formData, setFormData] = useState<InputFormData>(SAMPLE_DATASET);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [architecture, setArchitecture] = useState<ProcessedArchitecture | null>(null);
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'summary'>('spreadsheet');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInputSection, setShowInputSection] = useState<boolean>(true);

  // Check health on mount to detect server-side Gemini key
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasServerGeminiKey) {
          setHasServerGeminiKey(true);
        }
      })
      .catch((err) => {
        console.warn('Health check failed:', err);
      });
  }, []);

  // Compute live keyword metrics
  const seedKeywordsList = useMemo(() => parseSeedKeywords(formData.seedKeywords), [formData.seedKeywords]);
  const expandedKeywordsList = useMemo(() => parseKeywordPlannerPaste(formData.expandedKeywords), [formData.expandedKeywords]);
  const deduplicatedSummary = useMemo(
    () => combineAndDeduplicateKeywords(formData.seedKeywords, formData.expandedKeywords),
    [formData.seedKeywords, formData.expandedKeywords]
  );

  const handleUpdateFormData = (newData: Partial<InputFormData>) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const handleLoadSample = () => {
    setFormData(SAMPLE_DATASET);
    setErrorMessage(null);
  };

  const handleExecuteArchitecture = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setProgressMessage('Step 1: Sanitizing and deduplicating raw keyword inputs...');

    try {
      // Step 1: Preprocessing & Deduplication
      const { keywords, totalRawCount, duplicateCount } = combineAndDeduplicateKeywords(
        formData.seedKeywords,
        formData.expandedKeywords
      );

      if (keywords.length === 0) {
        throw new Error('No valid keywords found after sanitizing inputs.');
      }

      const brandVariants = parseCommaSeparatedList(formData.brandVariants);
      const competitors = parseCommaSeparatedList(formData.competitors);
      const userExclusions = parseCommaSeparatedList(formData.globalNegatives);

      // Step 2: Semantic Classification & Clustering
      setProgressMessage(
        `Step 2: Performing entity classification & theme clustering on ${keywords.length} unique keywords...`
      );

      let classifiedKeywords: ClassifiedKeyword[] = [];

      if (formData.provider === 'offline') {
        // Run offline heuristics
        classifiedKeywords = classifyKeywordsOffline(
          keywords,
          formData.brandName,
          brandVariants,
          competitors,
          userExclusions
        );
      } else {
        // Call backend LLM endpoint
        try {
          const res = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              keywords,
              brandName: formData.brandName,
              brandVariants,
              competitors,
              exclusions: userExclusions,
              provider: formData.provider,
              model: formData.model,
              apiKey: formData.apiKey || undefined,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(
              errData.error || `LLM API request failed with status ${res.status}`
            );
          }

          const data = await res.json();
          if (data && Array.isArray(data.keywords)) {
            classifiedKeywords = data.keywords;
          } else {
            throw new Error('Invalid response structure from LLM endpoint.');
          }
        } catch (apiErr: any) {
          console.warn('Remote LLM call failed, engaging intelligent fallback engine:', apiErr);
          // Defensive fallback so the user is never stuck:
          classifiedKeywords = classifyKeywordsOffline(
            keywords,
            formData.brandName,
            brandVariants,
            competitors,
            userExclusions
          );
          setErrorMessage(
            `Notice: Remote LLM (${apiErr.message}) encountered an issue. Automatically switched to the Intelligent Heuristics Engine to sculpt your campaigns without delay.`
          );
        }
      }

      // Step 3: Programmatic Negative Keyword Sculpting & Mapping
      setProgressMessage('Step 3: Generating Alpha/Beta Exact/Phrase campaigns & negative sculpts...');
      const processed = buildCampaignArchitecture(
        classifiedKeywords,
        userExclusions,
        totalRawCount,
        keywords.length
      );

      setArchitecture(processed);
      setShowInputSection(false); // Collapse form to focus on results
      setActiveTab('spreadsheet');
    } catch (err: any) {
      console.error('Architecture generation failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during campaign generation.');
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        onLoadSample={handleLoadSample}
        hasServerGeminiKey={hasServerGeminiKey}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error / Fallback Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-amber-400 hover:text-amber-300 font-bold ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form Accordion / Section */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-200">
                Campaign Inputs & Keyword Raw Paste
              </h2>
              {architecture && (
                <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Active Brand: {formData.brandName}
                </span>
              )}
            </div>

            {architecture && (
              <button
                type="button"
                onClick={() => setShowInputSection(!showInputSection)}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <span>{showInputSection ? 'Hide Inputs' : 'Edit Inputs'}</span>
                {showInputSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          {showInputSection && (
            <div className="p-5 sm:p-6 bg-slate-950/50">
              <InputForm
                formData={formData}
                onChange={handleUpdateFormData}
                onSubmit={handleExecuteArchitecture}
                isLoading={isLoading}
                hasServerGeminiKey={hasServerGeminiKey}
                seedCount={seedKeywordsList.length}
                expandedCount={expandedKeywordsList.length}
                totalUniqueCount={deduplicatedSummary.keywords.length}
              />
            </div>
          )}
        </div>

        {/* Loading Progress State */}
        {isLoading && (
          <div className="p-8 bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">
                Processing Hybrid Search Architecture
              </h3>
              <p className="text-xs text-blue-400 animate-pulse font-mono">{progressMessage}</p>
            </div>
            <div className="max-w-md mx-auto bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-blue-500 h-full w-2/3 animate-pulse rounded-full shadow-lg shadow-blue-500/50" />
            </div>
          </div>
        )}

        {/* Architecture Output Results */}
        {architecture && !isLoading && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Metrics Bar */}
            <StatsBar architecture={architecture} />

            {/* View Tabs & Export Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f172a] p-2.5 rounded-xl border border-slate-800 shadow-xl">
              {/* Tabs */}
              <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-lg text-xs font-semibold border border-slate-800">
                <button
                  type="button"
                  id="tab-spreadsheet-btn"
                  onClick={() => setActiveTab('spreadsheet')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md transition-all ${
                    activeTab === 'spreadsheet'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Spreadsheet Master View</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    activeTab === 'spreadsheet' ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {architecture.spreadsheetRows.length}
                  </span>
                </button>

                <button
                  type="button"
                  id="tab-summary-btn"
                  onClick={() => setActiveTab('summary')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md transition-all ${
                    activeTab === 'summary'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <GitFork className="w-4 h-4" />
                  <span>Summary & Negative Management</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    activeTab === 'summary' ? 'bg-blue-700/80 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {architecture.campaigns.length}
                  </span>
                </button>
              </div>

              {/* Action Dropdowns */}
              <div className="flex items-center space-x-2 justify-end">
                <ExportDropdown
                  architecture={architecture}
                  brandName={formData.brandName}
                />
              </div>
            </div>

            {/* Active Tab View */}
            {activeTab === 'spreadsheet' ? (
              <SpreadsheetView rows={architecture.spreadsheetRows} />
            ) : (
              <SummaryView architecture={architecture} />
            )}
          </div>
        )}

        {/* Initial Blank State if no architecture generated yet */}
        {!architecture && !isLoading && (
          <div className="p-12 text-center bg-[#0f172a] rounded-xl border border-dashed border-slate-800 space-y-3 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Ready to Architect Search Campaigns
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Fill in your brand entities and paste search keywords above, or click{' '}
              <strong className="text-blue-400">"Load Sample"</strong> in the top header to preview a complete Zephyr apparel campaign structure with automated cross-match & cross-theme sculpts.
            </p>
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0f1d] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Search Ads Campaign Architect — Google Search Alpha/Beta Negative Sculpting Engine</span>
          <span className="text-[11px] font-mono">RFC 4180 CSV Compliant &bull; Ready for Google Ads Editor Bulk Upload</span>
        </div>
      </footer>
    </div>
  );
}
