# Process Invoice — Maestro Flow Specification

**Component type:** UiPath Maestro Flow (author as `.flow`, compiles to BPMN). Unattended, no schedule — invoked as a **Process Orchestration** subprocess (callable programmatically, e.g. from the Main App).

## 1. Trigger & Input Contract

Single manual/programmatic entry point (`start`). Input arguments:

| Argument | Type | Default | Description |
|---|---|---|---|
| `invoiceRecordId` | string | — | Data Fabric `HLS_InvoiceAssurance_Main.Id` for the invoice being assured |
| `contractProfileId` | string | — | Contract family/profile to apply |
| `sourceDocumentIds` | string[] | `[]` | Storage-bucket paths of uploaded documents to extract |
| `correlationId` | string | — | Cross-component trace ID |
| `forceManagerReview` | boolean | `false` | Operator override — skip the readiness gate and force manager escalation |

## 2. Node Graph (execution order)

Build as four logical phases (source flow groups these as sticky-note swimlanes: "Document Extraction and Deterministic Lookup", "Contract Analysis", "Initial Review", and a fourth manager/disposition group).

### Phase A — Intake, extraction, normalization, cost lookup

1. **validateSubmission** (script) — trims/validates the four required inputs; throws on missing values. Emits `accountId`/`projectId` (demo fixtures — externalize as config) and a `precedencePolicy` object (`{mode: "topic-specific", effectiveOnOrBeforeInvoiceDate: true}`) used later by the compliance agent.
2. **extractDocuments** (parallel loop over `sourceDocumentIds`):
   - **extractCurrentDocument** — calls **Extract Uploaded Document** (see [03-Automation-Components-Spec.md](03-Automation-Components-Spec.md) §1) with `in_DocumentPath = currentItem`.
   - **collectExtractedDocument** (script) — throws if extraction failed or JSON invalid; else parses `out_ExtractedDocumentJson` into `{documentPath, extraction}`.
   - Loop output: array of `{documentPath, extraction}` for all documents (parallel execution).
3. **logActivity2** — calls **Log Activity** with `EventType: "DocumentExtraction"`, summary `"<n> document(s) extracted"`.
4. **normalizePackage** (script) — builds the canonical invoice package:
   - Classifies each document via its `Document Type` field group into `Primary Invoice | Supporting Invoice | Receipt | Cost Register | Unknown`.
   - Builds `documents[]` (`documentId`, `bucketId` [uploaded-invoices bucket — externalize this id as config, not a hardcoded literal], `bucketPath`, `displayName`, `documentType`, `checksum`).
   - From the Primary Invoice: `invoice{number,date,supplierName,customerName,projectName,total,currency}`, `supplier.name`, and expands `Invoice Line Items` into `canonicalCharges[]` (`chargeId = documentPath#lineId`, `description`, `category`, `quantity`, `unit`, `unitRate`, `submittedAmount`, `serviceDate`, `reference`, `ixpConfidence`, empty `evidenceTypes[]`/`evidenceDocumentIds[]`).
   - Supporting Invoices → `supportingInvoices[]`; Receipts → `receipts[]`; Cost Register → `register{identifier,invoiceNumber,total,lines:[]}`.
   - Computes `missingRequiredFields` (Supplier Name / Invoice Number / Invoice Date / Invoice Total > 0) and `requiresCorrection` boolean.
5. **requiredFieldsComplete** (decision): `requiresCorrection === false`?
   - **false** → **correctRequiredFields** (HITL quick-form, §3a) → **applyRequiredFieldCorrections** (script — validates/merges corrections, throws if still invalid) → **logActivity5** → continue to step 6.
   - **true** → continue to step 6 directly.
6. **lookupProjectCost2** — calls **ProjectCostLookupApi** (see [03-Automation-Components-Spec.md](03-Automation-Components-Spec.md) §3) with `correlationId, invoiceRecordId, contractProfileId, accountId, projectId, supplier, invoice, register, supportingInvoices, simulateSearchUnavailable:false`. Output: `reconciliationResult` (`searchStatus, supplierMatch, projectMatch, invoiceRecord, invoiceRegisterComparison, supportingDocumentComparisons[], searchesAttempted[], warnings[], errorType, errorMessage`).
7. **logActivity3** — logs the cost-lookup outcome (status, matches, warnings, errors).

### Phase B — Contract compliance analysis

