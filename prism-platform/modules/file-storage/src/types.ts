// ──────────────────────────────────────────
// File Storage Types
// ──────────────────────────────────────────

export type StorageBucket = 'audit-evidence' | 'attachments' | 'documents' | 'signatures';

export interface FileUploadRequest {
  bucket: StorageBucket;
  fileName: string;
  mimeType: string;
  companyId: string;
  uploadedBy: string;
  data: Buffer | Uint8Array;
}

export interface FileUploadResult {
  id: string;
  bucket: StorageBucket;
  path: string;
  publicUrl: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface FileMetadata {
  id: string;
  bucket: StorageBucket;
  path: string;
  fileName: string;
  mimeType: string;
  size: number;
  companyId: string;
  uploadedBy: string;
  uploadedAt: string;
}
