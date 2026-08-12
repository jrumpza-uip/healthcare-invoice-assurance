import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const flowPath = new URL(
  '../HealthcareInvoiceAssurance/InvoiceAssuranceFlow/InvoiceAssuranceFlow.flow',
  import.meta.url,
);

test('Flow persistence payloads use only approved Data Fabric fields', async () => {
  const source = await readFile(flowPath, 'utf8');
  const flow = JSON.parse(source);
  const scripts = Object.values(flow.subflows)
    .flatMap((subflow) => subflow.nodes)
    .map((node) => node.inputs?.script)
    .filter(Boolean)
    .join('\n');

  for (const forbiddenField of [
    'FinancialSnapshotJson',
    'ReviewerDecisionJson',
    'FinalDisposition',
    'ManagerDecisionJson',
    'FinalFinancialSnapshotJson',
  ]) {
    assert.doesNotMatch(
      scripts,
      new RegExp(`\\b${forbiddenField}\\s*:`),
      `${forbiddenField} is not part of the approved three-entity schema`,
    );
  }
});

test('Every state-changing Flow subflow prepares a header update and activity event', async () => {
  const flow = JSON.parse(await readFile(flowPath, 'utf8'));

  for (const subflowName of [
    'markProcessing',
    'persistInitialAnalysis',
    'persistReviewerWork',
    'reevaluateAffectedFindings',
    'finalizeOutcome',
  ]) {
    const scripts = flow.subflows[subflowName].nodes
      .map((node) => node.inputs?.script)
      .filter(Boolean)
      .join('\n');

    assert.match(scripts, /\bmainRecord\s*:/, `${subflowName} must prepare the approved main-record update`);
    assert.match(scripts, /\bactivityRecord\s*:/, `${subflowName} must prepare an append-only activity event`);
  }
});

test('Technical paths persist a review package before creating the Reviewer task', async () => {
  const flow = JSON.parse(await readFile(flowPath, 'utf8'));
  const targets = new Map(flow.edges.map((edge) => [edge.id, edge.targetNodeId]));

  for (const edgeId of ['e08', 'e21', 'e22', 'e23']) {
    assert.equal(targets.get(edgeId), 'persistInitialAnalysis', `${edgeId} must record its technical-review state first`);
  }
});

test('Human tasks consume the latest versioned review package', async () => {
  const flow = JSON.parse(await readFile(flowPath, 'utf8'));
  const reviewerTask = flow.nodes.find((node) => node.id === 'reviewerTask');
  const managerTask = flow.nodes.find((node) => node.id === 'managerTask');
  const variableUpdates = flow.variables.variableUpdates ?? {};

  assert.equal(reviewerTask.inputs.appInputBindings.findings, '=vars.currentReviewPackage.authoritativeFindings');
  assert.equal(managerTask.inputs.appInputBindings.findings, '=vars.currentReviewPackage.authoritativeFindings');
  assert.deepEqual(
    variableUpdates.persistInitialAnalysis?.find((update) => update.variableId === 'currentReviewPackage'),
    { variableId: 'currentReviewPackage', expression: '=js:$vars.persistInitialAnalysis.output' },
  );
  assert.deepEqual(
    variableUpdates.reevaluateAffectedFindings?.find((update) => update.variableId === 'currentReviewPackage'),
    { variableId: 'currentReviewPackage', expression: '=js:$vars.reevaluateAffectedFindings.output' },
  );
});

