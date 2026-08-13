# Demo-Linear Invoice Assurance Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the structurally valid but business-incomplete Flow with the smallest orchestration that reliably demonstrates multi-document extraction, Reviewer evidence/correction, targeted re-evaluation, Manager disposition, and final persistence.

**Architecture:** Keep every published component and the two existing Action Center tasks. Simplify the top-level Flow to one linear business journey, use one loop to extract every uploaded source document, and retain only three persistence checkpoints: initial review package, post-review re-evaluation, and final disposition. Technical failures fault clearly instead of being converted into human review work.

**Tech Stack:** UiPath Maestro Flow JSON, UiPath IXP, ProjectCostLookupApi, ContractComplianceAgent, FinancialRulesEvaluator, InvoiceAssurancePersistence 1.0.2, Coded Action App React/TypeScript, Node test runner, Vitest.

## Global Constraints

- Target `uipathlabs / Playground / AMER Presales/HLS` with folder key `79d872b0-bee1-4264-a6de-3e780f4e4239`.
- Preserve the existing IXP model, Agent, Function, API Workflow, Main App, Action App, three folder-scoped entities, and persistence process.
- Treat this as an 8–10 minute demo: no queues, case stages, production retry framework, ERP integration, or extra persistence layers.
- Do not hard-code fixture findings, invoice identifiers, rates, adjustments, or payable totals.
- Every uploaded source document must be passed through the published IXP model.
- Reviewer evidence and register corrections must change the inputs used by targeted re-evaluation.
- Manager `Action`, not task mode, controls Approve, Return to Reviewer, and Reject routing.
- Run `npm test` after every JavaScript or TypeScript modification.

---

### Task 1: Add business-journey regression tests

**Files:**
- Create: `tests/flow-demo-journey.test.mjs`
- Modify: `InvoiceAssuranceActionApp/src/services/review-contract.test.ts`

**Interfaces:**
- Consumes: `HealthcareInvoiceAssurance/InvoiceAssuranceFlow/InvoiceAssuranceFlow.flow` and `normalizeTaskData()`.
- Produces: executable assertions for document iteration, Reviewer delta application, readiness routing, and final Manager disposition.

- [ ] Write a Flow contract test that executes the relevant Script-node JavaScript against controlled multi-document and Reviewer fixtures.
- [ ] Assert all source document IDs are extracted and aggregated.
- [ ] Assert uploaded evidence is attached only to changed charges/findings and corrected register total replaces the prior register total without becoming an adjustment.
- [ ] Assert `Approve` persists `Approved`, `Reject` persists `Rejected`, and `ReturnToReviewer` does not enter finalization.
- [ ] Add an Action App test proving a task whose invoice summary is awaiting evidence defaults to `AwaitingEvidence` and cannot be submitted prematurely.
- [ ] Run root and Action App tests and confirm the new assertions fail for the current implementation.

### Task 2: Simplify and correct the Maestro Flow

**Files:**
- Create: `scripts/build-demo-linear-flow.mjs`
- Modify: `HealthcareInvoiceAssurance/InvoiceAssuranceFlow/InvoiceAssuranceFlow.flow`

**Interfaces:**
- Consumes: the existing published resource node definitions and bindings.
- Produces: a formatted Flow with one multi-document extraction loop, one Reviewer loop, one Manager decision, and three persistence checkpoints.

- [ ] Synchronize the current Studio Web Flow into the workspace before transformation.
- [ ] Use the registry-derived `core.logic.loop` definition and retain existing registry-derived resource definitions.
- [ ] Remove `markProcessing` and its persistence subflow.
- [ ] Add `extractDocuments` loop, `extractDocument` IXP body node, and `collectDocumentExtraction` body Script.
- [ ] Replace single-document normalization with package normalization over the loop’s aggregated extraction outputs.
- [ ] Replace the post-Reviewer path with a Script that applies `uploadedEvidence`, `correctedRegisterAmount`, dispositions, and changed finding IDs to the prior package.
- [ ] Re-run the Agent and Function only for the changed finding IDs, then persist the revised package.
- [ ] Route unresolved results back to the existing Reviewer task and ready results to the existing Manager task.
- [ ] Route Manager `Action === 'ReturnToReviewer'` back to Reviewer; persist `Approved` or `Rejected` from the exact Manager action.
- [ ] Keep only `persistInitialAnalysis`, `persistReevaluation`, and `finalizeOutcome` persistence subflows.
- [ ] Run `uip maestro flow format` and `uip maestro flow validate --strict-bindings`.
- [ ] Run `npm test` and confirm the Flow business-journey tests pass.

### Task 3: Correct the Action App’s evidence default

**Files:**
- Modify: `InvoiceAssuranceActionApp/src/models/action.ts`
- Test: `InvoiceAssuranceActionApp/src/services/review-contract.test.ts`

**Interfaces:**
- Consumes: task input `invoiceSummary.awaitingEvidence` and optional persisted `evidenceStatus`.
- Produces: normalized Reviewer task data that starts in `AwaitingEvidence` when the persisted task has not supplied an explicit evidence status.

- [ ] Change `normalizeTaskData()` so an explicit task value wins; otherwise use `AwaitingEvidence` when `invoiceSummary.awaitingEvidence` is true and `Resolved` when false.
- [ ] Run `npm test`, `npm run lint`, and `npm run build` in `InvoiceAssuranceActionApp`.

### Task 4: Publish and verify the corrected artifacts

**Files:**
- Modify generated deployment metadata only through UiPath CLI commands.

**Interfaces:**
- Consumes: validated Flow and built Action App.
- Produces: updated Studio Web Flow, a new Flow package/release version, and Action App version 1.0.2 deployed over the existing HLS app deployment.

- [ ] Upload the corrected solution artifact to the existing Studio Web solution after local verification.
- [ ] Download it again and verify the cloud Flow matches the locally validated graph.
- [ ] Pack and publish the Flow at the next available version and update the existing HLS release.
- [ ] Pack, publish, and deploy Action App version `1.0.2` to folder key `79d872b0-bee1-4264-a6de-3e780f4e4239`.
- [ ] Run fresh root tests, Action App tests/lint/build, Flow validation, and resource-binding checks.
- [ ] Stop before claiming end-to-end completion unless a live Reviewer-to-Manager run provides process, task, persistence, and final-status evidence.
