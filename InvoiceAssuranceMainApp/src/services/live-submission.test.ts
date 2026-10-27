import { serializeFlowInput, submitAnalysis } from './live-submission';

describe('live submission orchestration', () => {
  it('serializes the exact Flow input contract for the Orchestrator SDK', () => {
    expect(serializeFlowInput({ invoiceRecordId: 'record-1', correlationId: 'corr-1', contractProfileId: 'profile-1', sourceDocumentIds: ['a.pdf'], forceManagerReview: true }))
      .toBe('{"invoiceRecordId":"record-1","correlationId":"corr-1","contractProfileId":"profile-1","sourceDocumentIds":["a.pdf"],"forceManagerReview":true}');
  });

  it('uploads the package, creates one record, starts one Flow, and links the instance', async () => {
    const calls: string[] = [];
    const file = new File(['invoice'], 'Invoice 42.pdf', { type: 'application/pdf' });

    const result = await submitAnalysis({
      invoiceFiles: [file],
      supportFiles: [],
      accountId: 'account-1',
      projectId: 'project-1',
      contractProfileId: 'profile-1',
      forceManagerReview: true,
    }, {
      createCorrelationId: () => 'corr-123',
      uploadDocument: async ({ path }) => {
        calls.push(`upload:${path}`);
        return { path, type: 'invoice', name: 'Invoice 42.pdf' };
      },
      createInvoiceRecord: async (record) => {
        calls.push(`create:${record.CorrelationId}`);
        return { id: 'record-1' };
      },
      startFlow: async (input) => {
        calls.push(`start:${input.invoiceRecordId}:${input.sourceDocumentIds[0]}`);
        return { instanceId: '771' };
      },
      linkProcessInstance: async (recordId, instanceId) => {
        calls.push(`link:${recordId}:${instanceId}`);
      },
      now: () => new Date('2026-08-09T12:00:00Z'),
    });

    expect(calls).toEqual([
      'upload:corr-123/invoice/Invoice-42.pdf',
      'create:corr-123',
      'start:record-1:corr-123/invoice/Invoice-42.pdf',
      'link:record-1:771',
    ]);
    expect(result).toEqual({ invoiceRecordId: 'record-1', correlationId: 'corr-123', processInstanceId: '771' });
  });
});
