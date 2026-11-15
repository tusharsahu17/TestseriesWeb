'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { formatFileSize, formatPdfDate, pdfService } from '../../../../services/pdfService';
import type { PdfDocument } from '../../../../types/pdf';

interface PageProps {
  params: Promise<{ pdfId: string }>;
}

export default function SinglePdfPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const pdfId = resolvedParams.pdfId;

  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let active = true;
    let localBlobUrl: string | null = null;

    async function fetchPdfData() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await pdfService.getPdfById(pdfId);
        if (!active) return;
        setPdf(data);

        // Try getting blob URL for iframe
        try {
          const url = await pdfService.getPdfBlobUrl(pdfId, 'view');
          if (active) {
            localBlobUrl = url;
            setBlobUrl(url);
          } else {
            URL.revokeObjectURL(url);
          }
        } catch {
          if (active) {
            setBlobUrl(pdfService.getViewUrl(pdfId));
          }
        }
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Failed to load document';
        setError(msg);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void fetchPdfData();

    return () => {
      active = false;
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [pdfId]);

  const handleDownload = async () => {
    if (!pdf || isDownloading) return;
    setIsDownloading(true);
    try {
      await pdfService.downloadPdfFile(pdf.id, pdf.originalName || `${pdf.title}.pdf`);
    } catch {
      window.open(pdfService.getDownloadUrl(pdf.id), '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenExternal = () => {
    if (!pdf) return;
    const targetUrl = blobUrl || pdfService.getViewUrl(pdf.id);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading document...</p>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/pdfs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft size={14} />
          Back to Study Material
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center max-w-lg mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Document Not Found</h3>
          <p className="mt-1 text-xs text-slate-500">{error || 'This PDF is not available.'}</p>
          <div className="mt-5">
            <Link
              href="/dashboard/pdfs"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Browse All Study Materials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}>
      {/* Top Navigation & Details */}
      {!isFullscreen && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href="/dashboard/pdfs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
            >
              <ArrowLeft size={14} />
              Back to Study Material
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isDownloading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>Download File</span>
              </button>

              <button
                type="button"
                onClick={handleOpenExternal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">Open in New Tab</span>
              </button>
            </div>
          </div>

          {/* Document Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-200">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {pdf.categoryName || 'General'}
                    </span>
                    <span className="text-xs text-slate-400">ID #{pdf.id}</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {pdf.title}
                  </h1>
                  {pdf.description && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
                      {pdf.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta information */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 text-xs text-slate-500 shrink-0">
                <div className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <HardDrive size={13} className="text-slate-400" />
                  <span>{formatFileSize(pdf.fileSize)}</span>
                </div>
                {pdf.createdAt && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    <span>{formatPdfDate(pdf.createdAt)}</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {pdf.originalName}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Viewer Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {/* Viewer Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold truncate">{pdf.title}</span>
            <span className="text-slate-400 hidden sm:inline">• Preview</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button
              type="button"
              onClick={handleOpenExternal}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Open in new tab"
            >
              <ExternalLink size={15} />
            </button>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div
          className={`w-full bg-slate-100 ${
            isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[750px]'
          }`}
        >
          {blobUrl ? (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title={pdf.title}
              className="w-full h-full border-none bg-slate-200"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400 text-xs">
              Loading preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
