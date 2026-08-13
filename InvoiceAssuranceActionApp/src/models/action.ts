export type TaskMode = 'Reviewer' | 'Manager';
export type Outcome = 'SubmitReview' | 'Approve' | 'ReturnToReviewer' | 'Reject';

export interface InvoiceSummary {
  invoiceNumber: string;
  invoiceDate: string;
  supplierName: string;
  accountName: string;
  projectName: string;
  contractProfileId: string;
  submittedTotal: number;
  currentAdjustment: number;
  currentPayable: number;
  openFindingCount: number;
  awaitingEvidence: boolean;
}

export interface Finding {
  findingId: string;
  chargeId: string;
  ruleId: string;
  severity: string;
  category: string;
  title: string;
  explanation: string;
  financialEffect: number;
  status: string;
  confidence: number;
  evidenceState: string;
  contractDocumentTitle: string;
  contractClause: string;
  contractExcerptSummary: string;
  applicabilityExplanation: string;
  sourceDocumentId: string;
}

export interface Charge {
  chargeId: string;
  sourceDocumentId: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  submittedRate: number;
  submittedAmount: number;
  allowedAmount: number;
  adjustment: number;
  evaluationStatus: string;
  sourceReference: string;
}

export interface DocumentReference {
  documentId: string;
  bucketId: number;
  bucketPath: string;
  displayName: string;
  documentType: string;
  checksum: string;
}

export interface ActivityEvent {
  eventTimestamp: string;
  eventName: string;
  eventType: string;
  summary: string;
}

export interface EvidenceReference {
  evidenceId: string;
  bucketPath: string;
  displayName: string;
  contentType: string;
  size: number;
  checksum: string;
  uploadedAt: string;
}

export interface FindingDisposition {
  findingId: string;
  status: string;
  notes: string;
}

export interface ActionFormData {
  taskMode: TaskMode;
  invoiceRecordId: string;
  correlationId: string;
  analysisVersion: number;
  reviewCycle: number;
  processingStatus: string;
  invoiceSummary: InvoiceSummary;
  findings: Finding[];
  charges: Charge[];
  documents: DocumentReference[];
  activity: ActivityEvent[];
  priorManagerRationale: string;
  submittedMode: string;
  reviewReady: boolean;
  correctionApplied: boolean;
  completedAt: string;
  decisionSummary: string;
  correctedRegisterAmount: number;
  registerCorrectionReason: string;
  evidenceRequestNote: string;
  evidenceStatus: string;
  uploadedEvidence: EvidenceReference[];
  findingDispositions: FindingDisposition[];
  reviewerNotes: string;
  managerRationale: string;
  changedFindingIds: string[];
}

