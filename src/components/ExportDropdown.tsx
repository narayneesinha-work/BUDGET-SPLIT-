import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Check } from 'lucide-react';
import { ProcessedArchitecture } from '../types';
import {
  generateGoogleAdsEditorCsv,
  generateMasterArchitectureCsv,
  downloadFile,
} from '../lib/export';

interface ExportDropdownProps {
  architecture: ProcessedArchitecture;
  brandName: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  architecture,
  brandName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sanitizedBrand = (brandName || 'Brand').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);

  const handleExportGoogleAdsEditor = () => {
    const csvContent = generateGoogleAdsEditorCsv(architecture.editorRows);
    const filename = `${sanitizedBrand}_google_ads_editor_bulk_upload_${dateStr}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    setIsOpen(false);
    setDownloadNotice('Google Ads Editor CSV Downloaded');
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  const handleExportMasterCsv = () => {
    const csvContent = generateMasterArchitectureCsv(architecture.spreadsheetRows);
    const filename = `${sanitizedBrand}_master_campaign_architecture_${dateStr}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    setIsOpen(false);
    setDownloadNotice('Master Architecture CSV Downloaded');
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        id="export-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export Architecture</span>
        <ChevronDown className="w-3 h-3 text-blue-200" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-xl shadow-2xl bg-[#0f172a] border border-slate-800 z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 bg-slate-900/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Download Format Options
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {/* Option 1: Google Ads Editor CSV */}
            <button
              type="button"
              id="export-editor-csv-btn"
              onClick={handleExportGoogleAdsEditor}
              className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-start space-x-3 group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-blue-400">
                  Google Ads Editor CSV
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Native bulk upload format with Campaign, Ad Group, Keyword, and Criterion Type (Exact, Phrase, Negative Exact/Phrase).
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {architecture.editorRows.length} bulk upload rows
                </span>
              </div>
            </button>

            {/* Option 2: Master Architecture CSV */}
            <button
              type="button"
              id="export-master-csv-btn"
              onClick={handleExportMasterCsv}
              className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-start space-x-3 group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 group-hover:text-blue-400">
                  Master Architecture Excel/CSV
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  Complete tabular export mirroring the on-screen spreadsheet layout with all sculpted negative columns.
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                  {architecture.spreadsheetRows.length} keyword rows
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {downloadNotice && (
        <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-100 text-xs font-medium rounded-lg shadow-xl flex items-center space-x-1.5 whitespace-nowrap z-50">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{downloadNotice}</span>
        </div>
      )}
    </div>
  );
};
