import type { UiPath } from '@uipath/uipath-typescript/core';
import type { PaginationCursor } from '@uipath/uipath-typescript/core';
import { Buckets } from '@uipath/uipath-typescript/buckets';
import { Entities, LogicalOperator, QueryFilterOperator } from '@uipath/uipath-typescript/entities';
import { ProcessInstances } from '@uipath/uipath-typescript/maestro-processes';
import { Processes } from '@uipath/uipath-typescript/processes';
import { Tasks } from '@uipath/uipath-typescript/tasks';
import { collectCursorPages } from '../utils/pagination';
import { accumulateVariables } from '../utils/process-state';
import type { ProcessVariable } from '../utils/process-state';
import { buildCreatorJobKeyFilter } from '../utils/task-correlation';
import { buildTaskEmbedUrl } from '../utils/urls';
import { serializeFlowInput, submitAnalysis } from './live-submission';
import type { SubmissionDraft } from './submission';
import { buildInitialInvoiceRecord, mapActivityEvent, mapInvoiceLineItem, mapInvoiceRecord } from './invoice-records';
import type { ActivityEvent, DocumentReference, InvoiceLineItem, InvoiceRecord } from './invoice-records';

export const PLATFORM = {
  apiBaseUrl: 'https://api.uipath.com',
  orgName: 'uipathlabs',
  tenantName: 'Playground',
  folderId: 2036001,
  folderKey: '79d872b0-bee1-4264-a6de-3e780f4e4239',
  uploadBucketName: 'healthcare-invoice-assurance-uploadedInvoices',
  flowName: 'InvoiceAssuranceFlow',
  entities: {
    main: 'd0fed526-9d93-f111-9b32-000d3ab5d4c4',
    lineItems: 'ecfed526-9d93-f111-9b32-000d3ab5d4c4',
    activity: 'c5d31b2f-9d93-f111-9b32-000d3ab5d4c4',
  },
} as const;

interface WorkspaceData {
  invoice: InvoiceRecord;
  lineItems: InvoiceLineItem[];
  activities: ActivityEvent[];
  processVariables: ProcessVariable[];
  taskEmbedUrl: string | null;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'UiPath request failed';
}

async function checksum(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createPlatformServices(sdk: UiPath) {
  const entities = new Entities(sdk);
  const buckets = new Buckets(sdk);
  const processes = new Processes(sdk);
  const processInstances = new ProcessInstances(sdk);
  const tasks = new Tasks(sdk);
  let uploadBucketId: number | null = null;

  const queryEntity = async (entityId: string, fieldName?: string, value?: string) => collectCursorPages(async (cursor?: PaginationCursor) => {
    const page = await entities.queryRecordsById(entityId, {
      folderKey: PLATFORM.folderKey,
      pageSize: 100,
      cursor,
      ...(fieldName && value ? {
        filterGroup: {
          logicalOperator: LogicalOperator.And,
          queryFilters: [{ fieldName, operator: QueryFilterOperator.Equals, value }],
        },
      } : {}),
    });
    return { items: page.items, hasNextPage: page.hasNextPage, nextCursor: page.nextCursor };
  });

  const listInvoices = async (): Promise<InvoiceRecord[]> => {
    const rows = await queryEntity(PLATFORM.entities.main);
    return rows.map(mapInvoiceRecord).sort((left, right) => String(right.updatedAt ?? right.invoiceDate).localeCompare(String(left.updatedAt ?? left.invoiceDate)));
  };

  const loadWorkspace = async (invoiceRecordId: string, previousVariables: ProcessVariable[] = []): Promise<WorkspaceData> => {
    const rawInvoice = await entities.getRecordById(PLATFORM.entities.main, invoiceRecordId, { folderKey: PLATFORM.folderKey });
    const invoice = mapInvoiceRecord(rawInvoice);
    const [rawLineItems, rawActivities] = await Promise.all([
      queryEntity(PLATFORM.entities.lineItems, 'InvoiceRecordId', invoiceRecordId),
      queryEntity(PLATFORM.entities.activity, 'InvoiceRecordId', invoiceRecordId),
    ]);
    const lineItems = rawLineItems.map(mapInvoiceLineItem);
    const activities = rawActivities.map(mapActivityEvent).sort((left, right) => right.eventTimestamp.localeCompare(left.eventTimestamp));
    let processVariables = previousVariables;
    let taskEmbedUrl: string | null = null;

    if (invoice.processInstanceId) {
      try {
        const variables = await processInstances.getVariables(invoice.processInstanceId, PLATFORM.folderKey);
        processVariables = accumulateVariables(previousVariables, variables.globalVariables.map((variable) => ({ id: variable.id, name: variable.name, value: variable.value })));
        const taskPage = await tasks.getAll({
          folderId: PLATFORM.folderId,
          filter: buildCreatorJobKeyFilter(invoice.processInstanceId),
          pageSize: 10,
        });
        const pending = taskPage.items.find((task) => !task.isCompleted);
        if (pending) taskEmbedUrl = buildTaskEmbedUrl({ apiBaseUrl: PLATFORM.apiBaseUrl, orgName: PLATFORM.orgName, tenantName: PLATFORM.tenantName, taskId: pending.id });
      } catch (error) {
        console.warn('Live process state is temporarily unavailable:', messageOf(error));
      }
    }

    return { invoice, lineItems, activities, processVariables, taskEmbedUrl };
  };

  const submit = async (draft: SubmissionDraft) => submitAnalysis(draft, {
    createCorrelationId: () => crypto.randomUUID(),
    now: () => new Date(),
    uploadDocument: async ({ file, path, type }): Promise<DocumentReference> => {
      if (uploadBucketId === null) {
        const bucket = await buckets.getByName(PLATFORM.uploadBucketName, { folderKey: PLATFORM.folderKey });
        uploadBucketId = bucket.id;
      }
      const uploaded = await buckets.uploadFile(uploadBucketId, path, file, { folderKey: PLATFORM.folderKey });
      if (!uploaded.success) throw new Error(`Upload failed for ${file.name} (${uploaded.statusCode}).`);
      return { path, type, name: file.name, checksum: await checksum(file) };
    },
    createInvoiceRecord: async (record: ReturnType<typeof buildInitialInvoiceRecord>) => {
      const created = await entities.insertRecordById(PLATFORM.entities.main, record, { folderKey: PLATFORM.folderKey });
      return { id: created.Id };
    },
    startFlow: async (input) => {
      const release = await processes.getByName(PLATFORM.flowName, { folderKey: PLATFORM.folderKey });
      const jobs = await processes.start({ processKey: release.key, inputArguments: serializeFlowInput(input) }, PLATFORM.folderId);
      const started = jobs[0];
      if (!started) throw new Error('UiPath did not return a started Flow instance.');
      return { instanceId: String(started.id) };
    },
    linkProcessInstance: async (recordId, instanceId) => {
      await entities.updateRecordById(PLATFORM.entities.main, recordId, { ProcessInstanceId: instanceId, ProcessingStatus: 'Processing' }, { folderKey: PLATFORM.folderKey });
    },
  });

  return { listInvoices, loadWorkspace, submit };
}
