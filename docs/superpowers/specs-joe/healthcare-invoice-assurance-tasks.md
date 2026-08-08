# Healthcare Invoice Assurance — Implementation Tasks

**Source SDD:** `healthcare-invoice-assurance-solution-sdd.md`
**SDD scope:** solution
**Execution autonomy:** interactive, with execution authorized by the explicit `/goal` invocation
**Delivery model:** cloud
**Generation date:** 2026-08-08

> Tasks below are derived from the SDD. The SDD remains the architectural source of truth.
> Checkpoint evidence and current status are recorded here throughout execution.

## Task T1 — uipath-platform — Verify repository and target environment

**Identity:** `uipath-platform:HealthcareInvoiceAssurance:preflight`
**Status:** [~] in_progress
**Blocked by:** none
**Skill prompt:**

> Verify checkpoint 1 against §2 Deployment Environment and Supporting Platform Resources of `healthcare-invoice-assurance-solution-sdd.md`: repository state, current delegated login, organization `uipathlabs`, tenant `Playground`, folder `AMER Presales/HLS`, prepared buckets/index/IXP identifiers, available CLI behavior, and existing Studio Web solution contents. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [ ] Preserve and inventory all pre-existing repository changes.
- [ ] Record fresh CLI version, capability, login, tenant, and folder evidence.
- [ ] Resolve the prepared resource identifiers and current solution inventory without writes.
- [ ] **Validate:** every discovered target matches the approved SDD; stop on organization, tenant, or folder mismatch.

## Task T2 — pdf — Correct and isolate the fictional source pack

**Identity:** `pdf:HealthcareInvoiceAssurance:source-pack-corrections`
**Status:** [ ] pending
**Blocked by:** T1
**Skill prompt:**

> Apply approved source-pack corrections from §9 of `healthcare-invoice-assurance-solution-sdd.md` and §12 of `2026-08-07-healthcare-invoice-assurance-design.md`. Preserve all fictional notices and existing layout. Prove `04_Demo_Guide` is excluded from runtime, IXP, and index input manifests. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [ ] Add explicit July business-meal pre-approval to the project addendum.
- [ ] Require invoice/register total tie-out and per-subcontractor-line matching to its supporting invoice.
- [ ] Re-render and inspect every changed PDF; extract text to verify the exact clauses.
- [ ] Create a runtime-source manifest containing only Contract Library, Invoice Package, and Receipts/Support inputs.
- [ ] **Validate:** answer-key filenames and oracle text are absent from all runtime-source manifests and configured upload lists.

## Task T3 — uipath-platform — Create folder-scoped Data Fabric entities

**Identity:** `uipath-platform:HealthcareInvoiceAssurance:data-fabric-entities`
**Status:** [ ] pending
**Blocked by:** T1
**Skill prompt:**

> Create and validate the three folder-scoped entities in `AMER Presales/HLS` per §4 Shared Data Definitions of `healthcare-invoice-assurance-solution-sdd.md`. Do not create or bind tenant-scoped or same-named entities elsewhere. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [ ] Reconfirm folder GUID `79d872b0-bee1-4264-a6de-3e780f4e4239` immediately before writes.
- [ ] Create or idempotently reconcile `HLS_InvoiceAssurance_Main`, `HLS_InvoiceAssurance_LineItems`, and `HLS_InvoiceAssurance_Activity` schemas.
- [ ] Record entity IDs, field definitions, scope, and permissions.
- [ ] **Validate:** schema reads from the approved folder match the SDD and no tenant-scoped substitute is bound.

## Task T4 — uipath-ixp — Configure and publish the mixed-package model

**Identity:** `uipath-ixp:HealthcareInvoiceAssurance:model-43a0c85c`
**Status:** [ ] pending
**Blocked by:** T2
**Skill prompt:**

> Configure, evaluate, publish, and expose prepared IXP project `43a0c85c-5d97-80f8-9f1f-2ac01bae3742` per §2 IXP Extraction Readiness and §8 testing requirements of `healthcare-invoice-assurance-solution-sdd.md`. Never upload the Demo Guide. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [ ] Define document types and fields for invoice headers/lines, supporting invoices/receipts, and register totals/lines, confidence, and coordinates.
- [ ] Upload only approved fictional training/evaluation inputs and review predictions.
- [ ] Evaluate required single and repeating fields across all supported document types.
- [ ] Publish the validated model version and make it available to `AMER Presales/HLS`.
- [ ] **Validate:** record project/model version, deployment tag, metrics, and folder availability; prove answer-key exclusion.

