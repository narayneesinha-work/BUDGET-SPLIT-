import React from 'react';
import { Layers, GitFork, ShieldAlert, Sparkles, Filter, Hash } from 'lucide-react';
import { ProcessedArchitecture } from '../types';

interface StatsBarProps {
  architecture: ProcessedArchitecture;
}

export const StatsBar: React.FC<StatsBarProps> = ({ architecture }) => {
  const { summary } = architecture;

  const stats = [
    {
      label: 'Processed Keywords',
      value: `${summary.totalDeduplicated}`,
      sub: `${summary.totalRawKeywords} raw inputs (${summary.totalRawKeywords - summary.totalDeduplicated} duplicates removed)`,
      icon: Hash,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Proposed Architecture',
      value: `${summary.campaignsCount < 10 ? '0' : ''}${summary.campaignsCount}`,
      unit: 'Campaigns',
      sub: 'Exact & Phrase mirrored pairs',
      icon: Layers,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Themed Ad Groups',
      value: `${summary.adGroupsCount}`,
      sub: '1:1 semantic theme clusters',
      icon: GitFork,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Alpha/Beta Negatives',
      value: `${summary.crossMatchNegativesCount}`,
      sub: 'Cross-match exact [negatives] injected',
      icon: ShieldAlert,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Cross-Theme Negatives',
      value: `${summary.crossThemeNegativesCount}`,
      sub: 'Sibling ad group token sculpts',
      icon: Filter,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
    {
      label: 'Account Exclusions',
      value: `${architecture.accountNegatives.length}`,
      sub: `${summary.irrelevantCount} irrelevant + user exclusions`,
      icon: Sparkles,
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-[#0f172a] rounded-xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {stat.label}
              </span>
              <div className={`p-1.5 rounded-lg border ${stat.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-xs font-normal text-slate-500 uppercase tracking-wider">
                    {stat.unit}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate" title={stat.sub}>
                {stat.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
