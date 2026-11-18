"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  FileCheck2,
  FileText,
  Grid3X3,
  HardDrive,
  LayoutList,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PdfCard } from "../../../components/pdf/PdfCard";
import { PdfViewerModal } from "../../../components/pdf/PdfViewerModal";
import { formatFileSize, pdfService } from "../../../services/pdfService";
import type { PdfCategory, PdfDocument } from "../../../types/pdf";

type SortOption =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc"
  | "size-desc"
  | "size-asc";

function PdfsContent() {
  const searchParams = useSearchParams();
  const categoryParam =
    searchParams.get("category") || searchParams.get("categoryId");

  const [categories, setCategories] = useState<PdfCategory[]>([]);
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const [selectedCategoryOverride, setSelectedCategoryOverride] = useState<
    string | null
  >(null);
  const selectedCategoryId =
    selectedCategoryOverride ?? (categoryParam || "ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active modal preview state
  const [previewPdf, setPreviewPdf] = useState<PdfDocument | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Fetch categories with nested PDFs (one efficient call)
      const fetchedCategories = await pdfService.getAllCategories({
        includePdfs: true,
      });
      setCategories(fetchedCategories);

      // Also fetch all PDFs list
      const pdfResponse = await pdfService.getAllPdfs();
      let allPdfs = pdfResponse.data;

      // If backend getAllPdfs returned empty but categories had PDFs, aggregate from categories
      if (allPdfs.length === 0 && fetchedCategories.length > 0) {
        const aggregated: PdfDocument[] = [];
        for (const cat of fetchedCategories) {
          if (cat.pdfs && cat.pdfs.length > 0) {
            aggregated.push(...cat.pdfs);
          }
        }
        allPdfs = aggregated;
      }

      setPdfs(allPdfs);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load study material";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadData();
  };

  // Filter & Sort
  const filteredPdfs = useMemo(() => {
    let result = [...pdfs];

    // Category filter
    if (selectedCategoryId !== "ALL") {
      const catIdNum = Number(selectedCategoryId);
      result = result.filter(
        (p) =>
          p.categoryId === catIdNum ||
          String(p.categoryId) === selectedCategoryId ||
          p.categoryName?.toLowerCase() === selectedCategoryId.toLowerCase(),
      );
    }

    // Search query filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.originalName.toLowerCase().includes(query) ||
          p.categoryName?.toLowerCase().includes(query),
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "size-desc":
          return (b.fileSize || 0) - (a.fileSize || 0);
        case "size-asc":
          return (a.fileSize || 0) - (b.fileSize || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [pdfs, selectedCategoryId, searchQuery, sortBy]);

  // Total stats
  const totalPdfsCount = pdfs.length;
  const totalCategoriesCount = categories.length;
  const totalStorageBytes = pdfs.reduce((acc, p) => acc + (p.fileSize || 0), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">
          Loading study material and PDFs...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="dashboard-welcome">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <FileText size={16} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Learning Resources
            </span>
          </div>
          <h1>Study Material & Documents</h1>
          <p>
            Browse and download question papers, syllabus, revision notes,
            formula sheets, and solution PDFs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="dashboard-date-btn cursor-pointer hover:bg-slate-50"
            title="Refresh documents"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            <HardDrive size={14} className="text-indigo-600" />
            <span>{formatFileSize(totalStorageBytes)} Total</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-200 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileCheck2 size={22} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {totalPdfsCount}
            </div>
            <div className="text-xs font-medium text-slate-500">
              Available PDFs
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {totalCategoriesCount}
            </div>
            <div className="text-xs font-medium text-slate-500">Categories</div>
          </div>
        </div>

        {/* <div className="col-span-2 sm:col-span-1 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <HardDrive size={22} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatFileSize(totalStorageBytes)}
            </div>
            <div className="text-xs font-medium text-slate-500">Study Resources</div>
          </div>
        </div> */}
      </div>

      {/* Categories Filter Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Filter by Category
          </span>
          {selectedCategoryId !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedCategoryOverride("ALL")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Show all ({totalPdfsCount})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryOverride("ALL")}
            className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              selectedCategoryId === "ALL"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>All Documents</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                selectedCategoryId === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {totalPdfsCount}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected =
              selectedCategoryId === String(cat.id) ||
              selectedCategoryId.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryOverride(String(cat.id))}
                className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {cat.pdfCount || (cat.pdfs ? cat.pdfs.length : 0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search, Sort, and View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by title, description, or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Right side controls: Sort & View Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title: A to Z</option>
              <option value="title-desc">Title: Z to A</option>
              <option value="size-desc">Size: Largest First</option>
              <option value="size-asc">Size: Smallest First</option>
            </select>
          </div>

          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid view"
            >
              <Grid3X3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="List view"
            >
              <LayoutList size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* PDF List / Grid */}
      {filteredPdfs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
            <FileText size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No documents found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No PDFs matched your search "${searchQuery}". Try different keywords or clear your search.`
              : "There are currently no study documents uploaded in this category."}
          </p>
          {(searchQuery || selectedCategoryId !== "ALL") && (
            <div className="mt-4 flex justify-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              {selectedCategoryId !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryOverride("ALL")}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
                >
                  View All Categories
                </button>
              )}
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredPdfs.map((pdf) => (
            <PdfCard
              key={pdf.id}
              pdf={pdf}
              onPreview={(item) => setPreviewPdf(item)}
              viewMode="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPdfs.map((pdf) => (
            <PdfCard
              key={pdf.id}
              pdf={pdf}
              onPreview={(item) => setPreviewPdf(item)}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {/* PDF In-Browser Preview Modal */}
      <PdfViewerModal
        pdf={previewPdf}
        isOpen={Boolean(previewPdf)}
        onClose={() => setPreviewPdf(null)}
      />
    </div>
  );
}

export default function PdfsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium text-slate-500">
            Loading study material...
          </p>
        </div>
      }
    >
      <PdfsContent />
    </Suspense>
  );
}
