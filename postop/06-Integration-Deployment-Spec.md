# Integration & Deployment Specification

## 1. Solution Package Layout

Rebuild as a single UiPath Studio Web **Solution** (`.uipx`) containing:

```
HealthcareInvoiceAssurance/
├── Process Invoice/                      (Maestro Flow — .flow + compiled .bpmn)
├── ContractComplianceAgent/              (Low-Code Agent, Agent Builder)
├── Extract Uploaded Document/            (RPA/Coded workflow)
├── InvoiceAssurancePersistence/          (RPA/Coded workflow)
├── Log Activity/                         (RPA/Coded workflow)
├── ProjectCostLookupApi/                 (API workflow)
├── InvoiceAssuranceMainApp/              (Coded Web App)
├── InvoiceAssuranceActionApp/            (Coded Action App)
└── resources/solution_folder/            (Orchestrator folder-scoped resource descriptors)
    ├── Bucket/…-uploadedInvoices, …-contractFiles
    ├── Entity/Native/HLS_InvoiceAssurance_{Main,LineItems,Activity}
    ├── Index/…-contractsIndex
    ├── ixpDeployment/ (Document Understanding project deployment)
    ├── app/CodedAction/invoiceassuranceactionapp
    └── package/ (one descriptor per sub-project above)
```

Each sub-project is packed/published independently as an Orchestrator process/package, then the flow's `bindings_v2.json` binds them by name at solution-deploy time.

## 2. Orchestrator Environment

| Resource | Kind | Notes |
|---|---|---|
| Folder | Standard (or Solution) folder, e.g. `AMER Presales/HLS` | Hosts all processes, entities (folder-scoped), buckets, and Action Center tasks for this solution |
| Storage Bucket — `healthcare-invoice-assurance-uploadedInvoices` | Orchestrator bucket (source tenant id `204617`) | Uploaded invoice/receipt/register PDFs; reviewer-uploaded evidence PDFs (`evidence/{invoiceRecordId}/{correlationId}/…`) |
| Storage Bucket — `healthcare-invoice-assurance-contractFiles` | Orchestrator bucket (source tenant id `204616`) | Governed contract PDF library; ingested by the context-grounding index |
| Context Grounding Index — `healthcare-invoice-assurance-contractsIndex` | ECS index, semantic | Sourced from the contractFiles bucket, PDF only; consumed exclusively by ContractComplianceAgent |
| Data Fabric entities (×3) | Native, folder-scoped | See [01-Data-Model-Spec.md](01-Data-Model-Spec.md) |
| Document Understanding project — "Healthcare Invoice Assurance" | IXP deployment | See [03-Automation-Components-Spec.md](03-Automation-Components-Spec.md) §6 |
| LLM Gateway model access | For the agent's underlying model (GPT-5.4 or current equivalent) | Configure via BYO LLM or platform-default model access per tenant policy |

## 3. Process/Package Dependencies (deploy order)

Deploy leaf dependencies before the flow that binds them:

