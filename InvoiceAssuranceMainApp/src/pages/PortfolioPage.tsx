import { Alert, AlertDescription } from '@uipath/apollo-wind/components/ui/alert';
import { Badge } from '@uipath/apollo-wind/components/ui/badge';
import { Button } from '@uipath/apollo-wind/components/ui/button';
import { Skeleton } from '@uipath/apollo-wind/components/ui/skeleton';
import { ArrowRight, CircleDollarSign, FileWarning, ReceiptText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InvoiceRecord } from '../services/invoice-records';
import { formatStatusLabel, statusVariant } from '../utils/status';

interface PortfolioPageProps {
  invoices: InvoiceRecord[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function PortfolioPage({ invoices, isLoading, error, onRetry }: PortfolioPageProps) {
  const submitted = invoices.reduce((sum, invoice) => sum + invoice.submittedTotal, 0);
  const adjustments = invoices.reduce((sum, invoice) => sum + invoice.adjustmentTotal, 0);
  const openFindings = invoices.reduce((sum, invoice) => sum + invoice.openFindingCount, 0);
  const awaiting = invoices.filter((invoice) => invoice.awaitingEvidence).length;

  if (isLoading && invoices.length === 0) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Portfolio assurance</p>
          <h2 className="page-title">Invoice review command center</h2>
          <p className="page-subtitle">Live financial exposure, evidence state, and human-review progress from UiPath.</p>
        </div>
        <Button asChild><Link to="/new">Start new analysis <ArrowRight className="h-4 w-4" /></Link></Button>
      </section>

      {error && <Alert variant="destructive"><AlertDescription>{error} <button className="underline" onClick={onRetry}>Retry</button></AlertDescription></Alert>}

      <section className="metric-grid" aria-label="Portfolio metrics">
        <Metric icon={ReceiptText} label="Submitted value" value={currency.format(submitted)} tone="teal" />
        <Metric icon={CircleDollarSign} label="Proposed adjustments" value={currency.format(adjustments)} tone="orange" />
        <Metric icon={FileWarning} label="Open findings" value={String(openFindings)} />
        <Metric icon={ShieldCheck} label="Awaiting evidence" value={String(awaiting)} />
      </section>

      <section className="panel overflow-hidden">
        <div className="panel-heading"><div><h3>Recent invoices</h3><p>Folder-scoped records in AMER Presales/HLS</p></div></div>
        {invoices.length === 0 ? (
          <div className="empty-state"><ReceiptText className="h-9 w-9" /><h3>No analyses yet</h3><p>Upload an invoice package to begin.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Invoice</th><th>Supplier</th><th>Status</th><th>Submitted</th><th>Payable</th><th>Findings</th><th><span className="sr-only">Open</span></th></tr></thead>
              <tbody>{invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td><strong>{invoice.processInstanceId ?? invoice.invoiceNumber}</strong><span>{invoice.invoiceDate}</span></td>
                  <td>{invoice.supplierName}</td>
                  <td><Badge variant={statusVariant(invoice.processingStatus)}>{formatStatusLabel(invoice.processingStatus)}</Badge></td>
                  <td>{currency.format(invoice.submittedTotal)}</td>
                  <td>{currency.format(invoice.payableTotal)}</td>
                  <td>{invoice.openFindingCount}</td>
                  <td><Button asChild variant="ghost" size="sm"><Link to={`/invoices/${invoice.id}`}>Review <ArrowRight className="h-4 w-4" /></Link></Button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof ReceiptText; label: string; value: string; tone?: 'teal' | 'orange' }) {
  return <div className={`metric-card ${tone ? `metric-${tone}` : ''}`}><div className="metric-icon"><Icon className="h-5 w-5" /></div><span>{label}</span><strong>{value}</strong></div>;
}
