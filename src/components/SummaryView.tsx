import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  Folder,
  FolderOpen,
  Hash,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { ProcessedArchitecture, CampaignData, AdGroupData } from '../types';
import { copyToClipboard } from '../lib/export';

interface SummaryViewProps {
  architecture: ProcessedArchitecture;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ architecture }) => {
  const { campaigns, accountNegatives } = architecture;

  // Track expanded campaigns and ad groups
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    campaigns.forEach((c, idx) => {
      // Expand the first two by default
      init[c.id] = idx < 2;
    });
    return init;
  });

  const [expandedAdGroups, setExpandedAdGroups] = useState<Record<string, boolean>>({});
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [negativeFilter, setNegativeFilter] = useState('');

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAdGroup = (id: string) => {
    setExpandedAdGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allC: Record<string, boolean> = {};
    const allA: Record<string, boolean> = {};
    campaigns.forEach((c) => {
      allC[c.id] = true;
      c.adGroups.forEach((a) => {
        allA[a.id] = true;
      });
    });
    setExpandedCampaigns(allC);
    setExpandedAdGroups(allA);
  };

  const collapseAll = () => {
    setExpandedCampaigns({});
    setExpandedAdGroups({});
  };

  const handleCopy = async (text: string, stateKey: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedState(stateKey);
      setTimeout(() => setCopiedState(null), 2000);
    }
  };

  // Filtered negative terms
  const filteredNegatives = accountNegatives.filter((item) =>
    item.term.toLowerCase().includes(negativeFilter.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Campaign Tree View (7 cols) */}
      <div className="lg:col-span-7 bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">
              Campaign Hierarchy & Structure Tree
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
              {campaigns.length} Campaigns
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="text-slate-400 hover:text-slate-200 font-medium px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Expand All
            </button>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-slate-400 hover:text-slate-200 font-medium px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Tree Content */}
        <div className="p-4 overflow-y-auto max-h-[600px] space-y-3 bg-slate-950/40">
          {campaigns.map((campaign) => {
            const isExpanded = !!expandedCampaigns[campaign.id];
            const isExact = campaign.matchType === 'Exact';
            const totalKwCount = campaign.adGroups.reduce((acc, a) => acc + a.keywords.length, 0);

            return (
              <div
                key={campaign.id}
                className="border border-slate-800 rounded-xl overflow-hidden transition-all bg-[#0f172a]"
              >
                {/* Campaign Header Node */}
                <button
                  type="button"
                  onClick={() => toggleCampaign(campaign.id)}
                  className="w-full text-left p-3.5 flex items-center justify-between bg-slate-900/70 hover:bg-slate-850 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isExact ? 'bg-emerald-400' : 'bg-blue-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-200">{campaign.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isExact ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {campaign.matchType}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono">
                      {campaign.adGroups.length} Ad Groups
                    </span>
                    <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono">
                      {totalKwCount} Keywords
                    </span>
                  </div>
                </button>

                {/* Campaign Children (Ad Groups) */}
                {isExpanded && (
                  <div className="p-3 bg-slate-950/60 border-t border-slate-800 space-y-2.5">
                    {/* Alpha/Beta Cross-match Negatives Badge if Phrase */}
                    {campaign.matchType === 'Phrase' && campaign.campaignNegatives.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/20 text-[11px] flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-red-300">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          <span className="font-semibold">Campaign Cross-Match Negatives:</span>
                          <span>
                            {campaign.campaignNegatives.length} Exact negatives injected to isolate phrase match traffic
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              campaign.campaignNegatives.join('\n'),
                              `camp-negs-${campaign.id}`
                            )
                          }
                          className="text-[10px] font-semibold text-red-400 hover:text-red-300 flex items-center space-x-1 underline"
                        >
                          {copiedState === `camp-negs-${campaign.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy All</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Ad Groups List */}
                    <div className="space-y-2 pl-2">
                      {campaign.adGroups.map((adGroup) => {
                        const isAdGroupExpanded = !!expandedAdGroups[adGroup.id];

                        return (
                          <div
                            key={adGroup.id}
                            className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60"
                          >
                            {/* Ad Group Row */}
                            <button
                              type="button"
                              onClick={() => toggleAdGroup(adGroup.id)}
                              className="w-full text-left p-2.5 flex items-center justify-between bg-slate-900/40 hover:bg-slate-850 transition-colors text-xs"
                            >
                              <div className="flex items-center space-x-2">
                                {isAdGroupExpanded ? (
                                  <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                                ) : (
                                  <Folder className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <span className="font-bold text-slate-200">{adGroup.theme}</span>
                                {adGroup.themeDistinguisher && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950/40 text-blue-300 border border-blue-500/30 font-mono">
                                    stem: {adGroup.themeDistinguisher}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                                <span className="text-[10px] bg-orange-950/30 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-medium">
                                  {adGroup.siblingDistinguishers.length} Cross-Theme Negs
                                </span>
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono font-semibold">
                                  {adGroup.keywords.length} kws
                                </span>
                              </div>
                            </button>

                            {/* Ad Group Keywords & Sibling Negatives Detail */}
                            {isAdGroupExpanded && (
                              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2 text-xs">
                                {/* Keywords pills */}
                                <div>
                                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                                    Ad Group Keywords ({adGroup.keywords.length})
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {adGroup.keywords.map((kw, kwIdx) => {
                                      const wrapped =
                                        campaign.matchType === 'Exact'
                                          ? `[${kw.keyword}]`
                                          : `"${kw.keyword}"`;
                                      return (
                                        <span
                                          key={kwIdx}
                                          className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                                            campaign.matchType === 'Exact'
                                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                                              : 'bg-blue-950/40 text-blue-300 border border-blue-500/30'
                                          }`}
                                        >
                                          {wrapped}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Sibling Ad Group Negative Tokens */}
                                {adGroup.siblingDistinguishers.length > 0 && (
                                  <div className="pt-2 border-t border-slate-800">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                                      <span>
                                        Sibling Theme Negatives ({adGroup.siblingDistinguishers.length})
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCopy(
                                            adGroup.siblingDistinguishers
                                              .map((d) => `"${d}"`)
                                              .join(', '),
                                            `sibling-${adGroup.id}`
                                          )
                                        }
                                        className="text-[10px] text-blue-400 hover:text-blue-300 font-medium underline"
                                      >
                                        {copiedState === `sibling-${adGroup.id}`
                                          ? 'Copied!'
                                          : 'Copy Negatives'}
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {adGroup.siblingDistinguishers.map((token, tIdx) => (
                                        <span
                                          key={tIdx}
                                          className="px-1.5 py-0.5 rounded bg-orange-950/30 text-orange-400 border border-orange-500/20 font-mono text-[10px]"
                                        >
                                          "{token}"
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Global Negative List Card (5 cols) */}
      <div className="lg:col-span-5 bg-[#0f172a] rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
        {/* Card Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">Global Account Negatives</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              {accountNegatives.length} Excluded Terms
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Account-wide negative terms combined from your global exclusion inputs and LLM-flagged non-commercial/irrelevant queries.
          </p>

          {/* Quick Copy Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  accountNegatives.map((n) => n.term).join('\n'),
                  'all-account-negs'
                )
              }
              className="px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-[11px] flex items-center justify-center space-x-1 transition-colors"
            >
              {copiedState === 'all-account-negs' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy Raw</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                handleCopy(
                  accountNegatives.map((n) => `"${n.term}"`).join('\n'),
                  'phrase-account-negs'
                )
              }
              className="px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-[11px] flex items-center justify-center space-x-1 transition-colors"
            >
              {copiedState === 'phrase-account-negs' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy "Phrase"</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                handleCopy(
                  accountNegatives.map((n) => `[${n.term}]`).join('\n'),
                  'exact-account-negs'
                )
              }
              className="px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-[11px] flex items-center justify-center space-x-1 transition-colors"
            >
              {copiedState === 'exact-account-negs' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Copy [Exact]</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="p-3 border-b border-slate-800 bg-slate-950">
          <input
            type="text"
            value={negativeFilter}
            onChange={(e) => setNegativeFilter(e.target.value)}
            placeholder="Search negative list..."
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* List of Negatives */}
        <div className="p-4 overflow-y-auto max-h-[480px] space-y-2 bg-slate-950/40">
          {filteredNegatives.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No negative keywords found
            </div>
          ) : (
            filteredNegatives.map((neg, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-colors text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-medium text-slate-200">{neg.term}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                      neg.source === 'user_exclusion'
                        ? 'bg-purple-950/40 text-purple-300 border border-purple-500/30'
                        : 'bg-red-950/40 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {neg.source === 'user_exclusion' ? 'User Exclusion' : 'LLM Irrelevant'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(neg.term, `neg-${idx}`)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded"
                  title="Copy negative term"
                >
                  {copiedState === `neg-${idx}` ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Ready to paste directly into Google Ads Account Negative Lists</span>
          <span className="font-semibold text-slate-200">{filteredNegatives.length} items</span>
        </div>
      </div>
    </div>
  );
};
