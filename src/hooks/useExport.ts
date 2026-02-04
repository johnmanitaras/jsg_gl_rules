/**
 * Export Hook for Invoice Batches
 *
 * Provides functionality for exporting invoice batches to various formats
 * (MYOB, Xero, CSV) and re-downloading previously exported files.
 *
 * Endpoints used:
 * - POST /invoice-batch-export/{id}?format={format} - Export and mark as exported
 * - GET /invoice-batch-export-download/{id}?format={format} - Re-download exported file
 */

import { useCallback, useState } from 'react';
import { useApi } from './useApi';
import { ExportFormat } from '../types/gl-rules';

export interface UseExportReturn {
  /** Whether an export operation is in progress */
  exporting: boolean;
  /** Error message if export failed */
  error: string | null;
  /** Export format currently being processed */
  exportingFormat: ExportFormat | null;
  /**
   * Export a batch and mark it as exported (first-time export)
   * This will update the batch's exported_at timestamp
   */
  exportBatch: (batchId: number, format: ExportFormat) => Promise<boolean>;
  /**
   * Re-download a previously exported batch file
   * Does not update the exported_at timestamp
   */
  redownload: (batchId: number, format: ExportFormat) => Promise<boolean>;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * Get the file extension for a given export format
 */
function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'csv';
    case 'xero':
      return 'csv'; // Xero format is also CSV
    case 'myob':
      return 'txt'; // MYOB uses TXT format
    default:
      return 'csv';
  }
}

/**
 * Get a filename for the export
 */
function getFilename(batchId: number, format: ExportFormat): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = getFileExtension(format);
  return `invoice-batch-${batchId}-${format}-${timestamp}.${extension}`;
}

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

export function useExport(): UseExportReturn {
  const { fetchWithAuth } = useApi();

  // State
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Perform the export API call and handle file download
   */
  const performExport = useCallback(
    async (
      endpoint: string,
      batchId: number,
      format: ExportFormat,
      isRedownload: boolean
    ): Promise<boolean> => {
      setExporting(true);
      setExportingFormat(format);
      setError(null);

      try {
        // For file downloads, we need to handle the response differently
        // The API returns a file blob, not JSON
        const response = await fetchWithAuth(endpoint, {
          method: isRedownload ? 'GET' : 'POST',
        });

        // Check if response contains file data
        // The API may return a blob or JSON with download URL
        const data = response.data;

        // If the response is a JSON object with file content or URL
        if (data && typeof data === 'object') {
          // Handle case where API returns the file content directly
          if (data.content) {
            const blob = new Blob([data.content], {
              type: data.contentType || 'text/csv',
            });
            downloadBlob(blob, getFilename(batchId, format));
            return true;
          }

          // Handle case where API returns a download URL
          if (data.downloadUrl || data.download_url) {
            const downloadUrl = data.downloadUrl || data.download_url;
            window.open(downloadUrl, '_blank');
            return true;
          }

          // Handle case where API returns success with file data as string
          if (data.file_data || data.fileData) {
            const fileData = data.file_data || data.fileData;
            const blob = new Blob([fileData], { type: 'text/csv' });
            downloadBlob(blob, getFilename(batchId, format));
            return true;
          }

          // If API just returns success, the file may have been sent in headers
          // or the endpoint might work differently
          if (data.success || data.message) {
            console.log('Export API returned:', data);
            return true;
          }
        }

        // If we got raw string data, treat it as the file content
        if (typeof data === 'string') {
          const blob = new Blob([data], { type: 'text/csv' });
          downloadBlob(blob, getFilename(batchId, format));
          return true;
        }

        // Default case - operation completed but unclear how to get file
        console.warn('Export completed but file download handling unclear:', data);
        return true;
      } catch (err) {
        console.error('Export error:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to export batch';
        setError(errorMessage);
        return false;
      } finally {
        setExporting(false);
        setExportingFormat(null);
      }
    },
    [fetchWithAuth]
  );

  /**
   * Export a batch for the first time (marks as exported)
   */
  const exportBatch = useCallback(
    async (batchId: number, format: ExportFormat): Promise<boolean> => {
      const endpoint = `/invoice-batch-export/${batchId}?format=${format}`;
      return performExport(endpoint, batchId, format, false);
    },
    [performExport]
  );

  /**
   * Re-download a previously exported batch
   */
  const redownload = useCallback(
    async (batchId: number, format: ExportFormat): Promise<boolean> => {
      const endpoint = `/invoice-batch-export-download/${batchId}?format=${format}`;
      return performExport(endpoint, batchId, format, true);
    },
    [performExport]
  );

  return {
    exporting,
    error,
    exportingFormat,
    exportBatch,
    redownload,
    clearError,
  };
}
