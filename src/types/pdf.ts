export interface PdfCategory {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  pdfCount: number;
  pdfs?: PdfDocument[];
}

export interface PdfDocument {
  id: number;
  categoryId: number;
  categoryName?: string;
  category?: {
    id: number;
    name: string;
  };
  title: string;
  description?: string | null;
  fileName: string;
  originalName: string;
  filePath?: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt?: string;
  fullUrl?: string | null;
}

export interface PdfPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PdfListResponse {
  data: PdfDocument[];
  pagination?: PdfPaginationMeta;
  count?: number;
  total?: number;
}

export interface GetPdfsParams {
  categoryId?: number | string;
  categoryName?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'title' | 'created_at' | 'updated_at' | 'file_size';
  order?: 'ASC' | 'DESC';
}

export interface GetPdfCategoriesParams {
  search?: string;
  includePdfs?: boolean;
  sortBy?: 'id' | 'name' | 'created_at' | 'updated_at';
  order?: 'ASC' | 'DESC';
}