## Task T5 — uipath-api-workflow — Build ProjectCostLookupApi

**Identity:** `uipath-api-workflow:ProjectCostLookupApi:workflow`
**Status:** [ ] pending
**Blocked by:** T1
**Skill prompt:**

> Build the deterministic mock API Workflow from §§1–10 of `project-cost-lookup-api-sdd.md`, preserving the exact typed contract and `Found`/`NotFound`/`SearchIncomplete` distinction. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/project-cost-lookup-api-sdd.md`. Do not infer or guess.

- [ ] Author the API Workflow in the approved Studio Web solution using registry-derived activities.
- [ ] Implement generic profile, supplier, invoice-variant, register, and supporting-invoice reconciliation behavior.
- [ ] Keep expected findings and adjustment values out of mock configuration.
- [ ] **Validate:** workflow validation and local/API execution succeed for the documented typed examples.

## Task T6 — uipath-api-workflow — Test ProjectCostLookupApi

**Identity:** `uipath-api-workflow:ProjectCostLookupApi:testing`
**Status:** [ ] pending
**Blocked by:** T5
**Skill prompt:**

> Run the specialist testing workflow for §11 of `project-cost-lookup-api-sdd.md`, including happy, error, generalization, and deterministic parallel cases. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/project-cost-lookup-api-sdd.md`. Do not infer or guess.

- [ ] Execute API-01 through API-05 and API-E1 through API-E4.
- [ ] Record response schemas, logical statuses, variances, latency, and determinism evidence.
- [ ] **Validate:** all tests pass and no expected adjustment oracle appears in workflow configuration.

## Task T7 — uipath-functions — Build FinancialRulesEvaluator

**Identity:** `uipath-functions:FinancialRulesEvaluator:function`
**Status:** [ ] pending
**Blocked by:** T1
**Skill prompt:**

> Build the typed Python Coded Function from §§1–9 of `financial-rules-evaluator-sdd.md` using decimal arithmetic, generic handlers, deterministic traces, and targeted-scope protection. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/financial-rules-evaluator-sdd.md`. Do not infer or guess.

- [ ] Scaffold using current `uip functions` metadata and a uv-managed Python project.
- [ ] Implement every supported generic rule type and typed error path.
- [ ] Keep canonical identifiers, rates, caps, findings, and totals out of runtime source/configuration.
- [ ] **Validate:** local function invocation returns the documented schema and deterministic output.

## Task T8 — uipath-functions — Test FinancialRulesEvaluator

**Identity:** `uipath-functions:FinancialRulesEvaluator:testing`
**Status:** [ ] pending
**Blocked by:** T7
**Skill prompt:**

> Execute the unit, canonical fixture, generalization, targeted-mode, and error-path suite from §10 of `financial-rules-evaluator-sdd.md`. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/financial-rules-evaluator-sdd.md`. Do not infer or guess.

- [ ] Run all rule-handler and invariant tests through uv.
- [ ] Run canonical and post-evidence fixture assertions only from test fixtures.
- [ ] Mutate quantities, rates, dates, and evidence; run a fully compliant invoice.
- [ ] Scan runtime source/configuration for forbidden oracle literals.
- [ ] **Validate:** all tests pass with unchanged unrelated findings during targeted re-evaluation.

## Task T9 — uipath-agents — Build ContractComplianceAgent

**Identity:** `uipath-agents:ContractComplianceAgent:agent`
**Status:** [ ] pending
**Blocked by:** T2, T4
**Skill prompt:**

