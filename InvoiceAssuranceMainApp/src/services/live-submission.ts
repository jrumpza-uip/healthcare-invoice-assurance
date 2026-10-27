import type { SubmissionDraft } from './submission';
import { buildInitialInvoiceRecord } from './invoice-records';
import type { DocumentReference } from './invoice-records';

interface UploadRequest {
  file: File;
  path: string;
  type: 'invoice' | 'support';
}

export interface FlowInput {
  invoiceRecordId: string;
  correlationId: string;
  contractProfileId: string;
  sourceDocumentIds: string[];
  forceManagerReview: boolean;
}

export function serializeFlowInput(input: FlowInput): string {
  return JSON.stringify(input);
}

interface SubmissionDependencies {
  createCorrelationId: () => string;
  uploadDocument: (request: UploadRequest) => Promise<DocumentReference>;
  createInvoiceRecord: (record: ReturnType<typeof buildInitialInvoiceRecord>) => Promise<{ id: string }>;
  startFlow: (input: FlowInput) => Promise<{ instanceId: string }>;
  linkProcessInstance: (recordId: string, instanceId: string) => Promise<void>;
  now: () => Date;
}

function safeFilename(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
}

export async function submitAnalysis(
  draft: SubmissionDraft,
  dependencies: SubmissionDependencies,
) {
  const correlationId = dependencies.createCorrelationId();
  const uploadRequests: UploadRequest[] = [
    ...draft.invoiceFiles.map((file) => ({
      file,
      path: `${correlationId}/invoice/${safeFilename(file.name)}`,
      type: 'invoice' as const,
    })),
    ...draft.supportFiles.map((file) => ({
      file,
      path: `${correlationId}/support/${safeFilename(file.name)}`,
      type: 'support' as const,
    })),
  ];

  const documentReferences: DocumentReference[] = [];
  for (const request of uploadRequests) {
    documentReferences.push(await dependencies.uploadDocument(request));
  }

  const created = await dependencies.createInvoiceRecord(buildInitialInvoiceRecord({
    correlationId,
    accountId: draft.accountId,
    projectId: draft.projectId,
    contractProfileId: draft.contractProfileId,
    documentReferences,
    submittedAt: dependencies.now(),
  }));

  const started = await dependencies.startFlow({
    invoiceRecordId: created.id,
    correlationId,
    contractProfileId: draft.contractProfileId,
    sourceDocumentIds: documentReferences.map((document) => document.path),
    forceManagerReview: draft.forceManagerReview,
  });
  await dependencies.linkProcessInstance(created.id, started.instanceId);

  return {
    invoiceRecordId: created.id,
    correlationId,
    processInstanceId: started.instanceId,
  };
}
