import apiClient, { getData } from './apiClient';
import { ENDPOINTS } from '../constants/apiEndpoints';
import type {
  GetPdfCategoriesParams,
  GetPdfsParams,
  PdfCategory,
  PdfDocument,
  PdfListResponse,
  PdfPaginationMeta,
} from '../types/pdf';

type RawRecord = Record<string, unknown>;

const asRecord = (val: unknown): RawRecord =>
  val && typeof val === 'object' && !Array.isArray(val) ? (val as RawRecord) : {};

const asString = (val: unknown, fallback = ''): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number' && !Number.isNaN(val)) return String(val);
  return fallback;
};

const asNumber = (val: unknown, fallback = 0): number => {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = Number(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  return envUrl.replace(/\/+$/, '');
};

/**
 * Normalizes raw PDF document data from various backend response representations
 * (both snake_case from DB rows and camelCase from controller responses).
 */
export const normalizePdfDocument = (raw: unknown): PdfDocument => {
  const r = asRecord(raw);

  const id = asNumber(r.id, 0);
  const categoryId = asNumber(r.category_id ?? r.categoryId, 0);

  const rawCat = asRecord(r.category);
  const categoryName =
    asString(rawCat.name) ||
    asString(r.category_name) ||
    asString(r.categoryName) ||
    'General';

  const category = {
    id: asNumber(rawCat.id, categoryId),
    name: categoryName,
  };

  const title = asString(r.title) || asString(r.original_name) || asString(r.originalName) || 'Untitled Document';
  const description = r.description ? asString(r.description) : null;
  const fileName = asString(r.file_name) || asString(r.fileName) || '';
  const originalName = asString(r.original_name) || asString(r.originalName) || fileName || 'document.pdf';
  const filePath = asString(r.file_path) || asString(r.filePath) || '';
  const fileUrl = asString(r.file_url) || asString(r.fileUrl) || '';
  const fileSize = asNumber(r.file_size ?? r.fileSize, 0);
  const mimeType = asString(r.mime_type) || asString(r.mimeType) || 'application/pdf';
  const createdAt = asString(r.created_at) || asString(r.createdAt) || new Date().toISOString();
  const updatedAt = asString(r.updated_at) || asString(r.updatedAt) || undefined;

  const baseUrl = getBaseUrl();
  let fullUrl = asString(r.fullUrl) || asString(r.full_url);
  if (!fullUrl && fileUrl) {
    fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  }

  return {
    id,
    categoryId,
    categoryName,
    category,
    title,
    description,
    fileName,
    originalName,
    filePath,
    fileUrl,
    fileSize,
    mimeType,
    createdAt,
    updatedAt,
    fullUrl: fullUrl || null,
  };
};

/**
 * Normalizes raw category data
 */
export const normalizePdfCategory = (raw: unknown): PdfCategory => {
  const r = asRecord(raw);

  const id = asNumber(r.id, 0);
  const name = asString(r.name, 'Untitled Category');
  const description = r.description ? asString(r.description) : null;
  const createdAt = asString(r.created_at) || asString(r.createdAt) || undefined;
  const updatedAt = asString(r.updated_at) || asString(r.updatedAt) || undefined;

  const rawPdfs = Array.isArray(r.pdfs) ? r.pdfs : [];
  const pdfs = rawPdfs.map(normalizePdfDocument);
  const pdfCount = asNumber(r.pdfCount ?? r.pdf_count, pdfs.length);

  return {
    id,
    name,
    description,
    createdAt,
    updatedAt,
    pdfCount,
    pdfs,
  };
};

export const pdfService = {
  /**
   * Get all PDF categories with nested PDFs and pdfCount
   * GET /api/pdf-categories
   */
  async getAllCategories(params: GetPdfCategoriesParams = {}): Promise<PdfCategory[]> {
    const raw = await getData(ENDPOINTS.PDF_CATEGORIES, params as Record<string, unknown>);
    const rec = asRecord(raw);

    let list: unknown[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (Array.isArray(rec.data)) {
      list = rec.data;
    } else if (Array.isArray(rec.categories)) {
      list = rec.categories;
    }

    return list.map(normalizePdfCategory);
  },

  /**
   * Get a single category by ID with its nested PDFs
   * GET /api/pdf-categories/:id
   */
  async getCategoryById(id: number | string): Promise<PdfCategory> {
    const raw = await getData(`${ENDPOINTS.PDF_CATEGORIES}/${id}`);
    const rec = asRecord(raw);
    const target = rec.data ? rec.data : rec;
    return normalizePdfCategory(target);
  },

  /**
   * Get all PDFs belonging to a specific category
   * GET /api/pdf-categories/:id/pdfs
   */
  async getCategoryPdfs(
    categoryId: number | string,
  ): Promise<{ category: { id: number; name: string }; count: number; pdfs: PdfDocument[] }> {
    const raw = await getData(`${ENDPOINTS.PDF_CATEGORIES}/${categoryId}/pdfs`);
    const rec = asRecord(raw);

    const catRec = asRecord(rec.category);
    const category = {
      id: asNumber(catRec.id, Number(categoryId)),
      name: asString(catRec.name, 'Category'),
    };

    let list: unknown[] = [];
    if (Array.isArray(rec.data)) {
      list = rec.data;
    } else if (Array.isArray(raw)) {
      list = raw;
    }

    const pdfs = list.map(normalizePdfDocument);
    const count = asNumber(rec.count, pdfs.length);

    return { category, count, pdfs };
  },

  /**
   * Get all PDFs with optional filtering, search, and pagination
   * GET /api/pdfs
   */
  async getAllPdfs(params: GetPdfsParams = {}): Promise<PdfListResponse> {
    const raw = await getData(ENDPOINTS.PDFS, params as Record<string, unknown>);
    const rec = asRecord(raw);

    let list: unknown[] = [];
    let pagination: PdfPaginationMeta | undefined;

    if (Array.isArray(raw)) {
      list = raw;
    } else if (Array.isArray(rec.data)) {
      list = rec.data;
      if (rec.totalPages !== undefined || rec.total !== undefined) {
        pagination = {
          total: asNumber(rec.total, list.length),
          page: asNumber(rec.page, 1),
          limit: asNumber(rec.limit, list.length),
          totalPages: asNumber(rec.totalPages, 1),
        };
      }
    } else if (Array.isArray(rec.pdfs)) {
      list = rec.pdfs;
    }

    const data = list.map(normalizePdfDocument);
    const total = pagination?.total ?? asNumber(rec.total ?? rec.count, data.length);
    const count = asNumber(rec.count, data.length);

    return {
      data,
      pagination,
      total,
      count,
    };
  },

  /**
   * Get details for a single PDF
   * GET /api/pdfs/:id
   */
  async getPdfById(id: number | string): Promise<PdfDocument> {
    const raw = await getData(`${ENDPOINTS.PDFS}/${id}`);
    const rec = asRecord(raw);
    const target = rec.data ? rec.data : rec;
    return normalizePdfDocument(target);
  },

  /**
   * Generates direct view URL for inline preview in browser
   * GET /api/pdfs/:id/view
   */
  getViewUrl(id: number | string): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${ENDPOINTS.PDFS}/${id}/view`;
  },

  /**
   * Generates direct download URL
   * GET /api/pdfs/:id/download
   */
  getDownloadUrl(id: number | string): string {
    const baseUrl = getBaseUrl();
    return `${baseUrl}${ENDPOINTS.PDFS}/${id}/download`;
  },

  /**
   * Fetches the PDF file as a Blob using apiClient (carries auth headers)
   * and returns a localized object URL suitable for iframe / embed preview.
   * Remember to call URL.revokeObjectURL(url) when finished.
   */
  async getPdfBlobUrl(id: number | string, mode: 'view' | 'download' = 'view'): Promise<string> {
    const response = await apiClient.get<Blob>(`${ENDPOINTS.PDFS}/${id}/${mode}`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },

  /**
   * Downloads a PDF document programmatically using apiClient (with Bearer token)
   * falls back to window.open if blob download fails.
   */
  async downloadPdfFile(id: number | string, originalName?: string): Promise<void> {
    try {
      const response = await apiClient.get<Blob>(`${ENDPOINTS.PDFS}/${id}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = originalName || `document-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch {
      // Fallback to direct navigation / download URL
      const directUrl = this.getDownloadUrl(id);
      window.open(directUrl, '_blank');
    }
  },
};

/**
 * Format bytes to readable size (e.g. 1.25 MB, 450 KB)
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Format date for PDF metadata display
 */
export function formatPdfDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}
