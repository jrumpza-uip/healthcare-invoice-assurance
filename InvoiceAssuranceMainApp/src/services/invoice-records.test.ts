import { buildInitialInvoiceRecord, mapActivityEvent, mapInvoiceLineItem, mapInvoiceRecord } from './invoice-records';

describe('invoice entity mapping', () => {
  it('maps the exact folder-scoped Data Fabric field names to the UI model', () => {
    expect(mapInvoiceRecord({
      Id: 'record-1',
      CorrelationId: 'corr-1',
      ProcessInstanceId: '771',
      InvoiceNumber: 'INV-42',
      SupplierName: 'Example Supplier',
      InvoiceDate: '2026-08-01',
      AccountId: 'account-1',
      ProjectId: 'project-1',
      ContractProfileId: 'profile-1',
      ProcessingStatus: 'ReviewerPending',
      SubmittedTotal: 1000,
      AdjustmentTotal: 125,
      PayableTotal: 875,
      OpenFindingCount: 2,
      AwaitingEvidence: true,
      FindingsJson: '[{"findingId":"F-1","title":"Missing evidence"}]',
      DocumentReferencesJson: '[{"path":"corr-1/invoice.pdf"}]',
      AnalysisVersion: 3,
      UpdateTime: '2026-08-09T17:30:00Z',
    })).toMatchObject({
      id: 'record-1',
      processInstanceId: '771',
      submittedTotal: 1000,
      findings: [{ findingId: 'F-1', title: 'Missing evidence' }],
      documents: [{ path: 'corr-1/invoice.pdf' }],
      analysisVersion: 3,
    });
  });

  it('does not crash the portfolio on malformed optional findings JSON', () => {
    expect(mapInvoiceRecord({ Id: 'record-1', FindingsJson: 'not-json' }).findings).toEqual([]);
  });

  it('creates a neutral pre-extraction record without invoice-specific assumptions', () => {
    expect(buildInitialInvoiceRecord({
      correlationId: 'corr-123',
      accountId: 'account-1',
      projectId: 'project-1',
      contractProfileId: 'profile-1',
      documentReferences: [{ path: 'corr-123/invoice.pdf', type: 'invoice' }],
      submittedAt: new Date('2026-08-09T12:00:00Z'),
    })).toEqual({
      CorrelationId: 'corr-123',
      InvoiceNumber: 'Pending extraction · corr-123',
      SupplierName: 'Pending extraction',
      InvoiceDate: '2026-08-09',
      AccountId: 'account-1',
      ProjectId: 'project-1',
      ContractProfileId: 'profile-1',
      ProcessingStatus: 'Submitted',
      SubmittedTotal: 0,
      AdjustmentTotal: 0,
      PayableTotal: 0,
      OpenFindingCount: 0,
      AwaitingEvidence: false,
      DocumentReferencesJson: '[{"path":"corr-123/invoice.pdf","type":"invoice"}]',
      AnalysisVersion: 1,
    });
  });

  it('maps line-item and activity fields without parsing UI text', () => {
    expect(mapInvoiceLineItem({ Id: 'line-1', Description: 'Concrete', Category: 'material', SubmittedAmount: 250, Adjustment: 15, EvaluationStatus: 'Adjusted' })).toEqual({
      id: 'line-1', description: 'Concrete', category: 'material', submittedAmount: 250, adjustment: 15, evaluationStatus: 'Adjusted',
    });
    expect(mapActivityEvent({ Id: 'event-1', EventTimestamp: '2026-08-09T12:00:00Z', EventName: 'Analysis completed', EventType: 'Analysis', EventSource: 'Agent', Summary: 'Two findings produced' })).toEqual({
      id: 'event-1', eventTimestamp: '2026-08-09T12:00:00Z', eventName: 'Analysis completed', eventType: 'Analysis', eventSource: 'Agent', summary: 'Two findings produced',
    });
  });
});
