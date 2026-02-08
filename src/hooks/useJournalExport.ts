/**
 * Journal Export Hook
 *
 * Exports journal entries from a batch run to various accounting formats.
 *
 * Endpoint:
 * - POST /gl-batch-journal-export/{batchId}?format={format}&batch_type={type}
 */

import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { ExportFormat, BatchType } from '../types/gl-rules';

/**
 * Trigger browser file download from blob data
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Get the file extension for a given export format
 */
function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'csv';
    case 'xero':
      return 'csv';
    case 'myob':
      return 'txt';
    default:
      return 'csv';
  }
}

/**
 * Extract error message from various error shapes thrown by fetchWithAuth
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    // fetchWithAuth throws { error, debug } objects
    const errObj = err as Record<string, unknown>;
    if (errObj.error instanceof Error) return errObj.error.message;
    if (typeof errObj.error === 'string') return errObj.error;
    if (typeof errObj.message === 'string') return errObj.message;
  }
  return 'Failed to export journal';
}

export function useJournalExport() {
  const { fetchWithAuth } = useApi();

  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Export journal entries for a batch run
   */
  const exportJournal = useCallback(
    async (
      batchId: number,
      batchType: BatchType,
      format: ExportFormat
    ): Promise<boolean> => {
      setExporting(true);
      setError(null);

      const endpoint = `/gl-batch-journal-export/${batchId}?format=${format}&batch_type=${batchType}`;

      try {
        const response = await fetchWithAuth(endpoint, { method: 'POST' });
        const data = response.data;

        // Use the filename from the API if provided, otherwise build one
        const fallbackFilename = `journal-${batchType}-batch-${batchId}-${format}-${new Date().toISOString().split('T')[0]}.${getFileExtension(format)}`;
        let downloaded = false;

        // Handle various response shapes from the API
        if (data && typeof data === 'object') {
          // Base64-encoded file data (content_base64 from the journal export API)
          if (!downloaded && (data.content_base64 || data.base64)) {
            const raw = atob(data.content_base64 || data.base64);
            const contentType = data.content_type || data.contentType || 'text/csv';
            const blob = new Blob([raw], { type: contentType });
            downloadBlob(blob, data.filename || fallbackFilename);
            downloaded = true;
          }

          // Direct content field
          if (!downloaded && data.content) {
            const contentType = data.content_type || data.contentType || 'text/csv';
            const blob = new Blob([data.content], { type: contentType });
            downloadBlob(blob, data.filename || fallbackFilename);
            downloaded = true;
          }

          // file_data / fileData fields
          if (!downloaded && (data.file_data || data.fileData)) {
            const fileData = data.file_data || data.fileData;
            const blob = new Blob([fileData], { type: 'text/csv' });
            downloadBlob(blob, data.filename || fallbackFilename);
            downloaded = true;
          }

          // Download URL
          if (!downloaded && (data.downloadUrl || data.download_url)) {
            window.open(data.downloadUrl || data.download_url, '_blank');
            downloaded = true;
          }

          // data field containing file content (common REST pattern)
          if (!downloaded && typeof data.data === 'string' && data.data.length > 0) {
            const blob = new Blob([data.data], { type: 'text/csv' });
            downloadBlob(blob, data.filename || fallbackFilename);
            downloaded = true;
          }

          if (!downloaded) {
            console.warn('Journal export API returned unrecognized shape:', Object.keys(data));
            setError('Export completed but no file was returned. The API response format may not be supported yet.');
            return false;
          }

          return true;
        }

        // Raw string data
        if (typeof data === 'string' && data.length > 0) {
          const blob = new Blob([data], { type: 'text/csv' });
          downloadBlob(blob, fallbackFilename);
          return true;
        }

        setError('Export returned empty response');
        return false;
      } catch (err) {
        console.error('Journal export error:', err);
        setError(extractErrorMessage(err));
        return false;
      } finally {
        setExporting(false);
      }
    },
    [fetchWithAuth]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    exporting,
    error,
    exportJournal,
    clearError,
  };
}
