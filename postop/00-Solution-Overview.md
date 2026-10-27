# Healthcare Invoice Assurance — Solution Design Document (Overview)

**Reverse-engineered from a running UiPath Automation Cloud solution.** This document, together with the five companion specs in this folder, is intended to be sufficient for rebuilding the solution from a blank tenant with no access to the original artifacts.

> Reverse-engineering source: `HealthcareInvoiceAssurance (6).uis` Studio Web solution package, three live Data Fabric entities (`d0fed526-…`, `ecfed526-…`, `c5d31b2f-…`), and the `InvoiceAssuranceMainApp` / `InvoiceAssuranceActionApp` coded-app source trees. Existing design docs elsewhere in the repository were deliberately ignored.

### Confidence / provenance

| Claim class | Basis | Confidence |
|---|---|---|
| Entity schemas — field names, types, constraints, defaults | Live `uip df entities get` against all three entities, re-verified field-by-field | High |
| Bucket names ↔ numeric ids | Live `uip or buckets list` in the target folder | High |
| Persisted `ProcessingStatus` vocabulary | Extracted from the flow's script bodies + the Main App's badge map, cross-checked | High |
| Workflow logic (extraction, persistence, logging) | Direct reads of `Main.xaml`; bucket name, IXP model name, `Top=100` cap, error-code behavior, and `DateTime.Now` timestamp each independently re-verified | High |
| Maestro flow node graph, HITL contracts, bindings | Read of `.flow`/`.bpmn`/`bindings_v2.json`; parallel-loop flag re-verified | High |
| Agent prompt, schemas, tools, evals | Direct read of `agent.json` + eval set/evaluators | High |
| `ProjectCostLookupApi` logic and fixtures | Direct read of `Workflow.json` | High |
| Coded-app behavior and constants | Source-tree reads; folder/bucket/limit constants re-verified against source | High |
| Document Understanding (IXP) project internals | **Inferred from consumer usage only** — the extraction project itself was not available for inspection | **Medium — validate before building** |

## 1. Purpose

A demo/presales solution (org `uipathlabs`, tenant `Playground`, Orchestrator folder **`AMER Presales/HLS`**) for **Healthcare & Life Sciences**: it ingests uploaded construction/vendor invoices tied to a healthcare capital project, extracts and normalizes charge-line data with Document Understanding (IXP), reconciles against a mocked project/cost-register system, evaluates the invoice against a governed contract stack using a grounded RAG agent, and routes the result through a two-stage human review (Reviewer → Manager) before final disposition (Approved/Rejected). All state is persisted to three Data Fabric entities and surfaced through a coded web app (portfolio + workspace) and a coded Action Center app (review/approval task UI).

## 2. Component Inventory

| # | Component | Type | Role |
|---|---|---|---|
| 1 | **Process Invoice** | Maestro Flow (`.flow`/`.bpmn`) | End-to-end orchestrator — the spine of the solution. See [02-Maestro-Flow-Spec.md](02-Maestro-Flow-Spec.md). |
| 2 | **Extract Uploaded Document** | RPA/Coded workflow | Downloads one uploaded file from a bucket, runs IXP extraction, returns structured JSON. See [03-Automation-Components-Spec.md](03-Automation-Components-Spec.md). |
| 3 | **InvoiceAssurancePersistence** | RPA/Coded workflow | Validates and writes a batch of Data Fabric changes (Main update + LineItems upsert + Activity append) transactionally. |
| 4 | **Log Activity** | RPA/Coded workflow | Appends one audit/timeline record to the Activity entity. |
| 5 | **ProjectCostLookupApi** | API Workflow | Mocked ERP/cost-register lookup — validates the invoice against a hardcoded project/supplier/invoice-register fixture set. |
| 6 | **ContractComplianceAgent** | Low-Code Agent (Agent Builder, GPT-5.4) | Grounded RAG analyst — retrieves contract clauses from a context-grounding index and proposes exception-only compliance findings. |
| 7 | **healthcare-invoice-assurance-contractsIndex** | Context Grounding Index | Semantic index over PDF contract documents in the `contractFiles` bucket; the agent's only tool. |
| 8 | **healthcare-invoice-assurance-uploadedInvoices** | Storage Bucket (source tenant id `204617`) | Holds uploaded invoice/receipt/register PDFs and reviewer-uploaded evidence PDFs. |
| 9 | **healthcare-invoice-assurance-contractFiles** | Storage Bucket (source tenant id `204616`) | Holds the governed contract PDF library; source for the context-grounding index. |
| 10 | **HLS_InvoiceAssurance_Main** | Data Fabric entity | One row per invoice package — header, workflow state, financial snapshot. |
| 11 | **HLS_InvoiceAssurance_LineItems** | Data Fabric entity | One row per canonical charge line, current reconciled/evaluated view. |
| 12 | **HLS_InvoiceAssurance_Activity** | Data Fabric entity | Append-only audit timeline. |
| 13 | **InvoiceAssuranceMainApp** | Coded Web App (React/TS) | Human front door — portfolio dashboard, new-analysis intake, invoice workspace, contract library. See [04-Main-App-Spec.md](04-Main-App-Spec.md). |
| 14 | **InvoiceAssuranceActionApp** | Coded Action App (React/TS) | Renders the Reviewer and Manager Action Center task forms invoked by the Maestro flow's HITL nodes. See [05-Action-App-Spec.md](05-Action-App-Spec.md). |