test('Every state-changing subflow synchronously calls the published HLS persistence process', async () => {
  const flow = JSON.parse(await readFile(flowPath, 'utf8'));
  const persistenceType =
    'uipath.core.rpa-workflow.dd273b1c-d925-45d0-b1b6-b719cd972819';
  const cases = {
    markProcessing: {
      prepareId: 'prepareProcessingRecords',
      processId: 'persistProcessingRecords',
      confirmId: 'confirmProcessingPersistence',
      endId: 'markProcessingEnd',
      operation: 'MarkProcessing',
    },
    persistInitialAnalysis: {
      prepareId: 'prepareInitialPersistence',
      processId: 'persistInitialRecords',
      confirmId: 'confirmInitialPersistence',
      endId: 'persistInitialEnd',
      operation: 'PersistInitial',
    },
    persistReviewerWork: {
      prepareId: 'prepareReviewerPersistence',
      processId: 'persistReviewerRecords',
      confirmId: 'confirmReviewerPersistence',
      endId: 'persistReviewerEnd',
      operation: 'PersistReviewer',
    },
    reevaluateAffectedFindings: {
      prepareId: 'assessReadiness',
      processId: 'persistReevaluationRecords',
      confirmId: 'confirmReevaluationPersistence',
      endId: 'reevaluateEnd',
      operation: 'PersistReevaluation',
    },
    finalizeOutcome: {
      prepareId: 'prepareFinalRecords',
      processId: 'persistFinalRecords',
      confirmId: 'confirmFinalPersistence',
      endId: 'finalizeEnd',
      operation: 'Finalize',
    },
  };

  const persistenceDefinition = flow.definitions.find(
    (definition) => definition.nodeType === persistenceType,
  );
  assert.ok(persistenceDefinition, 'Flow must embed the exact published persistence-node definition');
  assert.equal(persistenceDefinition.version, '1.0.0');
  assert.equal(
    persistenceDefinition.model.bindings.resourceKey,
    'AMER Presales/HLS.InvoiceAssurancePersistence',
  );
  assert.deepEqual(Object.keys(persistenceDefinition.inputDefinition.properties), [
    'in_Operation',
    'in_InvoiceRecordId',
    'in_CorrelationId',
    'in_MainRecordJson',
    'in_LineRecordsJson',
    'in_ActivityRecordJson',
  ]);
  assert.deepEqual(Object.keys(persistenceDefinition.outputDefinition.output.schema.properties), [
    'out_Success',
    'out_InvoiceRecordId',
    'out_CorrelationId',
    'out_Operation',
    'out_ActivityRecordId',
    'out_CreatedCount',
    'out_UpdatedCount',
    'out_ErrorCode',
    'out_ErrorMessage',
  ]);

  for (const [subflowName, expected] of Object.entries(cases)) {
    const subflow = flow.subflows[subflowName];
    const processNode = subflow.nodes.find((node) => node.id === expected.processId);
    const confirmNode = subflow.nodes.find((node) => node.id === expected.confirmId);
    const endNode = subflow.nodes.find((node) => node.id === expected.endId);
    const edges = subflow.edges.map((edge) => ({
      sourceNodeId: edge.sourceNodeId,
      sourcePort: edge.sourcePort,
      targetNodeId: edge.targetNodeId,
      targetPort: edge.targetPort,
    }));

    assert.equal(processNode?.type, persistenceType, `${subflowName} must call persistence`);
    assert.equal(processNode.inputs.in_Operation, expected.operation);
    assert.equal(
      processNode.inputs.in_InvoiceRecordId,
      `=js:$vars.${expected.prepareId}.output.invoiceRecordId`,
    );
    assert.equal(
      processNode.inputs.in_CorrelationId,
      `=js:$vars.${expected.prepareId}.output.correlationId`,
    );
    assert.equal(
      processNode.inputs.in_MainRecordJson,
      `=js:JSON.stringify($vars.${expected.prepareId}.output.mainRecord ?? {})`,
    );
    assert.equal(
      processNode.inputs.in_LineRecordsJson,
      `=js:JSON.stringify($vars.${expected.prepareId}.output.lineRecords ?? [])`,
    );
    assert.equal(
      processNode.inputs.in_ActivityRecordJson,
      `=js:JSON.stringify($vars.${expected.prepareId}.output.activityRecord ?? {})`,
    );
    assert.equal(processNode.inputs.errorHandlingEnabled, true);
    assert.match(confirmNode?.inputs?.script ?? '', /out_Success !== true/);
    assert.match(confirmNode?.inputs?.script ?? '', /throw new Error/);
    assert.equal(endNode.outputs.output.source, `=js:$vars.${expected.confirmId}.output`);

    assert.ok(
      edges.some(
        (edge) =>
          edge.sourceNodeId === expected.prepareId &&
          edge.sourcePort === 'success' &&
          edge.targetNodeId === expected.processId &&
          edge.targetPort === 'input',
      ),
      `${subflowName} must persist only after record preparation succeeds`,
    );
    assert.ok(
      edges.some(
        (edge) =>
          edge.sourceNodeId === expected.processId &&
          edge.sourcePort === 'output' &&
          edge.targetNodeId === expected.confirmId &&
          edge.targetPort === 'input',
      ),
      `${subflowName} must verify the synchronous persistence result`,
    );
    assert.ok(
      edges.some(
        (edge) =>
          edge.sourceNodeId === expected.confirmId &&
          edge.sourcePort === 'success' &&
          edge.targetNodeId === expected.endId &&
          edge.targetPort === 'input',
      ),
      `${subflowName} must end only after persistence succeeds`,
    );
  }
});

test('Flow binds persistence to the existing AMER Presales/HLS process', async () => {
  const flow = JSON.parse(await readFile(flowPath, 'utf8'));
  const persistenceBindings = flow.bindings.filter(
    (binding) => binding.resourceKey === 'AMER Presales/HLS.InvoiceAssurancePersistence',
  );

  assert.deepEqual(
    persistenceBindings.map((binding) => [binding.name, binding.default, binding.resourceSubType]),
    [
      ['name', 'InvoiceAssurancePersistence', 'Process'],
      ['folderPath', 'AMER Presales/HLS', 'Process'],
    ],
  );
});

test('Published API and Agent bindings retain the approved HLS folder path', async () => {
  const flow = JSON.parse(await readFile(flowPath, 'utf8'));
  const expected = new Map([
    ['8cb92544-1799-40af-91b2-6e2f3085fe69', 'ProjectCostLookupApi'],
    ['7147dad8-2ef2-4d99-9af6-bafbc4c24a91', 'ContractComplianceAgent'],
  ]);

  for (const [resourceKey, displayName] of expected) {
    const folderBinding = flow.bindings.find(
      (binding) =>
        binding.resourceKey === resourceKey && binding.name === 'folderPath',
    );
    const definition = flow.definitions.find(
      (candidate) => candidate.model?.bindings?.resourceKey === resourceKey,
    );
    const definitionFolder = definition?.model?.bindings?.values?.find(
      (value) => value.name === 'folderPath',
    );

    assert.equal(folderBinding?.default, 'AMER Presales/HLS', `${displayName} binding must stay in HLS`);
    assert.equal(
      definitionFolder?.default,
      'AMER Presales/HLS',
      `${displayName} manifest must remain solution-pack resolvable in HLS`,
    );
  }
});
