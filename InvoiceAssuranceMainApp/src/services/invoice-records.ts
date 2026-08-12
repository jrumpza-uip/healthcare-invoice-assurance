export interface DocumentReference {
  path: string;
  type: string;
  name?: string;
  checksum?: string;
}

export interface FindingSummary {
  findingId?: string;
  title?: string;
  status?: string;
  adjustment?: number;
  [key: string]: unknown;
}

export interface InvoiceRecord {
  id: string;
  correlationId: string;
  processInstanceId?: string;
  invoiceNumber: string;
  supplierName: string;
  invoiceDate: string;
  accountId: string;
  projectId: string;
  contractProfileId: string;
  processingStatus: string;
  submittedTotal: number;
  adjustmentTotal: number;
  payableTotal: number;
  openFindingCount: number;
  awaitingEvidence: boolean;
  findings: FindingSummary[];
  documents: DocumentReference[];
  analysisVersion: number;
  updatedAt?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: string;
  submittedAmount: number;
  adjustment: number;
  evaluationStatus: string;
}

export interface ActivityEvent {
  id: string;
  eventTimestamp: string;
  eventName: string;
  eventType: string;
  eventSource: string;
  summary: string;
}

export function mapInvoiceLineItem(raw: Record<string, unknown>): InvoiceLineItem {
  return {
    id: String(raw.Id ?? ''),
    description: String(raw.Description ?? ''),
    category: String(raw.Category ?? ''),
    submittedAmount: Number(raw.SubmittedAmount ?? 0),
    adjustment: Number(raw.Adjustment ?? 0),
    evaluationStatus: String(raw.EvaluationStatus ?? 'Unknown'),
  };
}

export function mapActivityEvent(raw: Record<string, unknown>): ActivityEvent {
  return {
    id: String(raw.Id ?? ''),
    eventTimestamp: String(raw.EventTimestamp ?? ''),
    eventName: String(raw.EventName ?? ''),
    eventType: String(raw.EventType ?? ''),
    eventSource: String(raw.EventSource ?? ''),
    summary: String(raw.Summary ?? ''),
  };
}

function parseArray<T>(value: unknown): T[] {
  if (typeof value !== 'string' || value.length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export function mapInvoiceRecord(raw: Record<string, unknown>): InvoiceRecord {
  return {
    id: String(raw.Id ?? ''),
    correlationId: String(raw.CorrelationId ?? ''),
    processInstanceId: raw.ProcessInstanceId ? String(raw.ProcessInstanceId) : undefined,
    invoiceNumber: String(raw.InvoiceNumber ?? ''),
    supplierName: String(raw.SupplierName ?? ''),
    invoiceDate: String(raw.InvoiceDate ?? ''),
    accountId: String(raw.AccountId ?? ''),
    projectId: String(raw.ProjectId ?? ''),
    contractProfileId: String(raw.ContractProfileId ?? ''),
    processingStatus: String(raw.ProcessingStatus ?? 'Unknown'),
    submittedTotal: Number(raw.SubmittedTotal ?? 0),
    adjustmentTotal: Number(raw.AdjustmentTotal ?? 0),
    payableTotal: Number(raw.PayableTotal ?? 0),
    openFindingCount: Number(raw.OpenFindingCount ?? 0),
    awaitingEvidence: raw.AwaitingEvidence === true,
    findings: parseArray<FindingSummary>(raw.FindingsJson),
    documents: parseArray<DocumentReference>(raw.DocumentReferencesJson),
    analysisVersion: Number(raw.AnalysisVersion ?? 1),
    updatedAt: raw.UpdateTime ? String(raw.UpdateTime) : undefined,
  };
}

interface InitialInvoiceRecordOptions {
  correlationId: string;
  accountId: string;
  projectId: string;
  contractProfileId: string;
  documentReferences: DocumentReference[];
  submittedAt: Date;
}

export function buildInitialInvoiceRecord(options: InitialInvoiceRecordOptions) {
  return {
    CorrelationId: options.correlationId,
    InvoiceNumber: `Pending extraction · ${options.correlationId}`,
    SupplierName: 'Pending extraction',
    InvoiceDate: options.submittedAt.toISOString().slice(0, 10),
    AccountId: options.accountId,
    ProjectId: options.projectId,
    ContractProfileId: options.contractProfileId,
    ProcessingStatus: 'Submitted',
    SubmittedTotal: 0,
    AdjustmentTotal: 0,
    PayableTotal: 0,
    OpenFindingCount: 0,
    AwaitingEvidence: false,
    DocumentReferencesJson: JSON.stringify(options.documentReferences),
    AnalysisVersion: 1,
  };
}
