import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SpreadsheetRow, MatchType, ClassificationType } from '../types';
import { copyToClipboard } from '../lib/export';

interface SpreadsheetViewProps {
  rows: SpreadsheetRow[];
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({ rows }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedMatchType, setSelectedMatchType] = useState<string>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Derive unique filter options
  const campaigns = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.campaign))).sort();
  }, [rows]);

  const classifications = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.classification))).sort();
  }, [rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesKeyword = row.keyword.toLowerCase().includes(query);
        const matchesCampaign = row.campaign.toLowerCase().includes(query);
        const matchesAdGroup = row.adGroup.toLowerCase().includes(query);
        const matchesAdGroupNegs = row.adGroupNegatives.some((n) => n.toLowerCase().includes(query));
        const matchesCampaignNegs = row.campaignNegatives.some((n) => n.toLowerCase().includes(query));
        if (!matchesKeyword && !matchesCampaign && !matchesAdGroup && !matchesAdGroupNegs && !matchesCampaignNegs) {
          return false;
        }
      }

      // Campaign filter
      if (selectedCampaign !== 'all' && row.campaign !== selectedCampaign) {
        return false;
      }

      // Match type filter
      if (selectedMatchType !== 'all' && row.matchType !== selectedMatchType) {
        return false;
      }

      // Classification filter
      if (selectedClassification !== 'all' && row.classification !== selectedClassification) {
        return false;
      }

      return true;
    });
  }, [rows, searchTerm, selectedCampaign, selectedMatchType, selectedClassification]);

  // Pagination calculation
  const totalRows = filteredRows.length;
  const isAll = pageSize === -1;
  const totalPages = isAll ? 1 : Math.ceil(totalRows / pageSize);

  const paginatedRows = useMemo(() => {
    if (isAll) return filteredRows;
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize, isAll]);

  const handleCopyCell = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCampaign('all');
    setSelectedMatchType('all');
    setSelectedClassification('all');
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Controls & Filter Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter keywords, campaigns, themes, or negatives..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Stats count */}
          <div className="flex items-center space-x-2 text-xs text-slate-400 justify-between sm:justify-end">
            <span>
              Showing <strong className="text-slate-100">{totalRows}</strong> of{' '}
              <strong className="text-slate-100">{rows.length}</strong> rows
            </span>
            {(selectedCampaign !== 'all' ||
              selectedMatchType !== 'all' ||
              selectedClassification !== 'all' ||
              searchTerm) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-blue-400 hover:text-blue-300 font-semibold underline ml-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Campaign Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">Campaign:</span>
            <select
              value={selectedCampaign}
              onChange={(e) => {
                setSelectedCampaign(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-hidden text-xs pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Campaigns ({campaigns.length})</option>
              {campaigns.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-200">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Match Type Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Match:</span>
            <select
              value={selectedMatchType}
              onChange={(e) => {
                setSelectedMatchType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-hidden text-xs pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Match Types</option>
              <option value="Exact" className="bg-slate-900 text-slate-200">Exact ([keyword])</option>
              <option value="Phrase" className="bg-slate-900 text-slate-200">Phrase ("keyword")</option>
            </select>
          </div>

          {/* Classification Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Bucket:</span>
            <select
              value={selectedClassification}
              onChange={(e) => {
                setSelectedClassification(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-200 font-semibold focus:outline-hidden text-xs pr-1"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Buckets</option>
              {classifications.map((cl) => (
                <option key={cl} value={cl} className="bg-slate-900 text-slate-200">
                  {cl}
                </option>
              ))}
            </select>
          </div>

          {/* Page Size Selector */}
          <div className="ml-auto flex items-center space-x-1.5 text-slate-400">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-semibold text-xs focus:outline-hidden"
            >
              <option value={25} className="bg-slate-900 text-slate-200">25</option>
              <option value={50} className="bg-slate-900 text-slate-200">50</option>
              <option value={100} className="bg-slate-900 text-slate-200">100</option>
              <option value={250} className="bg-slate-900 text-slate-200">250</option>
              <option value={-1} className="bg-slate-900 text-slate-200">All ({totalRows})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[400px] bg-slate-950">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider z-10">
              <th className="py-3 px-4 w-[180px] border-r border-slate-800/80">Campaign</th>
              <th className="py-3 px-4 w-[160px] border-r border-slate-800/80">Ad Group (Theme)</th>
              <th className="py-3 px-4 min-w-[200px] border-r border-slate-800/80 text-blue-400">Keyword</th>
              <th className="py-3 px-4 w-[110px] border-r border-slate-800/80">Match Type</th>
              <th className="py-3 px-4 min-w-[240px] border-r border-slate-800/80">
                Ad Group Negatives
                <span className="block text-[9px] font-normal normal-case text-slate-500">
                  Cross-theme tokens
                </span>
              </th>
              <th className="py-3 px-4 min-w-[260px]">
                Campaign Negatives
                <span className="block text-[9px] font-normal normal-case text-slate-500">
                  Cross-match [exact] alpha/beta sculpts
                </span>
              </th>
              <th className="py-3 px-3 w-[50px] text-center">Copy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-xs font-mono text-slate-300">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <p className="text-sm font-medium">No keyword rows matching current filters</p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-2 text-xs text-blue-400 font-semibold underline"
                  >
                    Reset all filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const isExact = row.matchType === 'Exact';
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-blue-500/5 transition-colors group text-[11px]"
                  >
                    {/* Campaign */}
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-200 whitespace-nowrap border-r border-slate-800/60">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isExact ? 'bg-emerald-400' : 'bg-blue-400'
                          }`}
                        />
                        <span>{row.campaign}</span>
                      </div>
                    </td>

                    {/* Ad Group */}
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-300 whitespace-nowrap border-r border-slate-800/60">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-800">
                        {row.adGroup}
                      </span>
                    </td>

                    {/* Keyword */}
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-100 border-r border-slate-800/60">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono ${
                          isExact
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-950/40 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {row.wrappedKeyword}
                      </span>
                    </td>

                    {/* Match Type */}
                    <td className="py-2.5 px-4 border-r border-slate-800/60">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          isExact
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}
                      >
                        {row.matchType}
                      </span>
                    </td>

                    {/* Ad Group Negatives */}
                    <td className="py-2.5 px-4 border-r border-slate-800/60">
                      {row.adGroupNegatives.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {row.adGroupNegatives.map((token, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-orange-950/30 text-orange-400 border border-orange-500/20 font-mono text-[10px]"
                              title={`Negative phrase token: "${token}"`}
                            >
                              "{token}"
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-[10px]">--</span>
                      )}
                    </td>

                    {/* Campaign Negatives */}
                    <td className="py-2.5 px-4">
                      {row.campaignNegatives.length > 0 ? (
                        <div className="max-w-md">
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                            {row.campaignNegatives.slice(0, 5).map((neg, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-500/20 font-mono text-[10px] whitespace-nowrap"
                              >
                                {neg}
                              </span>
                            ))}
                            {row.campaignNegatives.length > 5 && (
                              <span
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium"
                                title={row.campaignNegatives.slice(5).join(', ')}
                              >
                                +{row.campaignNegatives.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-[10px]">
                          --
                        </span>
                      )}
                    </td>

                    {/* Quick Row Copy */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyCell(
                            `${row.campaign}\t${row.adGroup}\t${row.wrappedKeyword}\t${row.matchType}`,
                            row.id
                          )
                        }
                        title="Copy row to clipboard"
                        className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      >
                        {copiedId === row.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div>
          Showing <strong className="text-slate-200">{filteredRows.length}</strong> generated rows across{' '}
          <strong className="text-slate-200">{campaigns.length}</strong> campaigns
          {!isAll && totalPages > 1 && (
            <span className="ml-2">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </div>

        {!isAll && totalPages > 1 && (
          <div className="flex items-center space-x-1.5 font-sans">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-md font-semibold text-xs transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