export const defaultActionFormData: ActionFormData = {
  taskMode: 'Reviewer',
  invoiceRecordId: '',
  correlationId: '',
  analysisVersion: 0,
  reviewCycle: 1,
  processingStatus: '',
  invoiceSummary: {
    invoiceNumber: '',
    invoiceDate: '',
    supplierName: '',
    accountName: '',
    projectName: '',
    contractProfileId: '',
    submittedTotal: 0,
    currentAdjustment: 0,
    currentPayable: 0,
    openFindingCount: 0,
    awaitingEvidence: false,
  },
  findings: [],
  charges: [],
  documents: [],
  activity: [],
  priorManagerRationale: '',
  submittedMode: '',
  reviewReady: false,
  correctionApplied: false,
  completedAt: '',
  decisionSummary: '',
  correctedRegisterAmount: 0,
  registerCorrectionReason: '',
  evidenceRequestNote: '',
  evidenceStatus: '',
  uploadedEvidence: [],
  findingDispositions: [],
  reviewerNotes: '',
  managerRationale: '',
  changedFindingIds: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value : fallback;

const amount = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const words = (value: string): string => value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeFinding = (value: unknown, index: number): Finding => {
  const finding = isRecord(value) ? value : {};
  const adjustment = amount(finding.financialEffect ?? finding.adjustment);
  const status = text(finding.status, 'Open');
  const ruleType = text(finding.category ?? finding.ruleType, 'Contract');
  const category = words(ruleType);
  const sourceDocumentId = text(finding.sourceDocumentId);
  const sourceClause = text(finding.contractClause ?? finding.sourceClause);
  const explanation = text(
    finding.explanation,
    sourceClause || 'This item requires reviewer confirmation before approval.',
  );
  const severity = text(
    finding.severity,
    adjustment > 0 ? 'High' : /technical|ambiguous|pending/i.test(status) ? 'Medium' : 'Low',
  );

  return {
    findingId: text(finding.findingId, `finding-${index + 1}`),
    chargeId: text(finding.chargeId),
    ruleId: text(finding.ruleId),
    severity,
    category,
    title: text(finding.title, `${category} review`),
    explanation,
    financialEffect: adjustment,
    status,
    confidence: amount(finding.confidence, 1),
    evidenceState: text(finding.evidenceState, status),
    contractDocumentTitle: text(
      finding.contractDocumentTitle ?? finding.sourceDocumentTitle,
      sourceDocumentId || 'Contract source',
    ),
    contractClause: sourceClause,
    contractExcerptSummary: text(finding.contractExcerptSummary, sourceClause),
    applicabilityExplanation: text(finding.applicabilityExplanation, explanation),
    sourceDocumentId,
  };
};

const normalizeCharge = (value: unknown, index: number): Charge => {
  const charge = isRecord(value) ? value : {};
  const submittedAmount = amount(charge.submittedAmount);
  const adjustment = amount(charge.adjustment);

  return {
    chargeId: text(charge.chargeId, `charge-${index + 1}`),
    sourceDocumentId: text(charge.sourceDocumentId),
    category: text(charge.category, 'unclassified'),
    description: text(charge.description, 'Invoice charge'),
    quantity: amount(charge.quantity, 1),
    unit: text(charge.unit, 'each'),
    submittedRate: amount(charge.submittedRate ?? charge.unitRate),
    submittedAmount,
    allowedAmount: amount(charge.allowedAmount, Math.max(0, submittedAmount - adjustment)),
    adjustment,
    evaluationStatus: text(charge.evaluationStatus, adjustment > 0 ? 'Adjusted' : 'Submitted'),
    sourceReference: text(charge.sourceReference, text(charge.sourceDocumentId)),
  };
};

export function normalizeTaskData(value: unknown): ActionFormData {
  const data = isRecord(value) ? value : {};
  const invoiceSummary = isRecord(data.invoiceSummary) ? data.invoiceSummary : {};
  const normalizedInvoiceSummary = {
    ...defaultActionFormData.invoiceSummary,
    ...invoiceSummary,
  };
  const evidenceStatus = text(
    data.evidenceStatus,
    normalizedInvoiceSummary.awaitingEvidence ? 'AwaitingEvidence' : 'Resolved',
  );
  return {
    ...defaultActionFormData,
    ...data,
    invoiceSummary: normalizedInvoiceSummary,
    evidenceStatus,
    findings: Array.isArray(data.findings) ? data.findings.map(normalizeFinding) : [],
    charges: Array.isArray(data.charges) ? data.charges.map(normalizeCharge) : [],
    documents: Array.isArray(data.documents) ? data.documents as DocumentReference[] : [],
    activity: Array.isArray(data.activity) ? data.activity as ActivityEvent[] : [],
    uploadedEvidence: Array.isArray(data.uploadedEvidence) ? data.uploadedEvidence as EvidenceReference[] : [],
    findingDispositions: Array.isArray(data.findingDispositions) ? data.findingDispositions as FindingDisposition[] : [],
    changedFindingIds: Array.isArray(data.changedFindingIds) ? data.changedFindingIds as string[] : [],
  } as ActionFormData;
}
