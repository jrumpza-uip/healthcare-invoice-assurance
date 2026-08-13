import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const flowPath = new URL(
  '../HealthcareInvoiceAssurance/InvoiceAssuranceFlow/InvoiceAssuranceFlow.flow',
  import.meta.url,
);

async function loadFlow() {
  return JSON.parse(await readFile(flowPath, 'utf8'));
}

function findNode(flow, nodeId) {
  const topLevel = flow.nodes.find((node) => node.id === nodeId);
  if (topLevel) return topLevel;
  for (const subflow of Object.values(flow.subflows)) {
    const nested = subflow.nodes.find((node) => node.id === nodeId);
    if (nested) return nested;
  }
  assert.fail(`Expected Flow node ${nodeId}`);
}

function executeScript(node, vars) {
  assert.equal(node.type, 'core.action.script', `${node.id} must be a Script node`);
  return Function('$vars', node.inputs.script)(vars);
}

test('the demo Flow extracts every uploaded document before normalization', async () => {
  const flow = await loadFlow();
  const loop = findNode(flow, 'extractDocuments');
  const extract = findNode(flow, 'extractDocument');
  const collect = findNode(flow, 'collectDocumentExtraction');

  assert.equal(loop.type, 'core.logic.loop');
  assert.equal(loop.inputs.collection, '=js:$vars.validateSubmission.output.sourceDocumentIds');
  assert.equal(extract.parentId, 'extractDocuments');
  assert.equal(extract.inputs.fileRef, '=js:$vars.extractDocuments.currentItem');
  assert.equal(collect.parentId, 'extractDocuments');

  const result = executeScript(collect, {
    extractDocuments: { currentItem: 'corr/support/register.pdf' },
    extractDocument: { output: { ExtractionResult: { DocumentId: 'ixp-2' } } },
  });

  assert.deepEqual(result, {
    sourceDocumentId: 'corr/support/register.pdf',
    extraction: { ExtractionResult: { DocumentId: 'ixp-2' } },
  });
});

test('package normalization combines invoice lines and register data from separate IXP results', async () => {
  const flow = await loadFlow();
  const normalize = findNode(flow, 'normalizePackage');
  const output = executeScript(normalize, {
    validateSubmission: {
      output: {
        sourceDocumentIds: ['corr/invoice/main.pdf', 'corr/support/register.pdf'],
        accountId: 'account-demo',
        projectId: 'project-demo',
      },
    },
    extractDocuments: {
      output: [
        {
          sourceDocumentId: 'corr/invoice/main.pdf',
          extraction: {
            ExtractionResult: {
              ResultsDocument: {
                Fields: [
                  { FieldName: 'DocumentType', Values: ['Invoice'] },
                  { FieldName: 'InvoiceNumber', Values: ['INV-42'] },
                  { FieldName: 'InvoiceDate', Values: ['2026-07-31'] },
                  { FieldName: 'InvoiceTotal', Values: ['1000.00'] },
                  { FieldName: 'SupplierName', Values: ['Fictional Builder'] },
                  {
                    FieldName: 'LineItems',
                    Values: [{
                      Values: [
                        { FieldName: 'Description', Value: 'Protective equipment' },
                        { FieldName: 'Category', Value: 'PPE' },
                        { FieldName: 'Quantity', Value: '2' },
                        { FieldName: 'UnitRate', Value: '500' },
                        { FieldName: 'SubmittedAmount', Value: '1000' },
                      ],
                    }],
                  },
                ],
              },
            },
          },
        },
        {
          sourceDocumentId: 'corr/support/register.pdf',
          extraction: {
            ExtractionResult: {
              ResultsDocument: {
                Fields: [
                  { FieldName: 'DocumentType', Values: ['CostRegister'] },
                  { FieldName: 'RegisterTotal', Values: ['900.00'] },
                ],
              },
            },
          },
        },
      ],
    },
  });

  assert.equal(output.invoice.number, 'INV-42');
  assert.equal(output.invoice.total, 1000);
  assert.equal(output.register.total, 900);
  assert.equal(output.canonicalCharges.length, 1);
  assert.equal(output.canonicalCharges[0].submittedAmount, 1000);
  assert.equal(output.documents.length, 2);
});

