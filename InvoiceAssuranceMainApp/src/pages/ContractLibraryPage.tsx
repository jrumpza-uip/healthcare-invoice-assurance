import { Badge } from '@uipath/apollo-wind/components/ui/badge';
import { BookOpenCheck, Layers3 } from 'lucide-react';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { useDocumentViewer } from '../hooks/useDocumentViewer';
import { PLATFORM } from '../services/platform';

const documents = [
  ['00', 'Contract Library Index', 'Index', '2026-07-01', 'Precedence map', '00_Contract_Library_Index.pdf'],
  ['01', 'Master Construction Services Agreement', 'Master agreement', '2024-01-01', 'Base terms', '01_Master_Construction_Services_Agreement.pdf'],
  ['02', 'Revised and Restated Agreement', 'Restatement', '2025-01-01', 'Supersedes base where applicable', '02_Revised_and_Restated_Agreement.pdf'],
  ['03', 'Amendment 01 · Labor Rates', 'Amendment', '2026-01-01', 'Labor topics', '03_Amendment_01_Labor_Rates.pdf'],
  ['04', 'Amendment 02 · Equipment Rates', 'Amendment', '2026-03-01', 'Equipment topics', '04_Amendment_02_Equipment_Rates.pdf'],
  ['05', 'Amendment 03 · Evidence and Eligibility', 'Amendment', '2026-05-01', 'Evidence topics', '05_Amendment_03_Evidence_and_Eligibility.pdf'],
  ['06', 'July 2026 Project Addendum', 'Project addendum', '2026-07-01', 'Project-specific topics', '06_July_2026_Project_Addendum.pdf'],
] as const;

interface ContractLibraryPageProps {
  getDocumentUrl: (bucketName: string, path: string) => Promise<string>;
}

export function ContractLibraryPage({ getDocumentUrl }: ContractLibraryPageProps) {
  const { viewer, open, close } = useDocumentViewer(getDocumentUrl);

  return <div className="space-y-8"><section><p className="eyebrow">Governed source stack</p><h2 className="page-title">Contract library</h2><p className="page-subtitle">Read-only metadata for the indexed West Pavilion Contract Profile. Runtime analysis retrieves clause evidence from UiPath Context Grounding.</p></section>
    <section className="contract-banner"><div className="contract-banner-icon"><BookOpenCheck className="h-6 w-6" /></div><div><strong>West Pavilion · 2026 governed stack</strong><p>Topic-specific precedence · effective-on-or-before invoice date</p></div><Badge variant="secondary">7 indexed sources</Badge></section>
    <section className="panel overflow-hidden"><div className="panel-heading"><div><h3>Effective document stack</h3><p>Contract Profile: profile-west-pavilion</p></div><Layers3 className="h-5 w-5" /></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Order</th><th>Document</th><th>Type</th><th>Effective</th><th>Precedence role</th></tr></thead><tbody>{documents.map(([order, title, type, effective, role, path]) => <tr key={order}><td><span className="order-chip">{order}</span></td><td><button type="button" className="document-link" onClick={() => void open(PLATFORM.contractBucketName, path, title)}>{title}</button></td><td>{type}</td><td>{effective}</td><td>{role}</td></tr>)}</tbody></table></div></section>
    {viewer && <DocumentViewerModal name={viewer.name} url={viewer.url} isLoading={viewer.isLoading} error={viewer.error} onClose={close} />}
  </div>;
}