> Build the low-code autonomous Agent from §§1–9 of `contract-compliance-agent-sdd.md`, using only the approved Context Grounding index and structured input/output. Keep authoritative arithmetic in the Function. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/contract-compliance-agent-sdd.md`. Do not infer or guess.

- [ ] Configure bounded grounded retrieval, effective-date/topic precedence, ambiguity behavior, and audited override handling.
- [ ] Define strict structured outputs for document stack, normalized rules, findings, ambiguities, and schema version.
- [ ] Bind `healthcare-invoice-assurance-contractsIndex` without adding the Demo Guide or oracle content.
- [ ] **Validate:** project validation succeeds and the output contract is accepted by downstream fixtures.

## Task T10 — uipath-agents — Test ContractComplianceAgent

**Identity:** `uipath-agents:ContractComplianceAgent:testing`
**Status:** [ ] pending
**Blocked by:** T9
**Skill prompt:**

> Run the evaluation dataset and regression strategy from §§5 and 10 of `contract-compliance-agent-sdd.md`, including groundedness, precedence, ambiguity, targeted scope, generalization, compliant input, and answer-key injection. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/contract-compliance-agent-sdd.md`. Do not infer or guess.

- [ ] Execute A-01 through A-06 with recorded schema and citation evidence.
- [ ] Run mutated and fully compliant invoice cases.
- [ ] Inspect prompt, context, resources, and index inputs for oracle leakage.
- [ ] **Validate:** schema, citation, unsupported-deduction, targeted-scope, and leakage gates pass.

## Task T11 — uipath-coded-apps — Build and deploy InvoiceAssuranceActionApp

**Identity:** `uipath-coded-apps:InvoiceAssuranceActionApp:action-app`
**Status:** [ ] pending
**Blocked by:** T3
**Skill prompt:**

> Build and independently deploy the reusable Action App from §§1–10 of `invoice-assurance-action-app-sdd.md`, using host-injected task session, Reviewer/Manager modes, Apollo-first UI, and JavaScript PDF rendering. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-action-app-sdd.md`. Do not infer or guess.

- [ ] Implement the exact Reviewer and Manager business contracts against folder-scoped records and the evidence bucket.
- [ ] Implement save/reopen, correction reason, evidence upload, submit, and decision outcomes.
- [ ] Package, publish, and deploy type `Action` before Flow AppTask binding.
- [ ] **Validate:** build and deployed app metadata succeed in `AMER Presales/HLS`.

## Task T12 — uipath-coded-apps — Test InvoiceAssuranceActionApp

**Identity:** `uipath-coded-apps:InvoiceAssuranceActionApp:testing`
**Status:** [ ] pending
**Blocked by:** T11
**Skill prompt:**

> Run §11 of `invoice-assurance-action-app-sdd.md` end-to-end, including task persistence, upload, outcomes, sandboxed document rendering, accessibility, and double-submit protection. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-action-app-sdd.md`. Do not infer or guess.

- [ ] Run AA-01 through AA-06 and component tests.
- [ ] Verify keyboard, focus, contrast, overflow, loading, and responsive behavior.
- [ ] Run `npm test` after all JavaScript/TypeScript changes.
- [ ] **Validate:** tests pass and Action Center host does not initiate standalone OAuth redirects.

## Task T13 — uipath-maestro-flow — Build InvoiceAssuranceFlow

**Identity:** `uipath-maestro-flow:InvoiceAssuranceFlow:flow`
**Status:** [ ] pending
**Blocked by:** T3, T4, T6, T8, T10, T11
**Skill prompt:**

> Build the linear Maestro Flow from §§1–9 of `invoice-assurance-flow-sdd.md`, binding only published resources and the three approved folder-scoped entities. Implement Reviewer evidence/correction, targeted re-evaluation, Manager outcomes, retry/error paths, and append-only activity. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-flow-sdd.md`. Do not infer or guess.

- [ ] Author and connect the complete node inventory and reusable subflows.
- [ ] Bind published IXP, API Workflow, Function, Agent, Action App, buckets, index, and folder-scoped Data Fabric entities.
- [ ] Implement unassigned claimable Reviewer and Manager AppTasks and exact loop behavior.
- [ ] **Validate:** Flow validates with all resources resolved and no Case Management stages.

## Task T14 — uipath-maestro-flow — Test InvoiceAssuranceFlow

**Identity:** `uipath-maestro-flow:InvoiceAssuranceFlow:testing`
**Status:** [ ] pending
**Blocked by:** T13
**Skill prompt:**

> Run §10 of `invoice-assurance-flow-sdd.md` end-to-end, including happy path, duplicate, low confidence, ambiguity, schema failure, insufficient evidence, Manager return, refresh recovery, and targeted lineage. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-flow-sdd.md`. Do not infer or guess.

