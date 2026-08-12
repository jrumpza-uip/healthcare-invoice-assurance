import type { MessageSeverity, Task, TaskCompleteResponse } from '@uipath/coded-action-app';
import { LogicalOperator, QueryFilterOperator } from '@uipath/uipath-typescript/entities';
import type { EntityQueryRecordsOptions, EntityRecord } from '@uipath/uipath-typescript/entities';
import type { ActionFormData, ActivityEvent, Charge, DocumentReference, Finding } from '../models/action';
import { codedActionAppService, getBuckets, getEntities } from '../uipath';
import { uploadEvidence as uploadEvidenceFile } from './evidence';

export const HLS_FOLDER_ID = 2036001;
export const HLS_FOLDER_KEY = '79d872b0-bee1-4264-a6de-3e780f4e4239';
export const UPLOAD_BUCKET_ID = 204617;
export const MAIN_ENTITY_ID = 'd0fed526-9d93-f111-9b32-000d3ab5d4c4';
export const LINE_ITEMS_ENTITY_ID = 'ecfed526-9d93-f111-9b32-000d3ab5d4c4';
export const ACTIVITY_ENTITY_ID = 'c5d31b2f-9d93-f111-9b32-000d3ab5d4c4';

export interface ActionWorkspaceServices {
  getTask(): Promise<Task>;
  setTaskData(data: ActionFormData): void;
  completeTask(outcome: string, data: ActionFormData): Promise<TaskCompleteResponse>;
  showMessage(message: string, severity: MessageSeverity): void;
  getDocumentUrl(document: DocumentReference, folderId: number): Promise<string>;
  uploadEvidence(file: File, data: ActionFormData, folderId: number): Promise<ActionFormData['uploadedEvidence'][number]>;
  loadFallbackRecords(invoiceRecordId: string): Promise<Partial<ActionFormData> | null>;
}

function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

async function queryAll(entityId: string, options: EntityQueryRecordsOptions): Promise<EntityRecord[]> {
  const entities = getEntities();
  const {
    cursor: _cursor,
    jumpToPage: _jumpToPage,
    pageSize: _pageSize,
    ...baseOptions
  } = options;
  let page = await entities.queryRecordsById(entityId, { ...baseOptions, pageSize: 50 });
  const rows = [...page.items];
  while (page.hasNextPage && page.nextCursor) {
    page = await entities.queryRecordsById(entityId, {
      ...baseOptions,
      pageSize: 50,
      cursor: page.nextCursor,
    });
    rows.push(...page.items);
  }
  return rows;
}

async function loadFallbackRecords(invoiceRecordId: string): Promise<Partial<ActionFormData> | null> {
  if (!invoiceRecordId) return null;
  const entities = getEntities();
  const filter = {
    logicalOperator: LogicalOperator.And,
    queryFilters: [{
      fieldName: 'InvoiceRecordId',
      operator: QueryFilterOperator.Equals,
      value: invoiceRecordId,
    }],
  };
  const [main, lineRows, activityRows] = await Promise.all([
    entities.getRecordById(MAIN_ENTITY_ID, invoiceRecordId, { folderKey: HLS_FOLDER_KEY }),
    queryAll(LINE_ITEMS_ENTITY_ID, { filterGroup: filter, folderKey: HLS_FOLDER_KEY }),
    queryAll(ACTIVITY_ENTITY_ID, {
      filterGroup: filter,
      sortOptions: [{ fieldName: 'EventTimestamp', isDescending: true }],
      folderKey: HLS_FOLDER_KEY,
    }),
  ]);

  const findings = parseArray<Finding>(main.FindingsJson);
  const documents = parseArray<DocumentReference>(main.DocumentReferencesJson);
  const charges: Charge[] = lineRows.map((row) => ({
    chargeId: String(row.Id ?? row.ExternalRecordId ?? ''),
    sourceDocumentId: String(row.SourceDocumentId ?? ''),
    category: String(row.Category ?? ''),
    description: String(row.Description ?? ''),
    quantity: asNumber(row.Quantity),
    unit: String(row.Unit ?? ''),
    submittedRate: asNumber(row.SubmittedRate),
    submittedAmount: asNumber(row.SubmittedAmount),
    allowedAmount: asNumber(row.AllowedAmount),
    adjustment: asNumber(row.Adjustment),
    evaluationStatus: String(row.EvaluationStatus ?? ''),
    sourceReference: String(row.SourceCoordinatesJson ?? row.SourceDocumentId ?? ''),
  }));
  const activity: ActivityEvent[] = activityRows.map((row) => ({
    eventTimestamp: String(row.EventTimestamp ?? ''),
    eventName: String(row.EventName ?? ''),
    eventType: String(row.EventType ?? ''),
    summary: String(row.Summary ?? ''),
  }));

  return {
    correlationId: String(main.CorrelationId ?? ''),
    analysisVersion: asNumber(main.AnalysisVersion),
    processingStatus: String(main.ProcessingStatus ?? ''),
    invoiceSummary: {
      invoiceNumber: String(main.InvoiceNumber ?? ''),
      invoiceDate: String(main.InvoiceDate ?? ''),
      supplierName: String(main.SupplierName ?? ''),
      accountName: String(main.AccountId ?? ''),
      projectName: String(main.ProjectId ?? ''),
      contractProfileId: String(main.ContractProfileId ?? ''),
      submittedTotal: asNumber(main.SubmittedTotal),
      currentAdjustment: asNumber(main.AdjustmentTotal),
      currentPayable: asNumber(main.PayableTotal),
      openFindingCount: asNumber(main.OpenFindingCount),
      awaitingEvidence: Boolean(main.AwaitingEvidence),
    },
    findings,
    documents,
    charges,
    activity,
  };
}

export const actionWorkspaceServices: ActionWorkspaceServices = {
  getTask: () => codedActionAppService.getTask(),
  setTaskData: (data) => codedActionAppService.setTaskData(data),
  completeTask: (outcome, data) => codedActionAppService.completeTask(outcome, data),
  showMessage: (message, severity) => codedActionAppService.showMessage(message, severity),
  async getDocumentUrl(document, folderId) {
    const buckets = getBuckets();
    const result = await buckets.getReadUri(document.bucketId, document.bucketPath, { folderId });
    const response = await fetch(result.uri, { method: result.httpMethod ?? 'GET', headers: result.headers });
    if (!response.ok) throw new Error(`Document download failed with status ${response.status}.`);
    return URL.createObjectURL(await response.blob());
  },
  uploadEvidence: (file, data, folderId) => uploadEvidenceFile({
    upload: ({ bucketId, path, content }) => getBuckets().uploadFile(bucketId, path, content, { folderId }),
  }, file, {
    bucketId: UPLOAD_BUCKET_ID,
    folderId,
    invoiceRecordId: data.invoiceRecordId,
    correlationId: data.correlationId,
  }),
  loadFallbackRecords,
};