8. **analyzeContract** — calls **ContractComplianceAgent** (see [03-Automation-Components-Spec.md](03-Automation-Components-Spec.md) §4) with `correlationId, invoiceRecordId, contractProfileId, invoiceDate, canonicalCharges, reconciliationSummary=reconciliationResult, precedencePolicy, humanOverride:null, changedFindingIds:[]`. Output: `contractAnalysis{governingDocumentStack[], normalizedRules[], proposedFindings[], ambiguities[], analysisSummary, schemaVersion}`.
9. **logActivity4** — logs finding count, evidence states, governing-document count.
10. **evaluateFinancialFindings** (script) — the deterministic rules engine. For each `proposedFindings[i]`, resolve its `chargeId` in `canonicalCharges` and its `ruleId` in `normalizedRules` (missing reference → `INVALID_REFERENCE` validation error), then evaluate by `ruleType`:

    | ruleType | Computation |
    |---|---|
    | `CategoryExclusion` | `allowed = 0`, status `excluded` |
    | `LaborRateLimit` | `allowed = min(submitted, qty × maxRate)`, status `rateCapped` or `allowed` |
    | `OvertimeRule` | `overtimeRate = explicitRate` or `straightTimeRate × multiplier`; `allowed = min(submitted, qty × overtimeRate)` |
    | `PercentageCap` | `allowed = min(submitted, eligibleSubmittedBase × percentage)` |
    | `EquipmentUnitCap` | `allowed = min(submitted, qty × maxUnitRate)` |
    | `EvidenceRequirement` | `allowed = 0` if `evidenceState !== "valid"`, status `pendingEvidence` |
    | `InvoiceRegisterTieOut` / `SupportingDocumentTieOut` | no deduction, status `reconciliationRecorded` |
    | (anything else) | `UNSUPPORTED_RULE` validation error, skip |

    Multiple findings on the same charge are deduplicated by taking the **maximum adjustment**. Produces `authoritativeFindings[]`, `calculationLines[]` (with a human-readable `trace[]`), `financialSnapshot{submittedTotal, totalAdjustment, proposedPayable, currency, version:1}`, `reconciliationState`, `validationErrors[]`, `status: "valid"|"invalid"`.
11. **buildInitialReviewPackage** (script) — assembles the reviewer-facing payload:
    - Enriches findings with `severity` (High if `adjustment>0`; Medium if status is pending/technical/ambiguous; else Low), `category`, `title`, `explanation`, `financialEffect`, `confidence`, `evidenceState`, contract citation fields.
    - Builds `lineItems[]` (charge + `allowedAmount`, `adjustment`, `evaluationStatus: NeedsReview|Adjusted|Allowed`) and `lineRecords[]` shaped for Data Fabric persistence.
    - Computes `awaitingEvidence` and `processingStatus` (`AwaitingEvidence` or `ReviewerPending`).
    - Builds `mainRecord` (persistence payload, with the 3-tier truncating `FindingsJson` serializer — see [01-Data-Model-Spec.md](01-Data-Model-Spec.md)) and `activityRecord` (`EventType: "AnalysisVersionCreated"`).

### Phase C — Persist + human review cycle

12. **persistInitialAnalysis** — calls **InvoiceAssurancePersistence** with `lineRecords`, `activityRecord`, `mainRecord` from step 11.
13. **initialPersistenceSucceeded** (decision): failure → throw and end (no retry). Success →
14. **reviewInvoiceAssuranceFindings** (HITL, Action App "Reviewer" mode, §3b) → **applyReviewerChanges** (script):
    - Detects newly-resolved evidence; appends demo evidence-type strings to previously `pendingEvidence`/evidence-missing findings when resolved.
    - Appends `uploadedEvidence[]` to `documents[]` as `documentType: "supporting-evidence"`.
    - Applies manual register correction if `correctedRegisterAmount ≥ 0` + `registerCorrectionReason` given; recomputes `invoiceRegisterComparison` (`Tied` if `|variance| ≤ 0.01` else `Variance`).
    - Merges reviewer `findingDispositions[]` (status ≠ `Open`) into `humanOverride` narrative text and `changedFindingIds` (falls back to *all* existing finding ids if the reviewer submitted none).
15. **reanalyzeReviewerChanges** — re-invokes **ContractComplianceAgent** with `humanOverride` and `changedFindingIds` populated (targeted re-evaluation).
16. **reevaluateFinancialFindings** (script) — same rule engine as step 10, re-run on reviewer-corrected charges/rules.
17. **assessApprovalReadiness** (script) — re-enriches findings (adds `ContractAmbiguity` pseudo-findings from `ambiguities[]`); recomputes `unresolvedFindings` (status pending/technical/ambiguous, or `evidenceState` missing) and `awaitingEvidence`; computes the gate:
    ```
    readiness = reviewerDecision.reviewReady === true
             && evaluation.status === "valid"
             && unresolvedFindings.length === 0
    ```
    Bumps `analysisVersion` and `reviewCycle`; rebuilds `lineItems`/`lineRecords`/`mainRecord`/`activityRecord`.
18. **persistReviewerReevaluation** — calls **InvoiceAssurancePersistence** again.
19. **reevaluationPersistenceSucceeded** (decision): failure → throw and end. Success →
20. **readyForManagerReview** (decision): `readiness === true || forceManagerReview === true`?
    - **false** → loop back to step 14 (**reviewInvoiceAssuranceFindings**) — another reviewer cycle.
    - **true** → **managerReview** (HITL, Action App "Manager" mode, §3c).

### Phase D — Manager decision and final disposition

21. **routeManagerAction** (switch on `managerReview.output.Action`):
    - `Approve` → **prepareFinalDisposition**
    - `Reject` → **prepareFinalDisposition** (same target)
    - `ReturnToReviewer` → **prepareReturnToReviewer**
    - anything else → throw `Unsupported Manager action: <Action>`