- [ ] Execute canonical and every documented error path.
- [ ] Verify status/totals/history across Reviewer and Manager loops.
- [ ] Record run IDs, traces, task IDs, activity records, and validation evidence.
- [ ] **Validate:** all Flow evaluations pass and retry/error events are auditable.

## Task T15 — uipath-coded-apps — Build and deploy InvoiceAssuranceMainApp

**Identity:** `uipath-coded-apps:InvoiceAssuranceMainApp:web-app`
**Status:** [ ] pending
**Blocked by:** T3, T13
**Skill prompt:**

> Build and independently deploy the Main Coded Web App from §§1–11 of `invoice-assurance-main-app-sdd.md`, applying Apollo first and `uipath-brand-ui-jmr` second. Use delegated PKCE, folder-scoped data, stable process polling, exact task correlation, and embedded Action Center. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-main-app-sdd.md`. Do not infer or guess.

- [ ] Implement portfolio empty/live states, New Analysis, progress, workspace, contract library, and theme toggle.
- [ ] Implement package upload, fingerprinting, selectors, Flow start, stable state polling, and process-correlated task embedding.
- [ ] Configure exact approved OAuth client, scopes, redirects, route base, and deployed URL.
- [ ] Package, publish, and deploy to `https://uipathlabs.uipath.host/healthcare-invoice-assurance`.
- [ ] **Validate:** production build and deployed reachability/authentication succeed.

## Task T16 — uipath-coded-apps — Test InvoiceAssuranceMainApp

**Identity:** `uipath-coded-apps:InvoiceAssuranceMainApp:testing`
**Status:** [ ] pending
**Blocked by:** T15
**Skill prompt:**

> Run §12 of `invoice-assurance-main-app-sdd.md`, including unit, live integration, accessibility, responsive, refresh/recovery, and same-pane Reviewer/Manager task flows. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-main-app-sdd.md`. Do not infer or guess.

- [ ] Run W-01 through W-05 and component tests.
- [ ] Verify exact task correlation, embed URL construction, and stable partial-poll accumulation.
- [ ] Run keyboard, focus, contrast, theme, overflow, loading, error, and responsive checks.
- [ ] Run `npm test` after all JavaScript/TypeScript changes.
- [ ] **Validate:** local and deployed tests pass with no decorative primary actions.

## Task T17 — uipath-solution — Package, publish, deploy, activate, and bind solution

**Identity:** `uipath-solution:HealthcareInvoiceAssurance:deployment`
**Status:** [ ] pending
**Blocked by:** T12, T14, T16
**Skill prompt:**

> Package, publish, deploy, activate, and verify the `.uipx` solution boundary from §§2–3 and 10–12 of `healthcare-invoice-assurance-solution-sdd.md`. Preserve independent Coded App deployments and resolve exact approved folder resources. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [ ] Refresh and validate all solution project/resource bindings.
- [ ] Pack, publish, deploy, and activate an intentional version to `AMER Presales/HLS`.
- [ ] Verify Flow, Agent, Function, API Workflow, IXP, apps, buckets, index, and Data Fabric binding identities.
- [ ] **Validate:** deployment/activation succeeds with no unresolved or cross-scope resources.

## Task T18 — uipath-review — Verify end-to-end acceptance and handoff

**Identity:** `uipath-review:HealthcareInvoiceAssurance:end-to-end-handoff`
**Status:** [ ] pending
**Blocked by:** T17
**Skill prompt:**

> Independently verify §8 Evaluation and Testing Strategy and the implementation-goal completion condition. Remediate confirmed defects through the owning specialist, repeat affected checks, then produce the deployment inventory, evidence-backed handoff, limitations, and deterministic reset procedure. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [ ] Run component, schema, contract, accessibility, integration, adversarial, compliant-invoice, and full Reviewer/Manager E2E checks.
- [ ] Confirm results change with supported input changes and no runtime oracle leakage exists.
- [ ] Confirm deployed Main App reachability and the complete under-ten-minute demo path.
- [ ] Record deployed identifiers, versions, URLs, evidence, known limitations, and reset commands.
- [ ] **Validate:** every documented completion condition has fresh evidence or an explicit blocking record.
