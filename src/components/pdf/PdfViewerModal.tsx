'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { formatFileSize, formatPdfDate, pdfService } from '../../services/pdfService';
import type { PdfDocument } from '../../types/pdf';

interface PdfViewerModalProps {
  pdf: PdfDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PdfViewerModal({ pdf, isOpen, onClose }: PdfViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !pdf) return;

    let active = true;
    let createdUrl: string | null = null;

    async function loadPdf() {
      if (!pdf) return;
      try {
        const url = await pdfService.getPdfBlobUrl(pdf.id, 'view');
        if (active) {
          createdUrl = url;
          setBlobUrl(url);
          setIsLoading(false);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch {
        if (active) {
          const directUrl = pdfService.getViewUrl(pdf.id);
          setBlobUrl(directUrl);
          setIsLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
      setBlobUrl(null);
      setIsLoading(true);
      setError(null);
    };
  }, [isOpen, pdf]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !pdf) return null;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await pdfService.downloadPdfFile(pdf.id, pdf.originalName || `${pdf.title}.pdf`);
    } catch {
      // Fallback
      window.open(pdfService.getDownloadUrl(pdf.id), '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenExternal = () => {
    const targetUrl = blobUrl || pdfService.getViewUrl(pdf.id);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const directViewUrl = pdfService.getViewUrl(pdf.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[92vh] max-h-[900px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {pdf.title}
                </h3>
                {pdf.categoryName && (
                  <span className="hidden sm:inline-block rounded-md bg-indigo-500/20 border border-indigo-400/30 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                    {pdf.categoryName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
                <span>{pdf.originalName}</span>
                {pdf.fileSize > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(pdf.fileSize)}</span>
                  </>
                )}
                {pdf.createdAt && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{formatPdfDate(pdf.createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
              title="Download PDF"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={handleOpenExternal}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="relative flex-1 bg-slate-100 flex flex-col items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 p-6 text-slate-500">
              <Loader2 size={36} className="animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Loading PDF document...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center gap-3 p-6 text-center max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-base font-bold text-slate-800">Unable to preview document</h4>
              <p className="text-xs text-slate-500">{error}</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                >
                  Download File
                </button>
                <a
                  href={directViewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Direct Link
                </a>
              </div>
            </div>
          )}

          {!isLoading && !error && blobUrl && (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title={pdf.title}
              className="w-full h-full border-none bg-slate-200"
              onError={() => setError('Browser failed to render inline preview.')}
            />
          )}
        </div>

        {/* Optional footer with description */}
        {pdf.description && (
          <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <p className="truncate max-w-3xl">{pdf.description}</p>
            <span className="text-[11px] text-slate-400 shrink-0 ml-3">
              Press Esc to close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
