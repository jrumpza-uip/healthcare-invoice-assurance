import { render, screen } from '@testing-library/react';
import { InvoiceWorkspacePage } from './InvoiceWorkspacePage';
import type { InvoiceRecord } from '../services/invoice-records';

describe('InvoiceWorkspacePage', () => {
  it('renders runtime-derived invoice, finding, line-item, activity, and correlated task data', () => {
    const invoice: InvoiceRecord = {
      id: 'record-1', correlationId: 'corr-1', processInstanceId: '771', invoiceNumber: 'INV-101',
      supplierName: 'Alpha Health Build', invoiceDate: '2026-08-01', accountId: 'a', projectId: 'p',
      contractProfileId: 'c', processingStatus: 'ReviewerPending', submittedTotal: 1000,
      adjustmentTotal: 100, payableTotal: 900, openFindingCount: 1, awaitingEvidence: true,
      findings: [{ findingId: 'F-1', title: 'Unsupported charge', status: 'Open', adjustment: 100 }],
      documents: [{ path: 'corr-1/invoice/invoice.pdf', type: 'invoice', name: 'invoice.pdf' }], analysisVersion: 2,
    };

    render(<InvoiceWorkspacePage
      invoice={invoice}
      lineItems={[{ id: 'line-1', description: 'Site supervision', category: 'labor', submittedAmount: 1000, adjustment: 100, evaluationStatus: 'Adjusted' }]}
      activities={[{ id: 'event-1', eventTimestamp: '2026-08-09T12:00:00Z', eventName: 'Reviewer task created', eventType: 'HITL', eventSource: 'InvoiceAssuranceFlow', summary: 'Waiting for review' }]}
      taskEmbedUrl="https://cloud.uipath.com/embed_/uipathlabs/Playground/actions_/current-task/tasks/41"
      processVariables={[]}
      isLoading={false}
      error={null}
      onRetry={() => {}}
      getDocumentUrl={async () => 'blob:mock-url'}
    />);

    expect(screen.getByText('Unsupported charge')).toBeInTheDocument();
    expect(screen.getByText('Site supervision')).toBeInTheDocument();
    expect(screen.getByText('Waiting for review')).toBeInTheDocument();
    expect(screen.getByTitle('Action Center task')).toHaveAttribute('src', expect.stringContaining('/tasks/41'));
  });
});
