import React, { useState } from 'react';
import {
  Sparkles,
  Key,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  HelpCircle,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { InputFormData, LLMProvider } from '../types';

interface InputFormProps {
  formData: InputFormData;
  onChange: (newData: Partial<InputFormData>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  hasServerGeminiKey: boolean;
  seedCount: number;
  expandedCount: number;
  totalUniqueCount: number;
}

export const InputForm: React.FC<InputFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isLoading,
  hasServerGeminiKey,
  seedCount,
  expandedCount,
  totalUniqueCount,
}) => {
  const [showLlmSettings, setShowLlmSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName.trim()) {
      setValidationError('Brand Name is required.');
      return;
    }
    if (!formData.seedKeywords.trim() && !formData.expandedKeywords.trim()) {
      setValidationError('Please provide at least one Seed Keyword or Expanded Keyword.');
      return;
    }

    if (formData.provider === 'openai' && !formData.apiKey.trim()) {
      setValidationError('OpenAI requires an API key in LLM Settings.');
      setShowLlmSettings(true);
      return;
    }
    if (formData.provider === 'anthropic' && !formData.apiKey.trim()) {
      setValidationError('Anthropic Claude requires an API key in LLM Settings.');
      setShowLlmSettings(true);
      return;
    }
    if (formData.provider === 'gemini' && !hasServerGeminiKey && !formData.apiKey.trim()) {
      setValidationError('Please enter a Gemini API Key in LLM Settings, or switch to the Offline Engine.');
      setShowLlmSettings(true);
      return;
    }

    setValidationError(null);
    onSubmit();
  };

  const handleProviderChange = (provider: LLMProvider) => {
    let defaultModel = 'gemini-3.8-flash';
    if (provider === 'gemini') defaultModel = 'gemini-3.8-flash';
    if (provider === 'openai') defaultModel = 'gpt-4o-mini';
    if (provider === 'anthropic') defaultModel = 'claude-3-5-sonnet-20241022';
    if (provider === 'offline') defaultModel = 'rule-based-heuristics';

    onChange({ provider, model: defaultModel });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Brand & Competitor Section */}
      <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Entity Definitions</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Brand Name */}
          <div>
            <label htmlFor="brand-name" className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
              Brand Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="brand-name"
              required
              value={formData.brandName}
              onChange={(e) => onChange({ brandName: e.target.value })}
              placeholder="e.g. Zephyr Gear"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
            />
          </div>

          {/* Brand Variants / Misspellings */}
          <div>
            <label htmlFor="brand-variants" className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
              Brand Variants <span className="text-slate-500 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="brand-variants"
              value={formData.brandVariants}
              onChange={(e) => onChange({ brandVariants: e.target.value })}
              placeholder="e.g. zfr, zephir, zephyr gear"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
            />
          </div>

          {/* Competitor Names */}
          <div>
            <label htmlFor="competitor-names" className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
              Competitor Names <span className="text-slate-500 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="competitor-names"
              value={formData.competitors}
              onChange={(e) => onChange({ competitors: e.target.value })}
              placeholder="e.g. Nike, Lululemon, Gymshark"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Global Negatives / Exclusions */}
        <div>
          <label htmlFor="global-negatives" className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
            Global Negatives / Account Exclusions <span className="text-slate-500 normal-case font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            id="global-negatives"
            value={formData.globalNegatives}
            onChange={(e) => onChange({ globalNegatives: e.target.value })}
            placeholder="e.g. jobs, free, wholesale, clearance, coupon, salary, pdf"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Keywords Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Seed Keywords */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="seed-keywords" className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Seed Keywords</span>
                <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {seedCount} detected
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Comma or newline separated list of foundational search queries.
            </p>
            <textarea
              id="seed-keywords"
              rows={7}
              value={formData.seedKeywords}
              onChange={(e) => onChange({ seedKeywords: e.target.value })}
              placeholder={`oversized cotton tee\nminimalist hoodie\nperformance tech pants\nwinter base layer\ngym shorts pack`}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 leading-relaxed focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Expanded Keywords (Keyword Planner Paste) */}
        <div className="bg-[#0f172a] rounded-xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="expanded-keywords" className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Expanded Keywords (Planner Paste)</span>
              </label>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {expandedCount} detected
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Paste raw tables from Google Keyword Planner; automatically strips search volume, CPC, and tabbed metadata.
            </p>
            <textarea
              id="expanded-keywords"
              rows={7}
              value={formData.expandedKeywords}
              onChange={(e) => onChange({ expandedKeywords: e.target.value })}
              placeholder={`oversized streetwear shirt\t14,800\tHigh\t$1.85\t$3.40\nmen boxy fit tee\t9,200\tMedium\t$1.20\t$2.45\nheavyweight 280gsm shirt\t4,500\tHigh\t$2.50\t$4.80`}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 leading-relaxed focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Deduplication Live Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 rounded-xl text-xs text-slate-400 border border-slate-800">
        <span className="font-medium text-slate-300">
          Total Parsed & Deduplicated Keywords:{' '}
          <strong className="text-blue-400 font-bold ml-1">{totalUniqueCount}</strong>
        </span>
        <span className="text-slate-500 text-[11px]">
          Ready for semantic entity classification & alpha/beta negative sculpts
        </span>
      </div>

      {/* Collapsible LLM Settings */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLlmSettings(!showLlmSettings)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-slate-200">LLM Semantic Engine & API Key Settings</span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700">
              {formData.provider === 'gemini'
                ? hasServerGeminiKey && !formData.apiKey
                  ? 'Gemini (Built-in Active)'
                  : 'Gemini Flash'
                : formData.provider === 'openai'
                ? 'OpenAI GPT-4o'
                : formData.provider === 'anthropic'
                ? 'Claude 3.5 Sonnet'
                : 'Offline Heuristics'}
            </span>
          </div>
          {showLlmSettings ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showLlmSettings && (
          <div className="p-5 border-t border-slate-800 bg-slate-900/50 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Provider / Model Selector */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  Model & Engine Selector
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-hidden focus:border-blue-500"
                >
                  <option value="gemini">
                    Gemini Flash {hasServerGeminiKey ? '(Zero-setup Built-in)' : ''}
                  </option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="offline">Rule-based Instant Offline Engine (Zero API Key)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {formData.provider === 'gemini' && hasServerGeminiKey
                    ? 'Connected with server-side Gemini API key. Zero client configuration needed.'
                    : formData.provider === 'offline'
                    ? 'Executes token & entity heuristics in browser without calling any remote endpoints.'
                    : 'Requires an API key stored purely in-memory in your browser session.'}
                </p>
              </div>

              {/* API Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    User API Key{' '}
                    <span className="text-slate-500 font-normal normal-case">
                      {formData.provider === 'gemini' && hasServerGeminiKey
                        ? '(optional override)'
                        : formData.provider === 'offline'
                        ? '(not needed)'
                        : '(required)'}
                    </span>
                  </label>
                  {formData.apiKey && (
                    <button
                      type="button"
                      onClick={() => onChange({ apiKey: '' })}
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    disabled={formData.provider === 'offline'}
                    onChange={(e) => onChange({ apiKey: e.target.value })}
                    placeholder={
                      formData.provider === 'gemini' && hasServerGeminiKey
                        ? 'Using environment GEMINI_API_KEY (leave blank or enter custom)'
                        : formData.provider === 'offline'
                        ? 'Not required for Offline Engine'
                        : `Enter your ${formData.provider} API key (stored in-memory only)`
                    }
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 disabled:bg-slate-950 disabled:text-slate-600 font-mono text-xs"
                  />
                  {formData.provider !== 'offline' && (
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit CTA */}
      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          type="submit"
          id="run-architect-btn"
          disabled={isLoading || totalUniqueCount === 0}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-md font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Architecting & Sculpting Negatives...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Campaign Architecture ({totalUniqueCount} Keywords)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