22. **prepareReturnToReviewer** (script) — captures `managerRationale`, appends a `ManagerReturn` activity entry, sets `ProcessingStatus = ReviewerPending`, `readiness: false` → **logActivity1** (`EventType: "ManagerReturn"`) → loop back to step 14 with `priorManagerRationale` populated.
23. **prepareFinalDisposition** (script) — validates `Action` is `Approve`/`Reject`; sets `processingStatus = Approved|Rejected`; recomputes `unresolvedFindings`/`awaitingEvidence`; builds final `mainRecord` and `activityRecord` (`EventType: "FinalDisposition"`).
24. **persistFinalDisposition** — calls **InvoiceAssurancePersistence** with the final records.
25. **finalPersistenceSucceeded** (decision): failure → throw and end. Success → **end** (flow completes).

## 3. Human-in-the-Loop Nodes

### 3a. `correctRequiredFields` — Quick Form
Title: "Correct invoice fields". Priority Medium. Channels: Email + Action Center. Fields (all in/out, required): `suppliername`, `invoicenumber`, `invoicedate`, `invoicetotal` (pre-populated from `normalizePackage` output). Single outcome: **Submit correction**.

### 3b. `reviewInvoiceAssuranceFindings` — Coded Action App, mode `Reviewer`
Title: "Review healthcare invoice". Priority High. Channels: Slack, Teams, Email, Action Center. Bound to the **InvoiceAssuranceActionApp** ([05-Action-App-Spec.md](05-Action-App-Spec.md)), `taskMode: "Reviewer"`.
- **Input-only:** `invoiceRecordId, correlationId, analysisVersion, reviewCycle, processingStatus, invoiceSummary, findings[], charges[], documents[], activity[], priorManagerRationale`.
- **In/out (reviewer-writable):** `correctedRegisterAmount, registerCorrectionReason, evidenceRequestNote, evidenceStatus, uploadedEvidence[], findingDispositions[], reviewerNotes, managerRationale, changedFindingIds[]`.
- **Outcome consumed by the flow:** `SubmitReview` (completes the node → `applyReviewerChanges`). The app itself supports `Approve`/`ReturnToReviewer`/`Reject` as reviewer-facing button labels only in Manager mode — Reviewer mode's only outcome is `SubmitReview`.
- Re-entered from three points: after initial persistence, after a failed readiness check (loop), and after a manager `ReturnToReviewer` decision (with `priorManagerRationale` populated).

### 3c. `managerReview` — Coded Action App, mode `Manager`
Title: "Approve healthcare invoice assurance". Priority High. Same channels/app binding as 3b, `taskMode: "Manager"`, `processingStatus: "ManagerReview"` (a **display-only literal** for the Action App header — the value persisted to Data Fabric at this point is `ManagerPending`, set by `assessApprovalReadiness`; see [01-Data-Model-Spec.md](01-Data-Model-Spec.md) §1), `priorManagerRationale` from the last manager return. Outcomes: `Approve`, `ReturnToReviewer`, `Reject` — routed by step 21.

Both coded-action-app nodes present identical underlying data (invoice summary, charges, findings with contract citations, documents, activity history) — only `taskMode`/`processingStatus`/allowed-outcome set differ.

## 4. Error Handling

- **No automatic retries anywhere.** Every "did the call succeed" check is a single decision node with a hard-failure branch that throws and ends the run. Preserve this fail-fast behavior unless the rebuild deliberately adds retry/backoff around the persistence/API/agent calls — call this out explicitly as a design decision if changed.
- **Document extraction failures** are caught inline per-document (`collectExtractedDocument`) with the specific document path in the error.
- **The only cyclical paths are human escalation**, not technical retry: reviewer ⇄ manager (`ReturnToReviewer`) and the reviewer readiness re-check loop.
- `forceManagerReview` is an operator override that bypasses the readiness computation entirely.

## 5. Bindings

Five process-type resource bindings (folder path resolved at deploy time to the target Orchestrator folder):

| Bound component | Kind | Used by |
|---|---|---|
| Extract Uploaded Document | RPA workflow | `extractCurrentDocument` |
| ProjectCostLookupApi | API workflow | `lookupProjectCost2` |
| ContractComplianceAgent | Agent | `analyzeContract`, `reanalyzeReviewerChanges` |
| InvoiceAssurancePersistence | RPA workflow | `persistInitialAnalysis`, `persistReviewerReevaluation`, `persistFinalDisposition` |
| Log Activity | RPA workflow | `logActivity1` … `logActivity5` |

The Action App resource (`invoiceassuranceactionapp`) is bound directly on the two HITL nodes rather than as a flow-level v2 binding. No storage-bucket or Data Fabric bindings exist at the flow level — bucket/entity access is encapsulated inside the bound RPA workflows; **externalize the bucket id/name as flow-level configuration** rather than hardcoding it inside `normalizePackage` as the source solution does.