test('Reviewer evidence and register correction change targeted re-evaluation inputs', async () => {
  const flow = await loadFlow();
  const applyReview = findNode(flow, 'applyReviewerChanges');
  const output = executeScript(applyReview, {
    reevaluateStart: {
      output: {
        invoiceRecordId: 'invoice-record-1',
        previousSnapshot: {
          lineItems: [
            { chargeId: 'charge-ppe', evidenceTypes: [] },
            { chargeId: 'charge-labor', evidenceTypes: ['timesheet'] },
          ],
          authoritativeFindings: [
            { findingId: 'finding-ppe', chargeId: 'charge-ppe', evidenceState: 'missingEvidence' },
            { findingId: 'finding-register', chargeId: '', evidenceState: 'reconciliationException' },
          ],
          documents: [{ documentId: 'invoice.pdf' }],
        },
        reconciliationSummary: {
          invoiceRegisterComparison: {
            invoiceTotal: 1000,
            registerTotal: 900,
            variance: 100,
            status: 'Variance',
          },
        },
        reviewerDecision: {
          correctedRegisterAmount: 1000,
          registerCorrectionReason: 'Corrected to the signed register.',
          evidenceStatus: 'Resolved',
          uploadedEvidence: [{
            evidenceId: 'evidence-1',
            bucketPath: 'corr/evidence/ppe-receipt.pdf',
            displayName: 'ppe-receipt.pdf',
            contentType: 'application/pdf',
          }],
          changedFindingIds: ['finding-ppe'],
          reviewReady: true,
        },
      },
    },
  });

  assert.deepEqual(output.changedFindingIds.sort(), ['finding-ppe', 'finding-register']);
  assert.deepEqual(output.canonicalCharges[0].evidenceTypes, ['itemized-receipt']);
  assert.deepEqual(output.canonicalCharges[1].evidenceTypes, ['timesheet']);
  assert.equal(output.reconciliationSummary.invoiceRegisterComparison.registerTotal, 1000);
  assert.equal(output.reconciliationSummary.invoiceRegisterComparison.variance, 0);
  assert.equal(output.reconciliationSummary.invoiceRegisterComparison.status, 'Tied');
  assert.equal(output.documents.at(-1).bucketPath, 'corr/evidence/ppe-receipt.pdf');
});

test('Manager Action controls the persisted final disposition', async () => {
  const flow = await loadFlow();
  const prepareFinal = findNode(flow, 'prepareFinalRecords');
  const baseInput = {
    invoiceRecordId: 'invoice-record-1',
    correlationId: 'corr-1',
    latestAnalysis: {
      analysisVersion: 2,
      financialSnapshot: {
        submittedTotal: 1000,
        totalAdjustment: 100,
        proposedPayable: 900,
        version: 2,
      },
      authoritativeFindings: [],
    },
    eventName: 'Final disposition recorded',
    eventType: 'FinalDisposition',
    eventSource: 'InvoiceAssuranceFlow.finalizeOutcome',
  };

  const approved = executeScript(prepareFinal, {
    finalizeStart: { output: { ...baseInput, managerDecision: { Action: 'Approve', submittedMode: 'Manager' } } },
  });
  const rejected = executeScript(prepareFinal, {
    finalizeStart: { output: { ...baseInput, managerDecision: { Action: 'Reject', submittedMode: 'Manager' } } },
  });

  assert.equal(approved.disposition, 'Approve');
  assert.equal(approved.mainRecord.ProcessingStatus, 'Approved');
  assert.equal(rejected.disposition, 'Reject');
  assert.equal(rejected.mainRecord.ProcessingStatus, 'Rejected');
});

test('the demo Flow keeps only three persistence checkpoints', async () => {
  const flow = await loadFlow();
  assert.deepEqual(Object.keys(flow.subflows).sort(), [
    'finalizeOutcome',
    'persistInitialAnalysis',
    'reevaluateAffectedFindings',
  ]);
  assert.equal(flow.nodes.some((node) => node.id === 'markProcessing'), false);
  assert.equal(flow.nodes.some((node) => node.id === 'persistReviewerWork'), false);
});

test('Studio Web task outcomes and inferred schemas match the simplified journey', async () => {
  const flow = await loadFlow();
  const reviewer = findNode(flow, 'reviewerTask');
  const manager = findNode(flow, 'managerTask');
  const reevaluateEnd = findNode(flow, 'reevaluateEnd');
  const evaluate = findNode(flow, 'evaluateFinancials');
  const reevaluate = findNode(flow, 'reevaluateAffectedFindings');
  const end = findNode(flow, 'end');

  assert.equal(evaluate.inputs.currency, '=js:$vars.normalizePackage.output.currency');
  assert.equal(evaluate.inputs.changedFindingIds, '=js:[]');
  assert.equal(reevaluate.inputs.invoiceDate, '=js:$vars.normalizePackage.output.invoice.date');
  assert.equal(end.outputs.processInstanceId.source, '=js:$metadata.InstanceId');
  assert.equal(reviewer.outputs.output.properties.reviewerNotes.type, 'string');
  assert.equal(reviewer.outputs.output.properties.changedFindingIds.type, 'array');
  assert.equal(manager.outputs.output.properties.decisionSummary.type, 'string');
  assert.equal(reevaluateEnd.outputs.output.type, 'any');
  assert.equal(flow.nodes.some((node) => node.id === 'routeManagerOutcome'), false);

  const branches = flow.edges
    .filter((edge) => ['reviewerTask', 'managerTask'].includes(edge.sourceNodeId))
    .map((edge) => [edge.sourceNodeId, edge.sourcePort, edge.targetNodeId]);
  assert.deepEqual(branches, [
    ['reviewerTask', 'SubmitReview', 'reevaluateAffectedFindings'],
    ['managerTask', 'Approve', 'finalizeOutcome'],
    ['managerTask', 'ReturnToReviewer', 'reviewerTask'],
    ['managerTask', 'Reject', 'finalizeOutcome'],
  ]);
});
