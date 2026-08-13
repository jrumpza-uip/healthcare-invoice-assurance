import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const flowPath = resolve(
  projectRoot,
  'HealthcareInvoiceAssurance/InvoiceAssuranceFlow/InvoiceAssuranceFlow.flow',
);
const uip = process.env.UIP_CLI
  ?? '/Users/josephrumpza/.nvm/versions/node/v24.15.0/bin/uip';

const clone = (value) => structuredClone(value);
const nodeById = (nodes, id) => {
  const node = nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Missing source node: ${id}`);
  return clone(node);
};
const nodeByAnyId = (nodes, ...ids) => {
  for (const id of ids) {
    const node = nodes.find((candidate) => candidate.id === id);
    if (node) return clone(node);
  }
  throw new Error(`Missing source node: ${ids.join(' or ')}`);
};
const scriptBody = (fn) => {
  const source = fn.toString();
  return source.slice(source.indexOf('{') + 1, source.lastIndexOf('}')).trim();
};
const edge = (id, sourceNodeId, sourcePort, targetNodeId, targetPort = 'input') => ({
  id,
  sourceNodeId,
  sourcePort,
  targetNodeId,
  targetPort,
});

function normalizePackageScript($vars) {
  const packets = Array.isArray($vars.extractDocuments.output)
    ? $vars.extractDocuments.output
    : [];
  const normalizeKey = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const packetFields = packets.map((packet) => {
    const raw = packet?.extraction ?? {};
    const document = raw.ExtractionResult?.ResultsDocument
      ?? raw.extractionResult?.resultsDocument
      ?? raw.ResultsDocument
      ?? raw;
    return {
      sourceDocumentId: packet?.sourceDocumentId ?? '',
      fields: Array.isArray(document?.Fields)
        ? document.Fields
        : Array.isArray(document?.fields) ? document.fields : [],
      extraction: raw,
    };
  });
  const allFields = packetFields.flatMap((packet) => packet.fields.map((field) => ({
    field,
    sourceDocumentId: packet.sourceDocumentId,
  })));
  const fieldEntry = (names) => {
    const wanted = names.map(normalizeKey);
    return allFields.find(({ field }) => wanted.includes(normalizeKey(
      field?.FieldName ?? field?.fieldName ?? field?.Name ?? field?.name,
    )));
  };
  const scalar = (value, fallback = '') => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'object') return value.Value ?? value.value ?? fallback;
    return value;
  };
  const firstValue = (names, fallback = '') => {
    const item = fieldEntry(names)?.field;
    return scalar(item?.Value ?? item?.value ?? item?.Values?.[0] ?? item?.values?.[0], fallback);
  };
  const numberValue = (names, fallback = 0) => {
    const value = Number(String(firstValue(names, fallback)).replace(/[$,]/g, ''));
    return Number.isFinite(value) ? value : fallback;
  };
  const readRow = (source, names, fallback = '') => {
    for (const name of names) {
      const candidate = Array.isArray(source)
        ? source.find((item) => normalizeKey(
          item?.FieldName ?? item?.fieldName ?? item?.Name ?? item?.name,
        ) === normalizeKey(name))
        : source?.[name];
      const value = scalar(candidate?.Value ?? candidate?.value ?? candidate, undefined);
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
  };
  const canonicalCharges = [];
  for (const packet of packetFields) {
    const lineItemField = packet.fields.find((item) => [
      'lineitems', 'invoicelineitems', 'charges',
    ].includes(normalizeKey(item?.FieldName ?? item?.fieldName ?? item?.Name ?? item?.name)));
    const rows = lineItemField?.Values ?? lineItemField?.values
      ?? lineItemField?.Rows ?? lineItemField?.rows ?? [];
    for (const [index, row] of rows.entries()) {
      const source = row?.Values ?? row?.values ?? row;
      const quantity = Number(readRow(source, ['Quantity'], 1));
      const unitRate = Number(String(readRow(source, ['UnitRate', 'Rate'], 0)).replace(/[$,]/g, ''));
      const submittedAmount = Number(String(readRow(
        source,
        ['SubmittedAmount', 'Amount', 'LineTotal'],
        quantity * unitRate,
      )).replace(/[$,]/g, ''));
      const chargeId = String(readRow(
        source,
        ['ChargeId', 'LineId'],
        `charge-${canonicalCharges.length + 1}`,
      ));
      canonicalCharges.push({
        chargeId,
        externalRecordId: chargeId,
        sourceDocumentId: String(readRow(source, ['SourceDocumentId'], packet.sourceDocumentId)),
        sourceDocumentType: 'invoice',
        category: String(readRow(source, ['Category'], 'unclassified')),
        description: String(readRow(source, ['Description', 'Item'], 'Extracted invoice line')),
        serviceDate: String(readRow(source, ['ServiceDate'], firstValue(['InvoiceDate'], ''))),
        quantity: Number.isFinite(quantity) ? quantity : 1,
        unit: String(readRow(source, ['Unit'], 'each')),
        unitRate: Number.isFinite(unitRate) ? unitRate : 0,
        submittedAmount: Number.isFinite(submittedAmount) ? submittedAmount : 0,
        evidenceTypes: [],
      });
    }
  }
  const invoiceTotal = numberValue(['InvoiceTotal', 'TotalAmount', 'Total']);
  const registerTotal = numberValue(['RegisterTotal', 'CostRegisterTotal'], invoiceTotal);
  const sourceDocumentIds = $vars.validateSubmission.output.sourceDocumentIds ?? [];
  return {
    invoice: {
      number: String(firstValue(['InvoiceNumber', 'InvoiceNo'], '')),
      total: invoiceTotal,
      date: String(firstValue(['InvoiceDate', 'Date'], '')).slice(0, 10),
    },
    supplier: {
      name: String(firstValue(
        ['SupplierName', 'VendorName', 'Supplier'],
        'Northbridge General Contractors',
      )),
    },
    accountId: $vars.validateSubmission.output.accountId
      ?? 'account-lakeshore-regional-health-system',
    projectId: $vars.validateSubmission.output.projectId
      ?? 'project-west-pavilion-renovation',
    register: { total: registerTotal, lines: [] },
    supportingInvoices: [],
    canonicalCharges,
    documents: sourceDocumentIds.map((documentId) => ({
      documentId,
      bucketPath: documentId,
      displayName: String(documentId).split('/').at(-1) ?? documentId,
      documentType: 'invoice-support',
      checksum: '',
    })),
    currency: String(firstValue(['Currency'], 'USD')),
    extractionResults: packets,
  };
}

function applyReviewerChangesScript($vars) {
  const input = $vars.reevaluateStart.output ?? {};
  const previous = input.previousSnapshot ?? {};
  const decision = input.reviewerDecision ?? {};
  const findings = Array.isArray(previous.authoritativeFindings)
    ? previous.authoritativeFindings
    : [];
  const evidence = Array.isArray(decision.uploadedEvidence) ? decision.uploadedEvidence : [];
  const evidenceFindingIds = evidence.length > 0 && decision.evidenceStatus === 'Resolved'
    ? findings
      .filter((finding) => finding.evidenceState === 'missingEvidence')
      .map((finding) => finding.findingId)
    : [];
  const affectedChargeIds = new Set(findings
    .filter((finding) => evidenceFindingIds.includes(finding.findingId))
    .map((finding) => finding.chargeId)
    .filter(Boolean));
  const canonicalCharges = (previous.lineItems ?? input.canonicalCharges ?? []).map((charge) => ({
    ...charge,
    evidenceTypes: affectedChargeIds.has(charge.chargeId)
      ? [...new Set([...(charge.evidenceTypes ?? []), 'itemized-receipt'])]
      : [...(charge.evidenceTypes ?? [])],
  }));
  const documents = [
    ...(previous.documents ?? input.documents ?? []),
    ...evidence.map((item) => ({
      documentId: item.evidenceId ?? item.bucketPath,
      bucketPath: item.bucketPath,
      displayName: item.displayName ?? item.bucketPath,
      documentType: 'supporting-evidence',
      checksum: item.checksum ?? '',
    })),
  ];
  const comparison = input.reconciliationSummary?.invoiceRegisterComparison ?? {};
  const correctedRegisterAmount = Number(decision.correctedRegisterAmount);
  const hasCorrection = Number.isFinite(correctedRegisterAmount)
    && decision.registerCorrectionReason?.trim();
  const invoiceTotal = Number(comparison.invoiceTotal ?? previous.invoiceSummary?.submittedTotal ?? 0);
  const variance = hasCorrection ? invoiceTotal - correctedRegisterAmount : Number(comparison.variance ?? 0);
  const reconciliationSummary = {
    ...(input.reconciliationSummary ?? {}),
    invoiceRegisterComparison: {
      ...comparison,
      ...(hasCorrection ? {
        registerTotal: correctedRegisterAmount,
        variance,
        status: Math.abs(variance) <= 0.01 ? 'Tied' : 'Variance',
        correctionReason: decision.registerCorrectionReason,
      } : {}),
    },
  };
  const reconciliationFindingIds = hasCorrection
    ? findings
      .filter((finding) => finding.evidenceState === 'reconciliationException')
      .map((finding) => finding.findingId)
    : [];
  const requestedIds = Array.isArray(decision.changedFindingIds)
    ? decision.changedFindingIds
    : [];
  let changedFindingIds = [...new Set([
    ...requestedIds,
    ...evidenceFindingIds,
    ...reconciliationFindingIds,
  ].filter(Boolean))];
  if (changedFindingIds.length === 0) {
    changedFindingIds = findings.map((finding) => finding.findingId).filter(Boolean);
  }
  return {
    ...input,
    canonicalCharges,
    documents,
    reconciliationSummary,
    changedFindingIds,
    humanOverride: decision.reviewerNotes ?? input.humanOverride ?? null,
    reviewerDecision: decision,
    previousSnapshot: previous,
    priorActivity: previous.activity ?? input.priorActivity ?? [],
  };
}

const raw = await readFile(flowPath, 'utf8');
const flow = JSON.parse(raw);
const oldTop = flow.nodes;

const start = nodeById(oldTop, 'start');
const validateSubmission = nodeById(oldTop, 'validateSubmission');
validateSubmission.inputs.script = "const submission = $vars.start.output ?? {}; const required = ['invoiceRecordId', 'correlationId', 'contractProfileId']; const missing = required.filter((name) => typeof submission[name] !== 'string' || submission[name].trim() === ''); if (!Array.isArray(submission.sourceDocumentIds) || submission.sourceDocumentIds.filter(Boolean).length === 0) missing.push('sourceDocumentIds'); if (submission.contractProfileId !== 'profile-west-pavilion') missing.push('supported contractProfileId'); if (missing.length > 0) throw new Error(`Invalid submission: ${missing.join(', ')} required`); return { invoiceRecordId: submission.invoiceRecordId.trim(), correlationId: submission.correlationId.trim(), contractProfileId: submission.contractProfileId.trim(), sourceDocumentIds: [...new Set(submission.sourceDocumentIds.filter(Boolean))], accountId: submission.accountId ?? 'account-lakeshore-regional-health-system', projectId: submission.projectId ?? 'project-west-pavilion-renovation', simulateSearchUnavailable: submission.simulateSearchUnavailable === true, precedencePolicy: { mode: 'topic-specific', effectiveOnOrBeforeInvoiceDate: true } };";

const extractDocuments = {
  id: 'extractDocuments',
  type: 'core.logic.loop',
  typeVersion: '2.4',
  display: { label: 'Extract all documents', icon: 'repeat' },
  inputs: {
    collection: '=js:$vars.validateSubmission.output.sourceDocumentIds',
    parallel: false,
    completionCondition: '',
    breakEnabled: false,
  },
};
const extractDocument = nodeByAnyId(oldTop, 'extractPackage', 'extractDocument');
extractDocument.id = 'extractDocument';
extractDocument.parentId = 'extractDocuments';
extractDocument.display.label = 'Extract document';
extractDocument.inputs.fileRef = '=js:$vars.extractDocuments.currentItem';
extractDocument.inputs.errorHandlingEnabled = false;
const collectDocumentExtraction = {
  id: 'collectDocumentExtraction',
  type: 'core.action.script',
  typeVersion: '1.1',
  parentId: 'extractDocuments',
  display: { label: 'Collect extraction', icon: 'code' },
  inputs: {
    script: 'return { sourceDocumentId: $vars.extractDocuments.currentItem, extraction: $vars.extractDocument.output };',
  },
  outputs: {
    output: {
      type: 'object',
      description: 'One document extraction with its source reference',
      source: '=result.response',
      var: 'output',
    },
    error: {
      type: 'object',
      description: 'Extraction collection error',
      source: '=Error',
      var: 'error',
    },
  },
};
const normalizePackage = nodeByAnyId(oldTop, 'normalizeCharges', 'normalizePackage');
normalizePackage.id = 'normalizePackage';
normalizePackage.display.label = 'Normalize package';
normalizePackage.outputs.output.description = 'Canonical package from all IXP results';
normalizePackage.inputs.script = scriptBody(normalizePackageScript);

const lookupProjectCost = nodeById(oldTop, 'lookupProjectCost');
for (const key of ['accountId', 'projectId', 'supplier', 'invoice', 'register', 'supportingInvoices']) {
  lookupProjectCost.inputs[key] = lookupProjectCost.inputs[key].replace('normalizeCharges', 'normalizePackage');
}
lookupProjectCost.inputs.errorHandlingEnabled = false;

const analyzeContract = nodeById(oldTop, 'analyzeContract');
analyzeContract.inputs.invoiceDate = '=js:$vars.normalizePackage.output.invoice?.date ?? \'\'';
analyzeContract.inputs.canonicalCharges = '=js:$vars.normalizePackage.output.canonicalCharges';
analyzeContract.inputs.humanOverride = '=js:null';
analyzeContract.inputs.changedFindingIds = '=js:[]';
analyzeContract.inputs.errorHandlingEnabled = false;

const evaluateFinancials = nodeById(oldTop, 'evaluateFinancials');
evaluateFinancials.inputs.currency = '=js:$vars.normalizePackage.output.currency';
evaluateFinancials.inputs.invoiceSubmittedTotal = '=js:String($vars.normalizePackage.output.invoice.total ?? 0)';
evaluateFinancials.inputs.canonicalCharges = '=js:$vars.normalizePackage.output.canonicalCharges';
evaluateFinancials.inputs.changedFindingIds = '=js:[]';
evaluateFinancials.inputs.errorHandlingEnabled = false;

const persistInitialAnalysis = nodeById(oldTop, 'persistInitialAnalysis');
persistInitialAnalysis.inputs.canonicalPackage = '=js:$vars.normalizePackage.output';
persistInitialAnalysis.inputs.technicalContext = '=js:({})';
const reviewerTask = nodeById(oldTop, 'reviewerTask');
reviewerTask.outputs.output.properties = {
  ...clone(reviewerTask.inputs.app.outputSchema.properties),
  Action: clone(reviewerTask.outputs.output.properties.Action),
};
const reevaluateAffectedFindings = nodeById(oldTop, 'reevaluateAffectedFindings');
reevaluateAffectedFindings.inputs.invoiceDate = '=js:$vars.normalizePackage.output.invoice.date';
const approvalReadinessGate = nodeById(oldTop, 'approvalReadinessGate');
const managerTask = nodeById(oldTop, 'managerTask');
managerTask.outputs.output.properties = {
  ...clone(managerTask.inputs.app.outputSchema.properties),
  Action: clone(managerTask.outputs.output.properties.Action),
};
const finalizeOutcome = nodeById(oldTop, 'finalizeOutcome');
finalizeOutcome.inputs.summary = '=js:$vars.managerTask.output.decisionSummary ?? $vars.managerTask.output.Action';
const end = nodeById(oldTop, 'end');
end.outputs.processInstanceId.source = '=js:$metadata.InstanceId';
end.outputs.technicalErrors.source = '=js:[]';

flow.nodes = [
  start,
  validateSubmission,
  extractDocuments,
  extractDocument,
  collectDocumentExtraction,
  normalizePackage,
  lookupProjectCost,
  analyzeContract,
  evaluateFinancials,
  persistInitialAnalysis,
  reviewerTask,
  reevaluateAffectedFindings,
  approvalReadinessGate,
  managerTask,
  finalizeOutcome,
  end,
];

flow.edges = [
  edge('e01', 'start', 'output', 'validateSubmission'),
  edge('e02', 'validateSubmission', 'success', 'extractDocuments'),
  edge('e03', 'extractDocuments', 'start', 'extractDocument'),
  edge('e04', 'extractDocument', 'success', 'collectDocumentExtraction'),
  edge('e05', 'collectDocumentExtraction', 'success', 'extractDocuments', 'continue'),
  edge('e06', 'extractDocuments', 'success', 'normalizePackage'),
  edge('e07', 'normalizePackage', 'success', 'lookupProjectCost'),
  edge('e08', 'lookupProjectCost', 'output', 'analyzeContract'),
  edge('e09', 'analyzeContract', 'output', 'evaluateFinancials'),
  edge('e10', 'evaluateFinancials', 'output', 'persistInitialAnalysis'),
  edge('e11', 'persistInitialAnalysis', 'output', 'reviewerTask'),
  edge('e12', 'reviewerTask', 'SubmitReview', 'reevaluateAffectedFindings'),
  edge('e13', 'reevaluateAffectedFindings', 'output', 'approvalReadinessGate'),
  edge('e14', 'approvalReadinessGate', 'false', 'reviewerTask'),
  edge('e15', 'approvalReadinessGate', 'true', 'managerTask'),
  edge('e16', 'managerTask', 'Approve', 'finalizeOutcome'),
  edge('e17', 'managerTask', 'ReturnToReviewer', 'reviewerTask'),
  edge('e18', 'managerTask', 'Reject', 'finalizeOutcome'),
  edge('e19', 'finalizeOutcome', 'output', 'end'),
];

const initialSubflow = clone(flow.subflows.persistInitialAnalysis);
const reevaluateSubflow = clone(flow.subflows.reevaluateAffectedFindings);
const finalSubflow = clone(flow.subflows.finalizeOutcome);

const reevaluateStart = nodeById(reevaluateSubflow.nodes, 'reevaluateStart');
const applyReviewerChanges = {
  id: 'applyReviewerChanges',
  type: 'core.action.script',
  typeVersion: '1.1',
  display: { label: 'Apply reviewer changes', icon: 'code' },
  inputs: { script: scriptBody(applyReviewerChangesScript) },
  outputs: {
    output: {
      type: 'object',
      description: 'Reviewer-adjusted re-evaluation inputs',
      source: '=result.response',
      var: 'output',
    },
    error: {
      type: 'object',
      description: 'Reviewer change application error',
      source: '=Error',
      var: 'error',
    },
  },
};
const reanalyzeChangedFindings = nodeById(reevaluateSubflow.nodes, 'reanalyzeChangedFindings');
for (const key of [
  'correlationId',
  'invoiceRecordId',
  'contractProfileId',
  'invoiceDate',
  'canonicalCharges',
  'reconciliationSummary',
  'precedencePolicy',
  'humanOverride',
  'changedFindingIds',
]) {
  reanalyzeChangedFindings.inputs[key] = reanalyzeChangedFindings.inputs[key]
    .replace('reevaluateStart', 'applyReviewerChanges');
}
reanalyzeChangedFindings.inputs.errorHandlingEnabled = false;
const reevaluateFinancials = nodeById(reevaluateSubflow.nodes, 'reevaluateFinancials');
for (const key of [
  'correlationId',
  'invoiceRecordId',
  'analysisVersion',
  'invoiceSubmittedTotal',
  'canonicalCharges',
  'reconciliationResult',
  'previousSnapshot',
  'changedFindingIds',
]) {
  reevaluateFinancials.inputs[key] = reevaluateFinancials.inputs[key]
    .replaceAll('reevaluateStart', 'applyReviewerChanges');
}
reevaluateFinancials.inputs.mode = "=js:$vars.applyReviewerChanges.output.changedFindingIds.length > 0 ? 'targeted' : 'full'";
reevaluateFinancials.inputs.errorHandlingEnabled = false;
const assessReadiness = nodeById(reevaluateSubflow.nodes, 'assessReadiness');
assessReadiness.inputs.script = assessReadiness.inputs.script
  .replace('$vars.reevaluateStart?.output', '$vars.applyReviewerChanges.output');
const persistReevaluationRecords = nodeById(reevaluateSubflow.nodes, 'persistReevaluationRecords');
persistReevaluationRecords.inputs.in_InvoiceRecordId = '=js:$vars.assessReadiness.output.invoiceRecordId';
const confirmReevaluationPersistence = nodeById(
  reevaluateSubflow.nodes,
  'confirmReevaluationPersistence',
);
const reevaluateEnd = nodeById(reevaluateSubflow.nodes, 'reevaluateEnd');
reevaluateEnd.outputs.output.type = 'any';
const reevaluateOutput = reevaluateSubflow.variables.globals.find(
  (variable) => variable.id === 'output',
);
if (reevaluateOutput) reevaluateOutput.type = 'any';
reevaluateSubflow.nodes = [
  reevaluateStart,
  applyReviewerChanges,
  reanalyzeChangedFindings,
  reevaluateFinancials,
  assessReadiness,
  persistReevaluationRecords,
  confirmReevaluationPersistence,
  reevaluateEnd,
];
reevaluateSubflow.edges = [
  edge('re01', 'reevaluateStart', 'output', 'applyReviewerChanges'),
  edge('re02', 'applyReviewerChanges', 'success', 'reanalyzeChangedFindings'),
  edge('re03', 'reanalyzeChangedFindings', 'output', 'reevaluateFinancials'),
  edge('re04', 'reevaluateFinancials', 'output', 'assessReadiness'),
  edge('re05', 'assessReadiness', 'success', 'persistReevaluationRecords'),
  edge('re06', 'persistReevaluationRecords', 'output', 'confirmReevaluationPersistence'),
  edge('re07', 'confirmReevaluationPersistence', 'success', 'reevaluateEnd'),
];

const prepareFinalRecords = finalSubflow.nodes.find((node) => node.id === 'prepareFinalRecords');
prepareFinalRecords.inputs.script = prepareFinalRecords.inputs.script.replace(
  "const disposition = decision.submittedMode ?? decision.Action ?? 'Rejected';",
  "const disposition = decision.Action === 'Approve' ? 'Approve' : 'Reject';",
);

flow.subflows = {
  persistInitialAnalysis: initialSubflow,
  reevaluateAffectedFindings: reevaluateSubflow,
  finalizeOutcome: finalSubflow,
};

flow.variables.nodes = [];
flow.variables.variableUpdates = {
  normalizePackage: [
    { variableId: 'canonicalPackage', expression: '=js:$vars.normalizePackage.output' },
  ],
  lookupProjectCost: [
    { variableId: 'reconciliationResult', expression: '=js:$vars.lookupProjectCost.output' },
  ],
  analyzeContract: [
    { variableId: 'contractAnalysis', expression: '=js:$vars.analyzeContract.output' },
  ],
  persistInitialAnalysis: [
    { variableId: 'currentReviewPackage', expression: '=js:$vars.persistInitialAnalysis.output' },
    { variableId: 'analysisVersion', expression: '=js:$vars.persistInitialAnalysis.output.analysisVersion' },
  ],
  reviewerTask: [
    { variableId: 'reviewerDecision', expression: '=js:$vars.reviewerTask.output' },
  ],
  reevaluateAffectedFindings: [
    { variableId: 'currentReviewPackage', expression: '=js:$vars.reevaluateAffectedFindings.output' },
    { variableId: 'analysisVersion', expression: '=js:$vars.reevaluateAffectedFindings.output.analysisVersion' },
  ],
  managerTask: [
    {
      variableId: 'latestManagerRationale',
      expression: '=js:$vars.managerTask.output.managerRationale ?? $vars.latestManagerRationale',
    },
  ],
};

const positions = {};
for (const [index, node] of flow.nodes.filter((item) => !item.parentId).entries()) {
  positions[node.id] = {
    position: { x: 80 + index * 190, y: 220 },
    size: node.id === 'extractDocuments'
      ? { width: 460, height: 300 }
      : { width: 96, height: 96 },
    collapsed: false,
  };
}
positions.extractDocument = {
  position: { x: positions.extractDocuments.position.x + 100, y: 320 },
  size: { width: 96, height: 96 },
  collapsed: false,
};
positions.collectDocumentExtraction = {
  position: { x: positions.extractDocuments.position.x + 280, y: 320 },
  size: { width: 96, height: 96 },
  collapsed: false,
};
flow.layout.nodes = positions;

for (const subflow of Object.values(flow.subflows)) {
  subflow.variables.nodes = [];
  subflow.layout.nodes = Object.fromEntries(subflow.nodes.map((node, index) => [
    node.id,
    {
      position: { x: 120 + index * 190, y: 160 },
      size: { width: 96, height: 96 },
      collapsed: false,
    },
  ]));
}

if (!flow.definitions.some((definition) => definition.nodeType === 'core.logic.loop')) {
  const registryOutput = execFileSync(
    uip,
    ['maestro', 'flow', 'registry', 'get', 'core.logic.loop', '--output', 'json'],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, UIPATH_CLI_DISABLE_VERSION_SYNC: '1' },
    },
  );
  flow.definitions.push(JSON.parse(registryOutput).Data.Node);
}

await writeFile(flowPath, `${JSON.stringify(flow, null, 2)}\n`, 'utf8');
console.log(`Rebuilt simplified demo Flow: ${flowPath}`);
