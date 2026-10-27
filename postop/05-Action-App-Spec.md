# InvoiceAssuranceActionApp — Coded Action App Specification

**Stack:** React/TypeScript + `@uipath/coded-action-app` (`CodedActionAppService`) + `@uipath/uipath-typescript` SDK (`Buckets`, `Entities`) + `react-pdf` for document viewing.

## 1. Purpose

Renders the Action Center task form for both HITL steps in the "Process Invoice" flow ([02-Maestro-Flow-Spec.md](02-Maestro-Flow-Spec.md) §3b/3c), driven by a single `taskMode: 'Reviewer' | 'Manager'` field in the task data:

- **Reviewer mode** ("Review invoice") — inspect findings/charges, resolve or upload evidence, apply a corrected register amount if needed, disposition each finding, submit with outcome `SubmitReview`.
- **Manager mode** ("Approve invoice") — read the reviewer's submission and rationale, decide `Approve`, `ReturnToReviewer`, or `Reject`.

The app enforces it only ever operates within the target Orchestrator folder (`AMER Presales/HLS` in the source — make this a config value, not a hardcoded numeric id) and shows a blocking error if the task's folder doesn't match.

## 2. Input Contract

Delivered via the Action Center task's `data` payload, normalized with defaults for any missing field:

| Field | Type | Notes |
|---|---|---|
| `taskMode` | `'Reviewer' \| 'Manager'` | |
| `invoiceRecordId`, `correlationId` | string | required |
| `analysisVersion`, `reviewCycle` | number | |
| `processingStatus` | string | |
| `invoiceSummary` | `{invoiceNumber, invoiceDate, supplierName, accountName, projectName, contractProfileId, submittedTotal, currentAdjustment, currentPayable, openFindingCount, awaitingEvidence}` | |
| `findings[]` | `{findingId, chargeId, ruleId, severity, category, title, explanation, financialEffect, status, confidence, evidenceState, contractDocumentTitle, contractClause, contractExcerptSummary, applicabilityExplanation, sourceDocumentId}` | |
| `charges[]` | `{chargeId, sourceDocumentId, category, description, quantity, unit, submittedRate, submittedAmount, allowedAmount, adjustment, evaluationStatus, sourceReference}` | |
| `documents[]` | `{documentId, bucketId, bucketPath, displayName, documentType, checksum}` | |
| `activity[]` | `{eventTimestamp, eventName, eventType, summary}` | |
| `priorManagerRationale` | string | populated when a manager previously returned the case |
| `evidenceStatus`, `evidenceRequestNote`, `uploadedEvidence[]` | — | reviewer work-in-progress fields, carried through re-entries |

**Fallback enrichment:** if `documents`/`charges` arrive empty (e.g. payload size limits upstream), query Data Fabric directly (Main by id; LineItems/Activity filtered by `InvoiceRecordId`, folder-scoped) and reconstruct the missing arrays, parsing `FindingsJson`/`DocumentReferencesJson` from the Main record.

**Validation on load:** must be `Reviewer`/`Manager` mode, must have `invoiceRecordId`/`correlationId`, must be in the expected folder — otherwise render a blocking error screen instead of the form.

## 3. Output Contract

Two distinct write paths:

- **Draft/autosave** — persist the current form state on every edit and on an explicit "Save and exit" action (Reviewer only), keeping the task open for later.
- **Completion** — submit the outcome plus the full form data, augmented with:
  - `submittedMode = taskMode`
  - `reviewReady = (outcome === 'Approve') || (outcome === 'SubmitReview' && evidenceStatus !== 'AwaitingEvidence')`
  - `correctionApplied = taskMode === 'Reviewer' && correctedRegisterAmount > 0`
  - `completedAt` (ISO timestamp)
  - `decisionSummary` = `reviewerNotes` (on `SubmitReview`) or `managerRationale` (other outcomes)

Full output payload includes all input fields plus: `correctedRegisterAmount, registerCorrectionReason, evidenceRequestNote, evidenceStatus, uploadedEvidence[], findingDispositions[] ({findingId, status, notes}), reviewerNotes, managerRationale, changedFindingIds[]`, plus the four computed fields above.

**Pre-completion validation:**
- Outcome must be one of the outcomes allowed for the current mode (`Reviewer` → `SubmitReview` only; `Manager` → `Approve | ReturnToReviewer | Reject`).
- `SubmitReview` requires a `registerCorrectionReason` if `correctedRegisterAmount > 0`.
- `SubmitReview` requires at least one uploaded evidence item if `awaitingEvidence && evidenceStatus === 'Resolved'` and none is present.
- Submission is blocked entirely (status stays `AwaitingEvidence`) with a "save and reopen later" message if evidence is still outstanding.
- `ReturnToReviewer`/`Reject` require a non-empty `managerRationale`.

**Evidence upload:** PDF only, non-empty, ≤20 MB; path `evidence/{invoiceRecordId}/{correlationId}/{timestamp}-{filename}`; upload to the invoices bucket (not Data Fabric); compute a SHA-256 checksum client-side; append the resulting `EvidenceReference` to `uploadedEvidence[]`.

## 4. UI Layout

- **Header** — mode-dependent title/subtitle (invoice number · supplier · analysis version), status/mode/read-only badges, theme toggle.
- **Summary strip** — Submitted / Adjustment / Payable / Open findings / Evidence status, currency-formatted.
- **Manager-return alert** — shown when `priorManagerRationale` is set.
- **Resizable two-pane layout** (drag handle, persisted width preference, min/max bounds):
  - **Left (primary) column:**
    - *Findings & contract evidence* — per finding: severity/category/confidence badges, title, explanation, financial effect, contract clause/excerpt/applicability text; Reviewer-only per-finding disposition select (`Open | Accepted | Resolved | OverrideRequested`) + notes field.
    - *Charge detail table* — Description / Submitted / Allowed / Adjustment / Status.
    - *Reviewer work panel* (Reviewer mode) — corrected register amount + reason, evidence follow-up note, evidence status select (`AwaitingEvidence | Resolved | NotRequired`), PDF upload, uploaded-evidence list, reviewer notes. **OR** *Manager decision panel* (Manager mode) — rationale textarea.
    - *Audit preview* — last ~10 activity events.
  - **Right (document) column:** document selector, PDF viewer with page navigation and zoom, client-side download button.
- **Footer** — "Save and exit" (Reviewer only), then the mode-appropriate outcome buttons ("Submit review" / "Approve" / "Return to reviewer" / "Reject"), disabled while invalid/read-only/submitting.

Read-only mode (task already completed/viewed by someone else) disables all inputs; guard against double-submit.

## 5. Services

- **Task service wrapper** — get/set task data, complete task, show messages (thin wrapper over `CodedActionAppService`).
- **Document access** — resolve a short-lived read URI for a bucket document, fetch it, expose as an object URL for the PDF viewer/download.
- **Evidence upload** — validation + path construction + checksum + bucket upload (see §3).
- **Data Fabric fallback reads** — used only when task payload arrays are empty (see §2).
- **Pure review-contract rules** (no I/O) — outcome visibility per mode, pre-completion validation, completion-payload construction (see §3). Keep these as pure functions independent of the SDK/service layer so they're unit-testable.

## 6. SDK Initialization

Action Center hosts inject an authenticated session automatically — **do not** perform an explicit OAuth `initialize()` call in this app (unlike the Main App). Construct the `CodedActionAppService` once; lazily construct `Buckets`/`Entities` wrappers over a single shared SDK core instance.