1. Data Fabric entities (schema must exist before any workflow that reads/writes them)
2. Storage buckets
3. Document Understanding project ("Healthcare Invoice Assurance" extraction model)
4. Context Grounding index (depends on the contractFiles bucket being populated)
5. `Extract Uploaded Document`, `InvoiceAssurancePersistence`, `Log Activity` (RPA/coded workflows)
6. `ProjectCostLookupApi` (API workflow)
7. `ContractComplianceAgent` (Low-Code Agent — depends on the context-grounding index)
8. `InvoiceAssuranceActionApp` (coded Action App — bound directly into the flow's two HITL nodes)
9. `Process Invoice` (Maestro Flow — binds all of the above by process name; resolve folder path for every binding at this step)
10. `InvoiceAssuranceMainApp` (coded Web App — resolves the flow by name to start it, and reads/writes the three entities + buckets directly)

## 4. Configuration to Externalize (do not hardcode, unlike the source solution)

| Value | Where hardcoded in source | Recommended treatment |
|---|---|---|
| Uploaded-invoices bucket id (`204617`) | `normalizePackage` script inside the flow **and** the Action App's evidence-upload service | Resolve by bucket name via binding/config in both places. Numeric bucket ids are tenant-specific and will differ in any new environment — never carry `204616`/`204617` across as literals. |
| Demo account/project/contract-profile ids | `validateSubmission` script (flow) + Main App selectors + `ProjectCostLookupApi` fixture | Move to a lookup/config source; keep the fixture values as **test data**, not production logic |
| Mocked ERP fixtures (supplier, invoice record, profile match) | `ProjectCostLookupApi` inline JS | If a real ERP/cost-register system exists for the target deployment, replace this mock with an actual Integration Service connector call using the same request/response contract documented in [03-Automation-Components-Spec.md](03-Automation-Components-Spec.md) §5 |
| Org/tenant/base URL/client id/folder ids/flow name/bucket names | Main App `uipath.json`/`platform.ts` | Environment-specific build config, not source literals |
| Action Center folder-scope check id | Action App (`HLS_FOLDER_ID`) | Config value |

## 5. Security / Access Considerations

- OAuth scopes required by the Main App (see [04-Main-App-Spec.md](04-Main-App-Spec.md) §2) should be scoped to exactly the Orchestrator/Data Fabric/Task operations the app performs — no broader.
- Action Center tasks rely on the host-injected session; the Action App must never attempt its own OAuth flow.
- Evidence and invoice documents are healthcare/financial-adjacent — apply the tenant's standard data-retention and access-control policy to both storage buckets and to the Data Fabric entities' RBAC settings (`IsRbacEnabled` was `false` in the source entities — evaluate whether row-level security should be enabled for a production deployment, since the source is a demo).
- The `ContractComplianceAgent`'s prompt-injection resistance (ignore "answer key" text embedded in `precedencePolicy`) is a load-bearing security property — preserve the explicit instruction and the corresponding eval case in any prompt rewrite.

## 6. Testing Strategy Carried Over From Source

- **Agent evals** — reproduce the 6 eval cases in [03-Automation-Components-Spec.md](03-Automation-Components-Spec.md) §4 with the two LLM-judge evaluators (output correctness + trajectory/process).
- **Flow-level testing** — no flow-level simulations were authored in the source (`simulations.json` was empty); a rebuild should add Maestro flow simulations/test cases covering: happy path (Approve first pass), required-fields correction path, reviewer readiness loop (multiple review cycles), manager `ReturnToReviewer` loop, and both persistence-failure branches.
- **App-level testing** — the Main App source includes unit tests for `submission.ts`/`live-submission.ts` validation and orchestration logic; carry the same test boundaries forward (pure validation functions, injected-dependency orchestration functions) to keep both coded apps testable without live UiPath API calls.

## 7. Open Items for the Rebuild Team

These are gaps or demo-only shortcuts identified during reverse-engineering that a production rebuild should explicitly decide on rather than silently copy:

1. No retry/backoff anywhere (Overview §5) — decide the target resilience posture for persistence/API/agent calls.
2. `InvoiceAssurancePersistence`'s error code collapses validation and persistence failures into one `"PersistenceError"` — decide whether distinct codes matter to callers.
3. `FindingsJson`/`DocumentReferencesJson` are size-capped `MULTILINE_TEXT` fields with truncating serialization — decide between preserving the compaction logic or moving to a proper child-entity model for findings/documents.
4. LineItems upsert lookup is capped at 100 existing rows per invoice — raise if larger invoices are expected.
5. `ProjectCostLookupApi` is entirely mocked — decide whether the target deployment needs a real ERP/cost-register integration, and if so, treat the documented request/response contract as the integration boundary to preserve.
6. Demo fixtures (account/project/contract-profile/supplier/invoice) are hardcoded in multiple places — centralize as configuration or seed data.
