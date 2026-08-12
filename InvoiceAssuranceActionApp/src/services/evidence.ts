import type { EvidenceReference } from '../models/action';

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export interface UploadRequest {
  bucketId: number;
  folderId: number;
  path: string;
  content: File;
}

export interface EvidenceUploader {
  upload(request: UploadRequest): Promise<{ success: boolean; statusCode: number }>;
}

export interface UploadContext {
  bucketId: number;
  folderId: number;
  invoiceRecordId: string;
  correlationId: string;
  now?: () => Date;
  checksum?: (file: File) => Promise<string>;
  evidenceId?: () => string;
}

function safeSegment(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

export function buildEvidencePath(
  invoiceRecordId: string,
  correlationId: string,
  fileName: string,
  timestamp: string,
): string {
  const normalizedTimestamp = timestamp.replace(/[-:.]/g, '');
  const normalizedFileName = safeSegment(fileName).replace(/-+\./g, '.');
  return `evidence/${safeSegment(invoiceRecordId)}/${safeSegment(correlationId)}/${normalizedTimestamp}-${normalizedFileName}`;
}

export async function sha256(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function uploadEvidence(
  uploader: EvidenceUploader,
  file: File,
  context: UploadContext,
): Promise<EvidenceReference> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) throw new Error('Evidence must be a PDF document.');
  if (file.size === 0) throw new Error('Evidence PDF is empty.');
  if (file.size > MAX_PDF_BYTES) throw new Error('Evidence PDF must be 20 MB or smaller.');

  const now = (context.now ?? (() => new Date()))();
  const bucketPath = buildEvidencePath(
    context.invoiceRecordId,
    context.correlationId,
    file.name,
    now.toISOString(),
  );
  const result = await uploader.upload({
    bucketId: context.bucketId,
    folderId: context.folderId,
    path: bucketPath,
    content: file,
  });
  if (!result.success) throw new Error(`Evidence upload failed with status ${result.statusCode}.`);

  return {
    evidenceId: (context.evidenceId ?? (() => crypto.randomUUID()))(),
    bucketPath,
    displayName: file.name,
    contentType: file.type || 'application/pdf',
    size: file.size,
    checksum: await (context.checksum ?? sha256)(file),
    uploadedAt: now.toISOString(),
  };
}
