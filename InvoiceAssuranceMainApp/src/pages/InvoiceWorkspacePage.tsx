import { Alert, AlertDescription } from '@uipath/apollo-wind/components/ui/alert';
import { Badge } from '@uipath/apollo-wind/components/ui/badge';
import { Button } from '@uipath/apollo-wind/components/ui/button';
import { Skeleton } from '@uipath/apollo-wind/components/ui/skeleton';
import { Activity, ArrowDownRight, FileCheck2, ListChecks, RefreshCw } from 'lucide-react';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { useDocumentViewer } from '../hooks/useDocumentViewer';
import { PLATFORM } from '../services/platform';
import type { ActivityEvent, InvoiceLineItem, InvoiceRecord } from '../services/invoice-records';
import { formatStatusLabel, statusVariant } from '../utils/status';
import type { ProcessVariable } from '../utils/process-state';

interface InvoiceWorkspacePageProps {
  invoice: InvoiceRecord | null;
  lineItems: InvoiceLineItem[];
  activities: ActivityEvent[];
  taskEmbedUrl: string | null;
  processVariables: ProcessVariable[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  getDocumentUrl: (bucketName: string, path: string) => Promise<string>;
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function InvoiceWorkspacePage(props: InvoiceWorkspacePageProps) {
  if (props.isLoading && !props.invoice) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  if (!props.invoice) return <Alert variant="destructive"><AlertDescription>{props.error ?? 'Invoice record not found.'} <button className="underline" onClick={props.onRetry}>Retry</button></AlertDescription></Alert>;
  const invoice = props.invoice;
  const { viewer, open, close } = useDocumentViewer(props.getDocumentUrl);

  return <div className="space-y-6">
    <section className="workspace-header"><div><p className="eyebrow">Invoice workspace · Analysis v{invoice.analysisVersion}</p><h2 className="page-title">{invoice.processInstanceId ?? invoice.invoiceNumber}</h2><p className="page-subtitle">{invoice.supplierName} · {invoice.projectId}</p></div><div className="status-cluster"><Badge variant={statusVariant(invoice.processingStatus)}>{formatStatusLabel(invoice.processingStatus)}</Badge><Button variant="outline" size="sm" onClick={props.onRetry}><RefreshCw className="h-4 w-4" /> Refresh</Button></div></section>
    {props.error && <Alert variant="destructive"><AlertDescription>{props.error}</AlertDescription></Alert>}
    <section className="financial-strip"><Financial label="Submitted" value={invoice.submittedTotal} /><ArrowDownRight className="h-5 w-5" /><Financial label="Adjustments" value={invoice.adjustmentTotal} emphasis="orange" /><Financial label="Proposed payable" value={invoice.payableTotal} emphasis="teal" /></section>
    <div className="workspace-grid">
      <main className="space-y-6">
        <section className="panel"><div className="panel-heading"><div><h3>Findings</h3><p>{invoice.openFindingCount} currently open</p></div><ListChecks className="h-5 w-5" /></div><div className="finding-list">{invoice.findings.length ? invoice.findings.map((finding, index) => {
          const explanation = String(finding.explanation ?? finding.title ?? finding.findingId ?? 'Finding');
          const category = finding.category ? String(finding.category) : '';
          const severity = finding.severity ? String(finding.severity) : '';
          return <article key={String(finding.findingId ?? index)} className="finding-row">
            <div>
              {(category || severity) && <div className="finding-tags">{severity && <Badge variant={severity.toLowerCase() === 'high' ? 'destructive' : 'secondary'}>{severity}</Badge>}{category && <Badge variant="secondary">{category}</Badge>}</div>}
              <strong>{explanation}</strong>
              <span>{String(finding.status ?? 'Open')}</span>
            </div>
            <b>{currency.format(Number(finding.adjustment ?? 0))}</b>
          </article>;
        }) : <p className="muted-copy">No findings recorded.</p>}</div></section>
        <section className="panel"><div className="panel-heading"><div><h3>Canonical charges</h3><p>Extraction, reconciliation, and financial evaluation</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Description</th><th>Category</th><th>Submitted</th><th>Adjustment</th><th>Status</th></tr></thead><tbody>{props.lineItems.map((item) => <tr key={item.id}><td>{item.description}</td><td>{item.category}</td><td>{currency.format(item.submittedAmount)}</td><td>{currency.format(item.adjustment)}</td><td><Badge variant="secondary">{item.evaluationStatus}</Badge></td></tr>)}</tbody></table></div></section>
        <section className="panel"><div className="panel-heading"><div><h3>Activity timeline</h3><p>Automated and human events</p></div><Activity className="h-5 w-5" /></div><ol className="timeline">{props.activities.map((event) => <li key={event.id}><span className="timeline-dot" /><div><time>{new Date(event.eventTimestamp).toLocaleString()}</time><strong>{event.eventName}</strong><p>{event.summary}</p><small>{event.eventSource} · {event.eventType}</small></div></li>)}</ol></section>
      </main>
      <aside className="space-y-6">
        <section className="panel"><div className="panel-heading"><div><h3>Documents</h3><p>Immutable source references</p></div><FileCheck2 className="h-5 w-5" /></div><ul className="document-list">{invoice.documents.map((document) => {
          const name = document.name ?? document.path.split('/').at(-1) ?? document.path;
          return <li key={document.path}>
            <button type="button" className="document-link" onClick={() => void open(PLATFORM.uploadBucketName, document.path, name)}>{name}</button>
            <span>{document.type}</span>
          </li>;
        })}</ul></section>
        {props.taskEmbedUrl ? <section className="task-panel"><div className="panel-heading"><div><h3>Active review task</h3><p>Correlated by process instance only</p></div></div><iframe title="Action Center task" src={props.taskEmbedUrl} /></section> : <section className="panel"><div className="panel-heading"><div><h3>Process state</h3><p>No active human task</p></div></div><dl className="variable-list">{props.processVariables.map((variable) => <div key={variable.id}><dt>{variable.name}</dt><dd>{String(variable.value ?? '—')}</dd></div>)}</dl></section>}
      </aside>
    </div>
    {viewer && <DocumentViewerModal name={viewer.name} url={viewer.url} isLoading={viewer.isLoading} error={viewer.error} onClose={close} />}
  </div>;
}

function Financial({ label, value, emphasis }: { label: string; value: number; emphasis?: 'orange' | 'teal' }) { return <div className={emphasis ? `financial-${emphasis}` : ''}><span>{label}</span><strong>{currency.format(value)}</strong></div>; }
