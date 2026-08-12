import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PortfolioPage } from './PortfolioPage';
import type { InvoiceRecord } from '../services/invoice-records';

const invoices: InvoiceRecord[] = [
  {
    id: 'record-1', correlationId: 'corr-1', invoiceNumber: 'INV-101', supplierName: 'Alpha Health Build',
    invoiceDate: '2026-08-01', accountId: 'a', projectId: 'p', contractProfileId: 'c',
    processingStatus: 'ReviewerPending', submittedTotal: 1000, adjustmentTotal: 100, payableTotal: 900,
    openFindingCount: 2, awaitingEvidence: true, findings: [], documents: [], analysisVersion: 1,
  },
  {
    id: 'record-2', correlationId: 'corr-2', invoiceNumber: 'INV-102', supplierName: 'Beta Medical Works',
    invoiceDate: '2026-08-02', accountId: 'a', projectId: 'p', contractProfileId: 'c',
    processingStatus: 'Approved', submittedTotal: 500, adjustmentTotal: 0, payableTotal: 500,
    openFindingCount: 0, awaitingEvidence: false, findings: [], documents: [], analysisVersion: 1,
  },
];

describe('PortfolioPage', () => {
  it('derives portfolio metrics and rows from runtime records', () => {
    render(<MemoryRouter><PortfolioPage invoices={invoices} isLoading={false} error={null} onRetry={() => {}} /></MemoryRouter>);

    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('INV-101')).toBeInTheDocument();
    expect(screen.getByText('Beta Medical Works')).toBeInTheDocument();
  });
});