See [01-Data-Model-Spec.md](01-Data-Model-Spec.md) for full entity schemas and [06-Integration-Deployment-Spec.md](06-Integration-Deployment-Spec.md) for environment/config/deployment topology.

## 3. High-Level Architecture

```
User (Main App) ──upload + submit──▶ HLS_InvoiceAssurance_Main (placeholder row)
                                            │
                                            ▼
                              Process Invoice (Maestro Flow) ◀── started with
                                            │                    invoiceRecordId, correlationId,
                                            │                    contractProfileId, sourceDocumentIds,
                                            │                    forceManagerReview
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
 Extract Uploaded Document         ProjectCostLookupApi              ContractComplianceAgent
 (per document, parallel)          (mocked ERP/register lookup)      (RAG over contractsIndex)
        │                                   │                                   │
        └──────────────┬────────────────────┴───────────────────┬───────────────┘
                        ▼                                        ▼
              normalizePackage (script)              evaluateFinancialFindings (script,
              canonical invoice package               deterministic rules engine)
                        │                                        │
                        └───────────────┬────────────────────────┘
                                         ▼
                          buildInitialReviewPackage (script)
                                         │
                                         ▼
                       InvoiceAssurancePersistence (Main + LineItems + Activity)
                                         │
                                         ▼
                    reviewInvoiceAssuranceFindings (HITL: Action App, Reviewer mode)
                                         │  (ContractComplianceAgent re-invoked with
                                         │   humanOverride / changedFindingIds)
                                         ▼
                         persist reviewer re-evaluation → readiness gate
                                         │
                                         ▼
                          managerReview (HITL: Action App, Manager mode)
                                         │
                         ┌───────────────┼────────────────┐
                         ▼               ▼                ▼
                     Approve      ReturnToReviewer     Reject
                         │               │                │
                         └───────┬───────┘                │
                                 ▼                         ▼
                    persistFinalDisposition (Approved/Rejected) — flow ends
```

Every box that writes state ultimately calls **InvoiceAssurancePersistence**; every material step calls **Log Activity** to append to the audit timeline. The Main App polls `HLS_InvoiceAssurance_Main.ProcessingStatus` and the Maestro process's global variables every 5 seconds to reflect live progress; it also detects and embeds the live Action Center task (via `CreatorJobKey`) directly inside the workspace page.

## 4. Processing Status Lifecycle

Persisted values of `HLS_InvoiceAssurance_Main.ProcessingStatus` (written by the flow, rendered by the Main App's status badge):

`Submitted` → `Processing` → (`AwaitingEvidence` | `ReviewerPending`) → `ManagerPending` → `Approved` | `Rejected`

`ReturnToReviewer` (manager action) resets status back to `ReviewerPending` and loops the flow back into the reviewer task with `priorManagerRationale` populated.

> **`ManagerPending` vs `ManagerReview`:** `ManagerPending` is the persisted state (set when the readiness gate opens). `ManagerReview` is a display-only literal hardcoded onto the manager HITL task payload and shown in the Action App header — it is never written to Data Fabric. Keep the two distinct in a rebuild; see [01-Data-Model-Spec.md](01-Data-Model-Spec.md) §1.

## 5. Key Design Characteristics to Preserve

- **Exception-only agent output.** The compliance agent never confirms compliance — it only emits findings for actual exceptions, and defers all monetary arithmetic to a deterministic downstream script. This separation (LLM proposes qualitative findings + cites rule parameters; deterministic code computes dollars) is a core design decision, not an implementation detail — preserve it in a rebuild rather than asking the LLM to also compute totals.
- **Fail-fast, no retries.** Every persistence/API/agent call is followed by a single success/failure decision; failure throws and ends the run. The only "retry-like" paths are human escalation loops (reviewer ⇄ manager). A rebuild should deliberately decide whether to add technical retry/backoff, since the original does not.
- **Two hardcoded demo fixtures drive the "happy path":** account `account-lakeshore-regional-health-system` / project `project-west-pavilion-renovation` / contract profile `profile-west-pavilion` (matched by `ProjectCostLookupApi`), and supplier `Northbridge General Contractors` with invoice `NBG-0726-01` (total `63024.90`). These are literal string constants in `normalizePackage` (flow) and in the API-workflow JS — externalize them as configuration in a rebuild if multi-tenant/multi-project support is desired.
- **JSON blobs sized against Data Fabric limits.** `FindingsJson`/`DocumentReferencesJson`/`PayloadJson` are `MULTILINE_TEXT` fields capped at 10,000 characters; the flow implements a three-tier truncating serializer for findings. A rebuild should either preserve this guard or move to a genuinely unbounded storage shape (e.g., one row per finding).
- **Two coded apps share one data contract.** The Action App's `ActionFormData` shape and the Maestro flow's `currentReviewPackage` shape must stay in lockstep — they are the same object serialized across the HITL boundary.
