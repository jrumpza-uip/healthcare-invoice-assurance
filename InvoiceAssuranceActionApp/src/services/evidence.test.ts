import { describe, expect, it, vi } from 'vitest';
import { buildEvidencePath, uploadEvidence } from './evidence';

describe('evidence upload', () => {
  it('builds an immutable, correlation-scoped bucket path', () => {
    const path = buildEvidencePath(
      'invoice-record-1',
      'correlation-1',
      'Safety Receipt (final).PDF',
      '2026-08-08T20:00:00.000Z',
    );

    expect(path).toBe(
      'evidence/invoice-record-1/correlation-1/20260808T200000000Z-safety-receipt-final.pdf',
    );
  });

  it('rejects unsupported evidence before calling the bucket service', async () => {
    const upload = vi.fn();
    const file = new File(['not a PDF'], 'note.txt', { type: 'text/plain' });

    await expect(
      uploadEvidence({ upload }, file, {
        bucketId: 204617,
        folderId: 2036001,
        invoiceRecordId: 'invoice-record-1',
        correlationId: 'correlation-1',
      }),
    ).rejects.toThrow(/PDF/i);
    expect(upload).not.toHaveBeenCalled();
  });

  it('uploads a PDF and returns immutable metadata', async () => {
    const upload = vi.fn().mockResolvedValue({ success: true, statusCode: 201 });
    const file = new File(['%PDF-test'], 'receipt.pdf', { type: 'application/pdf' });

    const metadata = await uploadEvidence({ upload }, file, {
      bucketId: 204617,
      folderId: 2036001,
      invoiceRecordId: 'invoice-record-1',
      correlationId: 'correlation-1',
      now: () => new Date('2026-08-08T20:00:00.000Z'),
      checksum: async () => 'sha256-test',
      evidenceId: () => 'evidence-test',
    });

    expect(upload).toHaveBeenCalledOnce();
    expect(metadata).toEqual({
      evidenceId: 'evidence-test',
      bucketPath: 'evidence/invoice-record-1/correlation-1/20260808T200000000Z-receipt.pdf',
      displayName: 'receipt.pdf',
      contentType: 'application/pdf',
      size: file.size,
      checksum: 'sha256-test',
      uploadedAt: '2026-08-08T20:00:00.000Z',
    });
  });
});
