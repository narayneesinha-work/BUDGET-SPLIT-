import { GoogleAdsEditorRow, SpreadsheetRow } from '../types';

/**
 * Escapes a field value for RFC 4180 CSV compliance.
 */
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Generates Google Ads Editor native bulk upload CSV string.
 * Columns: Campaign, Ad Group, Keyword, Criterion Type
 */
export function generateGoogleAdsEditorCsv(rows: GoogleAdsEditorRow[]): string {
  const headers = ['Campaign', 'Ad Group', 'Keyword', 'Criterion Type'];
  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    const line = [
      escapeCsvCell(row.Campaign),
      escapeCsvCell(row['Ad Group']),
      escapeCsvCell(row.Keyword),
      escapeCsvCell(row['Criterion Type']),
    ].join(',');
    lines.push(line);
  }

  return lines.join('\r\n');
}

/**
 * Generates Master Architecture Tabular CSV string mirroring the on-screen table.
 * Columns: Campaign, Ad Group, Keyword, Match Type, Ad Group Negatives, Campaign Negatives
 */
export function generateMasterArchitectureCsv(rows: SpreadsheetRow[]): string {
  const headers = [
    'Campaign',
    'Ad Group',
    'Keyword',
    'Match Type',
    'Ad Group Negatives',
    'Campaign Negatives',
  ];
  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    const adGroupNegs = row.adGroupNegatives.join(', ');
    const campaignNegs = row.campaignNegatives.join(', ');

    const line = [
      escapeCsvCell(row.campaign),
      escapeCsvCell(row.adGroup),
      escapeCsvCell(row.keyword),
      escapeCsvCell(row.matchType),
      escapeCsvCell(adGroupNegs),
      escapeCsvCell(campaignNegs),
    ].join(',');
    lines.push(line);
  }

  return lines.join('\r\n');
}

/**
 * Downloads a string content as a file in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies plain text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}
