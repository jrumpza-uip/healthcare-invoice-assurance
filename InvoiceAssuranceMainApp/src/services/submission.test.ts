import { validateSubmission } from './submission';

describe('new analysis validation', () => {
  const valid = {
    invoiceFiles: [new File(['pdf'], 'invoice.pdf', { type: 'application/pdf' })],
    supportFiles: [new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' })],
    accountId: 'ACCT-1007',
    projectId: 'PRJ-HEALTH-204',
    contractProfileId: 'CP-HEALTH-FACILITY-2026',
    forceManagerReview: true,
  };

  it('accepts a complete supported package', () => {
    expect(validateSubmission(valid)).toEqual({});
  });

  it('reports every missing required selection without discarding selected files', () => {
    expect(validateSubmission({ ...valid, accountId: '', projectId: '', contractProfileId: '' })).toEqual({
      accountId: 'Select an account.',
      projectId: 'Select a project.',
      contractProfileId: 'Select a Contract Profile.',
    });
  });

  it('rejects unsupported and oversized files', () => {
    const invalid = new File(['x'], 'payload.exe', { type: 'application/octet-stream' });
    Object.defineProperty(invalid, 'size', { value: 26 * 1024 * 1024 });

    expect(validateSubmission({ ...valid, invoiceFiles: [invalid] })).toEqual({
      invoiceFiles: 'Use PDF, PNG, or JPEG files no larger than 25 MB each.',
    });
  });
});
