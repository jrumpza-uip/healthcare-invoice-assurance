# Data Fabric Data Model Specification

Folder scope: all three entities are **folder-scoped** to Orchestrator folder `AMER Presales/HLS` (`FolderId`/folder key `79d872b0-bee1-4264-a6de-3e780f4e4239`, numeric folder id `2036001`). Rebuild these as native (non-federated) entities in that same folder scope.

None of the three entities declare `RELATIONSHIP` fields to each other — cross-entity linkage is by **plain string ID fields** (`InvoiceRecordId`) queried with `contains`/`=` filters, not native Data Fabric relationships. Preserve this pattern unless there is a specific reason to move to native relationships (would require `referenceEntityId`/`referenceFieldId` wiring and changes to the RPA persistence workflow's query logic).

All three entities also carry the standard Data Fabric system fields (`Id` UUID PK, `CreateTime`, `UpdateTime`, `CreatedBy`, `UpdatedBy`, `RecordOwner` — all system-managed relationships to `SystemUser`); these are omitted from the tables below since they're automatic.

---

## 1. `HLS_InvoiceAssurance_Main`

**Display name:** Healthcare Invoice Assurance Main
**Description:** Current header, workflow state, and financial snapshot for one invoice-assurance package.
**Reference ID (source tenant):** `d0fed526-9d93-f111-9b32-000d3ab5d4c4`

One row per invoice submission — the aggregate/header record the rest of the solution revolves around.

> **Type notation:** the `Type` column gives the exact `EntityFieldDataType` enum plus the literal constraint keys the Data Fabric API expects (`lengthLimit`, `minValue`, `maxValue`, `decimalPrecision`). Pass these keys verbatim to `entities create` / `addFields` — there is no SQL-style `DECIMAL(p,s)` form in this API.

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `CorrelationId` | `STRING` lengthLimit 100 | Yes | — | Cross-component trace ID, generated client-side (crypto UUID) at submission. |
| `ProcessInstanceId` | `STRING` lengthLimit 100 | No | — | Set after the Maestro process starts; used by the Main App to correlate Action Center tasks (`CreatorJobKey`). |
| `InvoiceNumber` | `STRING` lengthLimit 100 | Yes | — | Placeholder (`"Pending extraction · <correlationId>"`) at submission time; overwritten once extraction completes. |
| `SupplierName` | `STRING` lengthLimit 200 | Yes | — | Same placeholder pattern as above. |
| `InvoiceDate` | `DATE` lengthLimit 1000 | Yes | — | |
| `AccountId` | `STRING` lengthLimit 100 | Yes | — | Demo fixture: `account-lakeshore-regional-health-system`. |
| `ProjectId` | `STRING` lengthLimit 100 | Yes | — | Demo fixture: `project-west-pavilion-renovation`. |
| `ContractProfileId` | `STRING` lengthLimit 100 | Yes | — | Selects the governed contract family for the compliance agent. Demo fixture: `profile-west-pavilion`. |
| `ProcessingStatus` | `STRING` lengthLimit 80 | Yes | — | Persisted lifecycle enum — see Overview §4 and the note below: `Submitted, Processing, AwaitingEvidence, ReviewerPending, ManagerPending, Approved, Rejected`. |
| `SubmittedTotal` | `DECIMAL` min 0, max 1e12, precision 2 | Yes | — | Sum of submitted invoice charges. |
| `AdjustmentTotal` | `DECIMAL` min 0, max 1e12, precision 2 | Yes | `0` | Total deduction across findings. |
| `PayableTotal` | `DECIMAL` min 0, max 1e12, precision 2 | Yes | `0` | `SubmittedTotal − AdjustmentTotal` (computed upstream, stored as a value). |
| `OpenFindingCount` | `DECIMAL` min 0, max 1e12, precision 0 | Yes | `0` | Count of unresolved findings. |
| `AwaitingEvidence` | `BOOLEAN` | Yes | `false` | True when at least one finding needs reviewer-supplied evidence. |
| `FindingsJson` | `MULTILINE_TEXT` lengthLimit 10000 | No | — | JSON array of enriched findings (severity, category, title, explanation, financial effect, confidence, evidence state, contract citation). **Three-tier truncating serializer** applied at write time to respect the 10,000-char cap — see §"FindingsJson compaction" below. |
| `DocumentReferencesJson` | `MULTILINE_TEXT` lengthLimit 10000 | Yes | — | JSON array of `{path, type, name, checksum}` for every uploaded document. |
| `FinalSummary` | `MULTILINE_TEXT` lengthLimit 10000 | No | — | Free-text closing summary of the assurance outcome. Added late in the source solution's life (after the other fields) and **not written by any component inspected in this reverse-engineering pass** — the flow, both RPA workflows, and both coded apps never reference it. Treat as either a reserved/future field or dead schema; confirm intent before carrying it into a rebuild. |
| `AnalysisVersion` | `DECIMAL` min 1, max 1e12, precision 0 | Yes | `1` | Increments each reviewer re-evaluation cycle. |

### `ManagerPending` vs `ManagerReview` — do not conflate

Two similar-looking status strings exist in the source and mean different things:

- **`ManagerPending`** is the value actually **persisted** to this field when the readiness gate opens (`processingStatus = readiness ? "ManagerPending" : …`). It is what the Main App's status badge maps. This is the real lifecycle state.
- **`ManagerReview`** is a **display-only literal** hardcoded onto the manager HITL node's task payload, shown in the Action App header. It is never written to Data Fabric.

A rebuild should keep the persisted enum to the seven values listed above, and treat the Action App's header label as presentation.

### FindingsJson compaction (behavior to replicate)

The flow serializes findings into `FindingsJson` using three fallback tiers to stay under the 10,000-character `MULTILINE_TEXT` limit:
1. Full enriched finding objects (severity, category, title, explanation, financial effect, confidence, evidence state, contract citation fields).
2. If tier 1 exceeds the cap, a more compact shape (drop verbose explanation/citation text, keep IDs/status/amounts).
3. If still over the cap, a placeholder/truncated summary (count + high-level status only).

A rebuild should either replicate this three-tier compaction or, preferably, move findings to a proper one-row-per-finding child entity to remove the size constraint entirely — flag this as a recommended improvement, not a required parity item.

---

## 2. `HLS_InvoiceAssurance_LineItems`

**Display name:** Healthcare Invoice Assurance Line Items
**Description:** Current extracted, reconciled, and evaluated charge-line view for invoice-assurance packages.
**Reference ID (source tenant):** `ecfed526-9d93-f111-9b32-000d3ab5d4c4`

One row per canonical charge line. Related to Main via the plain string field `InvoiceRecordId` (queried `contains`/`=`, not a native relationship). Upsert key from the persistence workflow is **`ExternalRecordId`**, not the Data Fabric `Id` — `ExternalRecordId` must be unique per invoice (validated pre-write; duplicates throw).

| Field | Type | Required | Notes |
|---|---|---|---|
| `InvoiceRecordId` | `STRING` lengthLimit 36 | Yes | FK-by-convention to `HLS_InvoiceAssurance_Main.Id`. |
| `SourceDocumentId` | `STRING` lengthLimit 200 | Yes | Identifies which uploaded document this line came from. |
| `SourceDocumentType` | `STRING` lengthLimit 80 | Yes | `Primary Invoice \| Supporting Invoice \| Receipt \| Cost Register \| Unknown` (from IXP document classification). |
| `Description` | `STRING` lengthLimit 1000 | Yes | |
| `Category` | `STRING` lengthLimit 100 | Yes | Charge category (e.g. labor, materials, equipment, PPE) — drives which contract rule types apply. |
| `Quantity` | `DECIMAL` min 0, max 1e12, precision 4 | No | |
| `Unit` | `STRING` lengthLimit 40 | No | |
| `SubmittedRate` | `DECIMAL` min 0, max 1e12, precision 4 | No | |
| `SubmittedAmount` | `DECIMAL` min 0, max 1e12, precision 2 | Yes | |
| `IxpConfidence` | `DECIMAL` min 0, **max 1**, precision 4 | No | Document Understanding extraction confidence — note the max of 1, unlike every other decimal field. |
| `SourceCoordinatesJson` | `MULTILINE_TEXT` lengthLimit 10000 | No | Bounding-box/location metadata from IXP, for click-to-source UI. |
| `ExternalRecordId` | `STRING` lengthLimit 200 | No | Upsert key (see above); also the join key to the mocked cost-register/ERP lookup result. |
| `ExternalMatchStatus` | `STRING` lengthLimit 80 | No | Result of matching against `ProjectCostLookupApi`'s register/supporting-invoice comparison (`Matched`, `Variance`, `MissingSupportingInvoice`, `InvalidSupportingAmount`, `NoRegister`, etc.). |
| `ExternalAmount` | `DECIMAL` min 0, max 1e12, precision 2 | No | Amount from the external register/ERP record, if matched. |
| `Variance` | `DECIMAL` **min −1e12**, max 1e12, precision 2 | No | The only signed field in the model — `SubmittedAmount − ExternalAmount`. A rebuild that copies the `min 0` used elsewhere will reject negative variances. |
| `AllowedAmount` | `DECIMAL` min 0, max 1e12, precision 2 | No | Deterministic rule-engine output — the maximum contractually allowed amount. |
| `Adjustment` | `DECIMAL` min 0, max 1e12, precision 2 | No | `SubmittedAmount − AllowedAmount` (deduction). |
| `EvaluationStatus` | `STRING` lengthLimit 80 | Yes | Default `Pending`. Observed values: `NeedsReview, Adjusted, Allowed`, plus rule-specific statuses `excluded, rateCapped, pendingEvidence, reconciliationRecorded`. |
| `AnalysisVersion` | `DECIMAL` min 1, max 1e12, precision 0 | Yes | Default `1`; mirrors the parent Main record's version at time of write. |

---

## 3. `HLS_InvoiceAssurance_Activity`

**Display name:** Healthcare Invoice Assurance Activity
**Description:** Append-only timeline of automation and human events for invoice-assurance packages.
**Reference ID (source tenant):** `c5d31b2f-9d93-f111-9b32-000d3ab5d4c4`

One row per event. Append-only — no update/delete path exists in either the flow or either RPA workflow.

| Field | Type | Required | Notes |
|---|---|---|---|
| `InvoiceRecordId` | `STRING` lengthLimit 36 | Yes | FK-by-convention to Main. |
| `CorrelationId` | `STRING` lengthLimit 100 | Yes | |
| `EventTimestamp` | `DATETIME_WITH_TZ` lengthLimit 1000 | Yes | Server-assigned (`DateTime.Now`) in the "Log Activity" workflow; explicitly passed through in the persistence workflow's activity-append step. |
| `EventName` | `STRING` lengthLimit 80 | Yes | Short label, e.g. "Documents extracted". |
| `EventType` | `STRING` lengthLimit 80 | Yes | Machine-readable event key, e.g. `DocumentExtraction, AnalysisVersionCreated, ManagerReturn, FinalDisposition`. |
| `EventSource` | `STRING` lengthLimit 200 | Yes | Which component emitted the event (flow node name or process name). |
| `Summary` | `STRING` lengthLimit 1000 | Yes | Human-readable one-line summary. |
| `PayloadJson` | `MULTILINE_TEXT` lengthLimit 10000 | No | Optional structured detail; validated ≤10,000 chars before write (throws if exceeded — no compaction here, unlike `FindingsJson`). |

### Observed `EventType` values (for rebuild parity)
`DocumentExtraction`, `AnalysisVersionCreated`, `ManagerReturn`, `FinalDisposition` — plus whatever additional event types are added at each `logActivityN` call site in the Maestro flow (see [02-Maestro-Flow-Spec.md](02-Maestro-Flow-Spec.md) §2 for exact call sites).

---

## 4. Access Patterns Summary (for indexing/perf decisions in a rebuild)

| Consumer | Entity | Pattern |
|---|---|---|
| Main App — Portfolio page | Main | List all records, folder-scoped, client-side aggregation for metric cards. |
| Main App — New Analysis | Main | Single insert (placeholder row), then update with `ProcessInstanceId`. |
| Main App — Invoice Workspace | Main, LineItems, Activity | Get Main by `Id`; query LineItems/Activity filtered `InvoiceRecordId = :id`; polled every 5s. |
| Action App | Main, LineItems, Activity | Fallback-only reads (primary payload comes from the task input); same filter pattern as above. |
| InvoiceAssurancePersistence (RPA) | Main, LineItems, Activity | Get Main by `Id` → partial update; query LineItems by `InvoiceRecordId contains :id` (Top 100) → per-row upsert by `ExternalRecordId`; create one Activity row. |
| Log Activity (RPA) | Activity | Single create, no read. |

No entity currently needs more than ~100 LineItems rows per invoice in the demo dataset (the persistence workflow hardcodes a Top-100 page for the existing-lines lookup) — flag as a scale limit if invoices can exceed 100 lines in production use.
