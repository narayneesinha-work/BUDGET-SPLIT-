import React, { useState } from 'react';
import { Layers, HelpCircle, Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  hasServerGeminiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLoadSample, hasServerGeminiKey }) => {
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <header className="border-b border-slate-800 bg-[#020617] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & App Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
            Σ
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-semibold text-slate-50 tracking-tight">
                Search Ads Campaign Architect
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Alpha/Beta Sculptor
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Segmented Exact & Phrase campaigns with automated cross-match & cross-theme sculpts
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {hasServerGeminiKey && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] uppercase font-bold text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Gemini Flash Connected
            </div>
          )}

          <button
            type="button"
            onClick={onLoadSample}
            id="load-sample-btn"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
            title="Load sample dataset for Zephyr apparel"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Load Sample
          </button>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            id="help-modal-btn"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            title="How this architecture works"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Architecture Explainer Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-50">
                    Hybrid Processing Architecture & Negative Sculpting
                  </h3>
                  <p className="text-xs text-slate-400">
                    How semantic AI and deterministic rules construct your search campaigns
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm text-slate-300">
              {/* Step 1 */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 mb-0.5">
                    Step 1: Sanitization & Semantic LLM Classification
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Deduplicates raw keywords and Google Keyword Planner exports (stripping CPC, volume, and tabs). The LLM categorizes entities into <strong className="text-slate-200">Brand</strong>, <strong className="text-slate-200">Generic</strong>, <strong className="text-slate-200">Competitor</strong>, or <strong className="text-slate-200">Irrelevant</strong>, clustering each commercial bucket into 4–6 mutually exclusive themes with 1–2 distinguishing stem tokens.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 mb-0.5">
                    Step 2: Deterministic Exact & Phrase Campaign Mapping
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    For every classification bucket, the engine creates two dedicated campaigns: <code className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-blue-400">{'{Bucket}'} - Exact</code> and <code className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-blue-400">{'{Bucket}'} - Phrase</code>. Ad groups are generated 1:1 with themes.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 mb-0.5">
                    Step 3: Programmatic Negative Sculpting Rules
                  </h4>
                  <ul className="text-xs text-slate-400 space-y-1.5 mt-1 list-disc list-inside">
                    <li>
                      <strong className="text-slate-200">Cross-Match (Alpha/Beta):</strong> Injects all Exact campaign keywords as exact negatives <code className="bg-slate-900 border border-slate-800 px-1 py-0.2 text-emerald-400">[keyword]</code> into the Phrase campaign to prevent cannibalization.
                    </li>
                    <li>
                      <strong className="text-slate-200">Cross-Theme (Ad Group):</strong> Each ad group negates the <code className="bg-slate-900 border border-slate-800 px-1 py-0.2 text-orange-400">themeDistinguisher</code> tokens of sibling ad groups within the same campaign.
                    </li>
                    <li>
                      <strong className="text-slate-200">Account-Level Negatives:</strong> Aggregates user exclusions and LLM-flagged irrelevant queries into a master negative list.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Outputs */}
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Exports: Google Ads Editor Native Bulk CSV & Master Tabular Architecture</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
