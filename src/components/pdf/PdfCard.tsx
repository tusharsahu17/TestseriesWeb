'use client';

import { useState } from 'react';
import {
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileText,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { formatFileSize, formatPdfDate, pdfService } from '../../services/pdfService';
import type { PdfDocument } from '../../types/pdf';

interface PdfCardProps {
  pdf: PdfDocument;
  onPreview: (pdf: PdfDocument) => void;
  viewMode?: 'grid' | 'list';
}

export function PdfCard({ pdf, onPreview, viewMode = 'grid' }: PdfCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await pdfService.downloadPdfFile(pdf.id, pdf.originalName || `${pdf.title}.pdf`);
    } catch {
      window.open(pdfService.getDownloadUrl(pdf.id), '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(pdfService.getViewUrl(pdf.id), '_blank', 'noopener,noreferrer');
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onPreview(pdf)}
        className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-200 group-hover:scale-105 transition-transform duration-200">
            <FileText size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                {pdf.categoryName || 'General'}
              </span>
              {pdf.createdAt && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar size={12} />
                  {formatPdfDate(pdf.createdAt)}
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {pdf.title}
            </h3>

            {pdf.description && (
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                {pdf.description}
              </p>
            )}

            <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="truncate max-w-[200px]">{pdf.originalName}</span>
              {pdf.fileSize > 0 && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                    <HardDrive size={11} />
                    {formatFileSize(pdf.fileSize)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(pdf);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 px-3.5 py-2 text-xs font-semibold transition cursor-pointer"
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition cursor-pointer"
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
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
            title="Open in new tab"
          >
            <ExternalLink size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Grid Card View
  return (
    <div
      onClick={() => onPreview(pdf)}
      className="group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 overflow-hidden cursor-pointer p-5"
    >
      <div>
        {/* Top Badges & External Link */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-block rounded-md bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 truncate max-w-[70%]">
            {pdf.categoryName || 'General'}
          </span>
          <button
            type="button"
            onClick={handleOpenExternal}
            className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </button>
        </div>

        {/* Title and Icon */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm shadow-rose-200 group-hover:scale-105 transition-transform duration-200">
            <FileText size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
              {pdf.title}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400 truncate">
              {pdf.originalName}
            </p>
          </div>
        </div>

        {/* Description if present */}
        {pdf.description ? (
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {pdf.description}
          </p>
        ) : (
          <div className="mb-4" />
        )}
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1 font-medium text-slate-500">
            <HardDrive size={12} />
            {formatFileSize(pdf.fileSize)}
          </span>
          {pdf.createdAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} />
              {formatPdfDate(pdf.createdAt)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(pdf);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 py-2 text-xs font-semibold transition cursor-pointer"
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            {isDownloading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
