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
**Status:** [x] completed
**Blocked by:** none
**Skill prompt:**

> Verify checkpoint 1 against §2 Deployment Environment and Supporting Platform Resources of `healthcare-invoice-assurance-solution-sdd.md`: repository state, current delegated login, organization `uipathlabs`, tenant `Playground`, folder `AMER Presales/HLS`, prepared buckets/index/IXP identifiers, available CLI behavior, and existing Studio Web solution contents. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [x] Preserve and inventory all pre-existing repository changes.
- [x] Record fresh CLI version, capability, login, tenant, and folder evidence.
- [x] Resolve the prepared resource identifiers and current solution inventory without writes.
- [x] **Validate:** every discovered target matches the approved SDD; stop on organization, tenant, or folder mismatch.

**Evidence (2026-08-08):** `uip` 1.198.0 authenticated to `uipathlabs / Playground`; folder key `79d872b0-bee1-4264-a6de-3e780f4e4239` resolved to `AMER Presales/HLS`. Contract bucket `6dfc0608-733a-4465-9811-59e87d5095cb`, upload bucket `11c5ae0b-2ef6-495a-b6b7-d79e7e6f7633`, index `5eaf632f-2960-4ea7-82eb-08def3f771f8`, and IXP project `43a0c85c-5d97-80f8-9f1f-2ac01bae3742` match the SDD. CLI package/deployment/resource-catalog reads found no existing Healthcare Invoice Assurance solution contents to replace. Studio Web browser inspection reached the Microsoft sign-in boundary, so the authenticated CLI inventory is the authoritative preflight evidence.

## Task T2 — pdf — Correct and isolate the fictional source pack

**Identity:** `pdf:HealthcareInvoiceAssurance:source-pack-corrections`
**Status:** [x] completed
**Blocked by:** T1
**Skill prompt:**

> Apply approved source-pack corrections from §9 of `healthcare-invoice-assurance-solution-sdd.md` and §12 of `2026-08-07-healthcare-invoice-assurance-design.md`. Preserve all fictional notices and existing layout. Prove `04_Demo_Guide` is excluded from runtime, IXP, and index input manifests. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [x] Add explicit July business-meal pre-approval to the project addendum.
- [x] Require invoice/register total tie-out and per-subcontractor-line matching to its supporting invoice.
- [x] Re-render and inspect every changed PDF; extract text to verify the exact clauses.
- [x] Create a runtime-source manifest containing only Contract Library, Invoice Package, and Receipts/Support inputs.
- [x] **Validate:** answer-key filenames and oracle text are absent from all runtime-source manifests and configured upload lists.

**Evidence (2026-08-08):** three source-pack contract tests pass. Both corrected one-page PDFs were rendered and visually inspected without clipping or overlap, uploaded at their existing bucket paths, downloaded again, and matched local SHA-256 values (`155d7164…` and `94768500…`). The contract bucket contains exactly seven PDFs and excludes `04_Demo_Guide`. Re-ingestion completed successfully at `2026-08-08T21:37:15Z`; semantic search returned the meal preapproval and subcontractor line-matching clauses, while a thresholded Demo Guide/expected-findings query returned zero results.

## Task T3 — uipath-platform — Create folder-scoped Data Fabric entities

**Identity:** `uipath-platform:HealthcareInvoiceAssurance:data-fabric-entities`
**Status:** [x] complete
**Blocked by:** T1
**Skill prompt:**

> Create and validate the three folder-scoped entities in `AMER Presales/HLS` per §4 Shared Data Definitions of `healthcare-invoice-assurance-solution-sdd.md`. Do not create or bind tenant-scoped or same-named entities elsewhere. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [x] Reconfirm folder GUID `79d872b0-bee1-4264-a6de-3e780f4e4239` immediately before writes.
- [x] Create or idempotently reconcile `HLS_InvoiceAssurance_Main`, `HLS_InvoiceAssurance_LineItems`, and `HLS_InvoiceAssurance_Activity` schemas.
- [x] Record entity IDs, field definitions, scope, and permissions.
- [x] **Validate:** schema reads from the approved folder match the SDD and no tenant-scoped substitute is bound.

**Evidence (2026-08-08):** after the user freed entity capacity, a fresh folder-scoped list returned empty and all three approved creates succeeded: Main `d0fed526-9d93-f111-9b32-000d3ab5d4c4`, LineItems `ecfed526-9d93-f111-9b32-000d3ab5d4c4`, Activity `c5d31b2f-9d93-f111-9b32-000d3ab5d4c4`. Fresh ID-based schema reads confirmed folder `79d872b0-bee1-4264-a6de-3e780f4e4239`, every approved user field, required flag, type, precision/default, and length. `FindingsJson`, `DocumentReferencesJson`, `SourceCoordinatesJson`, and `PayloadJson` are `MULTILINE_TEXT` at 10,000 characters. A fresh cross-folder name query returned only these three folder-scoped entities, proving no tenant-scoped or same-named substitute is bound.

## Task T4 — uipath-ixp — Configure and publish the mixed-package model

**Identity:** `uipath-ixp:HealthcareInvoiceAssurance:model-43a0c85c`
**Status:** [x] complete
**Blocked by:** T2
**Skill prompt:**

> Configure, evaluate, publish, and expose prepared IXP project `43a0c85c-5d97-80f8-9f1f-2ac01bae3742` per §2 IXP Extraction Readiness and §8 testing requirements of `healthcare-invoice-assurance-solution-sdd.md`. Never upload the Demo Guide. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [x] Define document types and fields for invoice headers/lines, supporting invoices/receipts, and register totals/lines, confidence, and coordinates.
- [x] Upload only approved fictional training/evaluation inputs and review predictions.
- [x] Evaluate required single and repeating fields across all supported document types.
- [x] Publish the validated model version and make it available to `AMER Presales/HLS` — version 25 is published and tagged `live`; user-supplied Orchestrator evidence shows the deployed model in the approved folder.
- [x] **Validate:** record project/model version, deployment tag, metrics, and folder availability; prove answer-key exclusion.

**Evidence (2026-08-08):** prepared project `healthcare-invoice-assurance-51392a38-ixp` resolves to ID `43a0c85c-5d97-80f8-9f1f-2ac01bae3742`. The configured taxonomy contains seven field groups and 50 fields covering document classification, invoice headers/lines, receipt headers/lines, and cost-register headers/lines. Exactly eight approved fictional documents were uploaded and visually reviewed; `04_Demo_Guide` is absent. Fresh post-publication evidence shows pinned model version `25`, `live` tag updated at `2026-08-08T22:18:12.438069+00:00`, eight validated documents, project F1 `0.99`, minimum field-group F1 `0.957`, and minimum individual-field F1 `0.813`. User-supplied Orchestrator screenshot evidence was visually inspected and shows `Healthcare Invoice Assurance` in the IXP Models tab while `AMER Presales/HLS` is selected, completing the folder-availability checkpoint.

## Task T5 — uipath-api-workflow — Build ProjectCostLookupApi

**Identity:** `uipath-api-workflow:ProjectCostLookupApi:workflow`
**Status:** [x] complete
**Blocked by:** T1
**Skill prompt:**

> Build the deterministic mock API Workflow from §§1–10 of `project-cost-lookup-api-sdd.md`, preserving the exact typed contract and `Found`/`NotFound`/`SearchIncomplete` distinction. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/project-cost-lookup-api-sdd.md`. Do not infer or guess.

- [x] Author the API Workflow in the approved Studio Web solution using registry-derived activities.
- [x] Implement generic profile, supplier, invoice-variant, register, and supporting-invoice reconciliation behavior.
- [x] Keep expected findings and adjustment values out of mock configuration.
- [x] **Validate:** workflow validation and local/API execution succeed for the documented typed examples.

**Evidence (2026-08-08):** created local solution `HealthcareInvoiceAssurance` and scaffolded `ProjectCostLookupApi` with the required Studio Web-editable `project.uiproj`, `Workflow.json`, `entry-points.json`, and empty `bindings_v2.json`. The scaffold auto-registered as project ID `87f9ef68-824e-425d-b057-50c228f7a1ec` in `HealthcareInvoiceAssurance.uipx`. Approved primary mock identifiers are `profile-west-pavilion`, `account-lakeshore-regional-health-system`, and `project-west-pavilion-renovation`; the user also approved optional boolean `simulateSearchUnavailable` defaulting to `false`. A failing red run proved all 10 tests detected the missing evaluator. After implementation, fresh `npm test` evidence passed API-01 through API-05, API-E1 through API-E4, and deterministic repeat execution (10/10). Following explicit user consent, the real local API Workflow executor ran the full nine-case matrix plus deterministic repeat under `--no-auth`; every assertion passed in 268–286 ms. A final `uip api-workflow validate` returned `ApiwfValidate / Valid` and a final `npm test` passed 10/10.

## Task T6 — uipath-api-workflow — Test ProjectCostLookupApi

**Identity:** `uipath-api-workflow:ProjectCostLookupApi:testing`
**Status:** [x] complete
**Blocked by:** T5
**Skill prompt:**

> Run the specialist testing workflow for §11 of `project-cost-lookup-api-sdd.md`, including happy, error, generalization, and deterministic parallel cases. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/project-cost-lookup-api-sdd.md`. Do not infer or guess.

- [x] Execute API-01 through API-05 and API-E1 through API-E4.
- [x] Record response schemas, logical statuses, variances, latency, and determinism evidence.
- [x] **Validate:** all tests pass and no expected adjustment oracle appears in workflow configuration.

**Evidence (2026-08-08):** real executor results were: API-01 `Found/Tied/Matched`; API-02 `Found/Variance=150`; API-03 `NotFound/InvoiceNotFound/Variance=25`; API-04 `SearchIncomplete/SearchUnavailable/retryable=true`; API-05 used its own totals and returned `Variance=100`; API-E1 through API-E3 returned typed `ValidationError` without comparisons; API-E4 returned `Found/MissingSupportingInvoice` without a technical failure. Identical canonical input produced byte-equivalent structured output. All ten runtime invocations completed below 300 ms, the workflow remained statically valid, the 10-test JavaScript suite passed, and the runtime configuration still contains no adjustment/payable answer-key oracle.

## Task T7 — uipath-functions — Build FinancialRulesEvaluator

**Identity:** `uipath-functions:FinancialRulesEvaluator:function`
**Status:** [x] complete
**Blocked by:** T1
**Skill prompt:**

> Build the typed Python Coded Function from §§1–9 of `financial-rules-evaluator-sdd.md` using decimal arithmetic, generic handlers, deterministic traces, and targeted-scope protection. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/financial-rules-evaluator-sdd.md`. Do not infer or guess.

- [x] Scaffold using current `uip functions` metadata and a uv-managed Python project.
- [x] Implement every supported generic rule type and typed error path.
- [x] Keep canonical identifiers, rates, caps, findings, and totals out of runtime source/configuration.
- [x] **Validate:** local function invocation returns the documented schema and deterministic output.

**Evidence (2026-08-08):** `FinancialRulesEvaluator/` is a uv-managed Python Coded Function with generated `entry-points.json`, `bindings.json`, `project.uiproj`, and callable entrypoint `main` (`a1a4d89e-8e59-425b-a2ca-ea5b1119e1c5`). It implements all eight generic rule types, decimal calculations, grounded-rule and operand validation, total and reference guards, non-monetary reconciliation, overlap-safe aggregation, safe typed failures, and targeted lineage preservation. A fresh `uipath run main --input-file tests/local-smoke-input.json` invocation returned `status=valid` with the complete documented output schema. Package `FinancialRulesEvaluator:0.0.1` was built and published to the `uipathlabs / Playground` tenant feed as package type `Function` at `2026-08-08T22:47:52.057Z`; solution binding remains part of T15.

## Task T8 — uipath-functions — Test FinancialRulesEvaluator

**Identity:** `uipath-functions:FinancialRulesEvaluator:testing`
**Status:** [x] complete
**Blocked by:** T7
**Skill prompt:**

> Execute the unit, canonical fixture, generalization, targeted-mode, and error-path suite from §10 of `financial-rules-evaluator-sdd.md`. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/financial-rules-evaluator-sdd.md`. Do not infer or guess.

- [x] Run all rule-handler and invariant tests through uv.
- [x] Run canonical and post-evidence fixture assertions only from test fixtures.
- [x] Mutate quantities, rates, dates, and evidence; run a fully compliant invoice.
- [x] Scan runtime source/configuration for forbidden oracle literals.
- [x] **Validate:** all tests pass with unchanged unrelated findings during targeted re-evaluation.

**Evidence (2026-08-08):** fresh verification ran 23 tests through `uv` with zero failures. Coverage includes all rule handlers, unsupported/missing/ungrounded/malformed/duplicate/total/reference/target-scope/internal-failure paths, date/rate/quantity/evidence mutations, overlap invariants, a fully compliant invoice, deterministic repeat execution, and unchanged unrelated findings in targeted mode. The test-only canonical fixture asserted initial adjustment/payable `4,564.46 / 58,460.44`, post-evidence `3,649.46 / 59,375.44`, and non-deductive register variance. A fresh scan of runtime source, generated metadata, and configuration found none of the canonical identifiers or oracle amounts.

## Task T9 — uipath-agents — Build ContractComplianceAgent

**Identity:** `uipath-agents:ContractComplianceAgent:agent`
**Status:** [x] complete
**Blocked by:** T2, T4
**Skill prompt:**

> Build the low-code autonomous Agent from §§1–9 of `contract-compliance-agent-sdd.md`, using only the approved Context Grounding index and structured input/output. Keep authoritative arithmetic in the Function. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/contract-compliance-agent-sdd.md`. Do not infer or guess.

- [x] Configure bounded grounded retrieval, effective-date/topic precedence, ambiguity behavior, and audited override handling.
- [x] Define strict structured outputs for document stack, normalized rules, findings, ambiguities, and schema version.
- [x] Bind `healthcare-invoice-assurance-contractsIndex` without adding the Demo Guide or oracle content.
- [x] **Validate:** project validation succeeds and the output contract is accepted by downstream fixtures.

**Evidence (2026-08-08):** scaffolded low-code autonomous agent project `c5110892-9a83-4bf3-b529-9047d93dabe8` with GA model `anthropic.claude-sonnet-5`, temperature `0`, max tokens `12000`, and max iterations `12`. Bound only Context Grounding index `healthcare-invoice-assurance-contractsIndex` (`5eaf632f-2960-4ea7-82eb-08def3f771f8`) in `AMER Presales/HLS`, backed by contract bucket `healthcare-invoice-assurance-contractFiles` (`6dfc0608-733a-4465-9811-59e87d5095cb`). Fresh refresh and validation succeeded at storage schema `50.0.0`; generated entry-point input/output schemas exactly match `agent.json`, and solution resource refresh imported the exact index/bucket bindings with zero warnings. A targeted scan of runtime prompt, resources, bindings, and generated entry points found no answer-key identifiers or amounts and no Demo Guide filename/path.

## Task T10 — uipath-agents — Test ContractComplianceAgent

**Identity:** `uipath-agents:ContractComplianceAgent:testing`
**Status:** [x] completed — six evaluation cases executed with grounded output, trajectory, generalization, and leakage gates passing
**Blocked by:** T9
**Skill prompt:**

> Run the evaluation dataset and regression strategy from §§5 and 10 of `contract-compliance-agent-sdd.md`, including groundedness, precedence, ambiguity, targeted scope, generalization, compliant input, and answer-key injection. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/contract-compliance-agent-sdd.md`. Do not infer or guess.

- [x] Execute A-01 through A-06 with recorded schema and citation evidence.
- [x] Run mutated and fully compliant invoice cases.
- [x] Inspect prompt, context, resources, and index inputs for oracle leakage.
- [x] **Validate:** schema, citation, unsupported-deduction, targeted-scope, and leakage gates pass.

**Evidence (2026-08-08):** added A-01 through A-06 to `Default Evaluation Set` using the agent CLI, including groundedness, precedence, ambiguity, targeted-scope, compliant/generalized-input, and answer-key-injection cases. Case IDs: A-01 `7b8deddc-0363-4b48-8dd2-cc167000f4bc`; A-02 `3df146ba-fb0b-41c7-98c1-e3611731a44e`; A-03 `6d823ffe-b581-44d6-af3d-44c97c6358d8`; A-04 `732bc94f-cb62-498c-9f2c-a29ef08d4ea0`; A-05 `19402c6b-fa97-4410-aa9d-d9c58fe36a72`; A-06 `05c96fdf-1490-46ba-9e19-e569227a77b5`. Both grounded-output and trajectory evaluators were customized to the SDD gates. A subsequent refresh and validation succeeded with six cases, two evaluators, one context, and no runtime oracle leakage.

**Completion evidence (2026-08-09):** live run `80381f77-13df-4852-b910-a89afcd60cdd` completed all six cases without runtime or schema errors. Grounded Output averaged `93.67` (A-01 `88`, A-02 `94`, A-03 `96`, A-04 `94`, A-05 `96`, A-06 `94`) and Grounded Trajectory averaged `77.33` (all cases `72` or `88`). An earlier run exposed an evaluator defect that treated the fixture placeholder `indexed-contract-source` as a literal source ID and penalized the real indexed documents; a regression test now protects the semantic-placeholder rule, the evaluator-only rubric was corrected, the project refreshed and validated at storage schema `50.0.0`, and the Studio Web Solution was force-updated before the passing rerun. Runtime agent instructions and output schema were unchanged.

## Task T11 — uipath-coded-apps — Build and deploy InvoiceAssuranceActionApp

**Identity:** `uipath-coded-apps:InvoiceAssuranceActionApp:action-app`
**Status:** [x] complete
**Blocked by:** T3
**Skill prompt:**

> Build and independently deploy the reusable Action App from §§1–10 of `invoice-assurance-action-app-sdd.md`, using host-injected task session, Reviewer/Manager modes, Apollo-first UI, and JavaScript PDF rendering. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-action-app-sdd.md`. Do not infer or guess.

- [x] Implement the exact Reviewer and Manager business contracts against folder-scoped records and the evidence bucket.
- [x] Implement save/reopen, correction reason, evidence upload, submit, and decision outcomes.
- [x] Package, publish, and deploy type `Action` before Flow AppTask binding.
- [x] **Validate:** build and deployed app metadata succeed in `AMER Presales/HLS`.

**Evidence (2026-08-08):** `InvoiceAssuranceActionApp/` implements the approved Action schema with host-injected `@uipath/coded-action-app` task lifecycle, folder-scoped Bucket/Data Fabric fallbacks, immutable PDF evidence uploads, Reviewer save/submit behavior, Manager approve/return/reject behavior, and JavaScript `react-pdf` rendering without native embedding or standalone OAuth initialization. A fresh production build, lint run, and action-schema validation succeeded. Package `invoiceassuranceactionapp:1.0.0` was published as app type `Action` with system name `IDc76351697dff430c8b619fa684f5d96e` and deployed to folder key `79d872b0-bee1-4264-a6de-3e780f4e4239`; deployment ID `bce5cd65-5b89-4cfa-a0e4-c6cf3023521e`. Post-deploy metadata records display name `InvoiceAssuranceActionApp`, version `1.0.0`, Action type, and the approved client/scopes.

**Evidence update (2026-08-09):** added defensive normalization from the Flow evaluator/canonical-charge shapes into the complete Reviewer display contract so absent presentation-only fields cannot crash the task. Version `1.0.1` passed 22/22 tests, lint, and a fresh production build, then published with `--type Action` and upgraded the same HLS deployment. Fresh Apps metadata confirms system name `IDc76351697dff430c8b619fa684f5d96e`, deployment `bce5cd65-5b89-4cfa-a0e4-c6cf3023521e`, semantic version `1.0.1`, deploy version `2`, and Action usage type.

## Task T12 — uipath-coded-apps — Test InvoiceAssuranceActionApp

**Identity:** `uipath-coded-apps:InvoiceAssuranceActionApp:testing`
**Status:** [x] complete
**Blocked by:** T11
**Skill prompt:**

> Run §11 of `invoice-assurance-action-app-sdd.md` end-to-end, including task persistence, upload, outcomes, sandboxed document rendering, accessibility, and double-submit protection. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-action-app-sdd.md`. Do not infer or guess.

- [x] Run AA-01 through AA-06 and component tests.
- [x] Verify keyboard, focus, contrast, overflow, loading, and responsive behavior.
- [x] Run `npm test` after all JavaScript/TypeScript changes.
- [x] **Validate:** tests pass and Action Center host does not initiate standalone OAuth redirects.

**Evidence (2026-08-08):** the final clean-source `npm test` run passed 20/20 tests across Reviewer/Manager role rendering, pending-task save, evidence persistence, correction and outcome validation, read-only mode, duplicate-submit locking, host-session failure without OAuth, PDF paging/zoom accessibility, and immutable upload metadata. Local browser verification rendered the real two-page Northbridge invoice through `react-pdf`, verified Reviewer and Manager workspaces, Apollo Wind component styling, dark theme, named document controls, and a 375 px responsive layout with no document-level horizontal overflow. The temporary preview harness was removed before the final build. Dependency audit reported no high or critical findings; six moderate advisories are confined to UiPath's transitive OpenTelemetry chain and have only breaking or SDK-downgrade remediation paths.

**Evidence update (2026-08-09):** the final clean-source suite now passes 22/22, including evaluator-finding and canonical-charge normalization into the required Action App display fields.

## Task T13 — uipath-maestro-flow — Build InvoiceAssuranceFlow

**Identity:** `uipath-maestro-flow:InvoiceAssuranceFlow:flow`
**Status:** [x] completed — validated and published with five synchronous HLS persistence checkpoints
**Blocked by:** T3, T4, T6, T8, T10, T11, T13A
**Skill prompt:**

> Build the linear Maestro Flow from §§1–9 of `invoice-assurance-flow-sdd.md`, binding only published resources and the three approved folder-scoped entities. Implement Reviewer evidence/correction, targeted re-evaluation, Manager outcomes, retry/error paths, and append-only activity. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-flow-sdd.md`. Do not infer or guess.

- [x] Author and connect the complete node inventory and reusable subflows.
- [x] Bind published IXP, API Workflow, Function, Agent, Action App, buckets, index, and folder-scoped Data Fabric entities through the approved native Data Service adapter.
- [x] Implement unassigned claimable Reviewer and Manager AppTasks and exact loop behavior.
- [x] **Validate:** Flow validates with all resources resolved and no Case Management stages.

**Evidence update (2026-08-09):** repaired technical-review and loop-state contracts with regression tests: all four unsupported/error branches now create a complete versioned review package before the Reviewer AppTask; Reviewer and Manager bindings consume `currentReviewPackage`; targeted re-evaluation advances the analysis/review cycle while retaining line items, documents, and activity; and manager rationale survives a return loop. The fresh root suite passed 17/17 after formatting. A strict tenant-backed Flow validation then resolved 2,357 dynamic resources and returned `Valid` with no warnings. A verified HLS-scoped Data Fabric connection was healthy, but current UiPath product documentation and refreshed metadata proved folder-level entities are unsupported in Maestro and connector activities. The user approved the supported alternative: one synchronous Studio Web RPA process using native Data Service activities in the same Solution. The Flow remains incomplete until that adapter is built and bound.

**Completion evidence (2026-08-09):** bound published process `InvoiceAssurancePersistence` (`dd273b1c-d925-45d0-b1b6-b719cd972819`, version `1.0.0`) at all five state-changing checkpoints with fail-closed confirmation scripts and exact typed inputs/outputs. The root regression suite passed 20/20. Fresh strict tenant-backed validation resolved 2,361 dynamic nodes and returned `Valid`. Flow package `InvoiceAssuranceFlow.flow.Flow:1.0.1` published successfully and is bound in `AMER Presales/HLS` as release `27d5aedd-46f5-4714-a8c3-38e4ffa9687f`; a fresh HLS process read returned version `1.0.1`, `IsLatestVersion: true`, and the exact folder key, while a fresh Maestro schema read returned the exact manual-trigger input/output contract.

## Task T13A — uipath-rpa — Build and test InvoiceAssurancePersistence

**Identity:** `uipath-rpa:InvoiceAssurancePersistence:process`
**Status:** [~] in progress — implemented, validated, built, published, and bound; live write-path verification remains
**Blocked by:** T3
**Skill prompt:**

> Build the portable Studio Web XAML process from `invoice-assurance-persistence-sdd.md`. Use native Data Service activities in Solution folder scope for the three approved HLS entities. Do not use the Data Fabric connector or tenant-scoped substitutes.

- [x] Scaffold the portable XAML project and register it in the existing Solution.
- [x] Import the three folder-level entity definitions as Solution resources.
- [x] Implement validated Main update, deterministic LineItems upsert, and append-only Activity creation.
- [x] Validate and build after every XAML change.
- [ ] Test repeat invocation, invalid payload, oversized JSON, missing Main record, batch failure, and folder binding.
- [ ] **Validate:** the published process writes only the approved folder entities and returns an exact typed result.

**Evidence update (2026-08-09):** `InvoiceAssurancePersistence/` is a portable Studio Web process registered in solution `21add0e6-ab52-4269-fdac-08def4e47b11` with the three exact HLS folder-entity resources. Six contract tests pass. Fresh UiPath validation returned `No diagnostics found`; the build completed with no errors. Cloud force-upload and download roundtrip verification produced canonical `Main.xaml` SHA-256 `b06983ecf2a012e3e3342e4047e5fbc1a9d6ca3f99a071518b7ebb3082770cf9` and entity-bundle SHA-256 `d35fc36ccb6379bc2b59a441bbb6fcbb87457cf328c6cce7764f2970e8d57228`. Package `HealthcareInvoiceAssurance.process.InvoiceAssurancePersistence:1.0.0` is published and bound in HLS as process `dd273b1c-d925-45d0-b1b6-b719cd972819`; the live entry-point registry exposes the exact six inputs and nine outputs. Runtime write-path checks remain open.

## Task T14 — uipath-maestro-flow — Test InvoiceAssuranceFlow

**Identity:** `uipath-maestro-flow:InvoiceAssuranceFlow:testing`
**Status:** [ ] pending — live persistence prerequisite and canonical runtime execution remain
**Blocked by:** T13
**Skill prompt:**

> Run §10 of `invoice-assurance-flow-sdd.md` end-to-end, including happy path, duplicate, low confidence, ambiguity, schema failure, insufficient evidence, Manager return, refresh recovery, and targeted lineage. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-flow-sdd.md`. Do not infer or guess.

- [ ] Execute canonical and every documented error path.
- [ ] Verify status/totals/history across Reviewer and Manager loops.
- [ ] Record run IDs, traces, task IDs, activity records, and validation evidence.
- [ ] **Validate:** all Flow evaluations pass and retry/error events are auditable.

## Task T15 — uipath-coded-apps — Build and deploy InvoiceAssuranceMainApp

**Identity:** `uipath-coded-apps:InvoiceAssuranceMainApp:web-app`
**Status:** [~] in progress — built, published, deployed, and anonymously reachable; authenticated live integration waits on T13
**Blocked by:** T3, T13
**Skill prompt:**

> Build and independently deploy the Main Coded Web App from §§1–11 of `invoice-assurance-main-app-sdd.md`, applying Apollo first and `uipath-brand-ui-jmr` second. Use delegated PKCE, folder-scoped data, stable process polling, exact task correlation, and embedded Action Center. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/invoice-assurance-main-app-sdd.md`. Do not infer or guess.

- [x] Implement portfolio empty/live states, New Analysis, progress, workspace, contract library, and theme toggle.
- [x] Implement package upload, fingerprinting, selectors, Flow start, stable state polling, and process-correlated task embedding.
- [x] Configure exact approved OAuth client, scopes, redirects, route base, and deployed URL.
- [x] Package, publish, and deploy to `https://uipathlabs.uipath.host/healthcare-invoice-assurance`.
- [ ] **Validate:** production build and deployed reachability/authentication succeed.

**Evidence (2026-08-09):** `InvoiceAssuranceMainApp/` implements the SDD routes and live UiPath SDK services with delegated PKCE, folder key `79d872b0-bee1-4264-a6de-3e780f4e4239`, the three exact entity IDs, bucket lookup, dynamic `InvoiceAssuranceFlow` process lookup, process-variable polling, exact `CreatorJobKey` task correlation, and same-pane Action Center embedding. A fresh run passed 24/24 tests and the production build. Package `healthcare-invoice-assurance:1.0.0` published as Web app system name `ID563d7020b54e4e6d9402f0da0872a4db` and deployed to HLS as deployment `fc74d482-62f0-4abb-adbc-2995c1632c44`. A fresh normal GET returned HTTP 200; production HTML injected the exact client, org, tenant, HLS folder, route base, CDN base, and production redirect URI; both versioned JS/CSS assets returned HTTP 200; browser rendering showed the branded sign-in shell with no diagnostic logs. Authenticated Data Fabric/Flow/task integration remains deliberately open until T13 is deployed.

## Task T16 — uipath-coded-apps — Test InvoiceAssuranceMainApp

**Identity:** `uipath-coded-apps:InvoiceAssuranceMainApp:testing`
**Status:** [~] in progress — unit, build, lint, and public reachability checks pass; authenticated browser acceptance remains
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
**Status:** [~] in progress — refreshed, validated, packed, and published; deployment-folder constraint requires an explicit decision
**Blocked by:** T12, T14, T16
**Skill prompt:**

> Package, publish, deploy, activate, and verify the `.uipx` solution boundary from §§2–3 and 10–12 of `healthcare-invoice-assurance-solution-sdd.md`. Preserve independent Coded App deployments and resolve exact approved folder resources. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [x] Refresh and validate all solution project/resource bindings.
- [ ] Pack, publish, deploy, and activate an intentional version to `AMER Presales/HLS`.
- [ ] Verify Flow, Agent, Function, API Workflow, IXP, apps, buckets, index, and Data Fabric binding identities.
- [ ] **Validate:** deployment/activation succeeds with no unresolved or cross-scope resources.

**Evidence update (2026-08-09):** the complete four-project Solution passed a fresh dry-run and packed successfully as `HealthcareInvoiceAssurance@1.0.1`. Archive inspection verified the persistence process and three exact HLS entity resources, Flow, API Workflow, Agent, Function, IXP deployment, Action App `1.0.1`, bucket, and index. The nested Flow package contains explicit `AMER Presales/HLS` defaults for all five dynamic resources, proving the two pack-time “missing folderPath” messages are false-positive warnings. The exact archive published to the tenant feed as package version key `af5c77c3-1d6d-45ad-87e1-e085b27b6b89`; a fresh package read returned `LatestVersion: 1.0.1` and `State: Ready`. Current CLI deployment can only create a new Solution root folder under a parent and cannot deploy into the already-existing authoritative HLS folder, so activation remains paused rather than creating an unapproved child folder or duplicating folder entities.

## Task T18 — uipath-review — Verify end-to-end acceptance and handoff

**Identity:** `uipath-review:HealthcareInvoiceAssurance:end-to-end-handoff`
**Status:** [~] in progress — deployment inventory, verification ledger, limitations, and reset procedure drafted; live acceptance remains
**Blocked by:** T17
**Skill prompt:**

> Independently verify §8 Evaluation and Testing Strategy and the implementation-goal completion condition. Remediate confirmed defects through the owning specialist, repeat affected checks, then produce the deployment inventory, evidence-backed handoff, limitations, and deterministic reset procedure. Use values, mappings, and structure exactly as documented in the SDD at `docs/superpowers/specs-joe/healthcare-invoice-assurance-solution-sdd.md`. Do not infer or guess.

- [ ] Run component, schema, contract, accessibility, integration, adversarial, compliant-invoice, and full Reviewer/Manager E2E checks.
- [ ] Confirm results change with supported input changes and no runtime oracle leakage exists.
- [ ] Confirm deployed Main App reachability and the complete under-ten-minute demo path.
- [ ] Record deployed identifiers, versions, URLs, evidence, known limitations, and reset commands.
- [ ] **Validate:** every documented completion condition has fresh evidence or an explicit blocking record.

**Evidence update (2026-08-09):** [healthcare-invoice-assurance-deployment-handoff.md](healthcare-invoice-assurance-deployment-handoff.md) records the current identifiers, versions, URL, test/evaluation results, known platform limitations, narrowly scoped reset procedure, and open acceptance gates. A fresh public check returned HTTP 200 for the deployed Main App HTML and both versioned assets with the exact HLS OAuth configuration. Fresh folder-scoped reads confirmed zero Main, LineItems, and Activity records before live testing. The independent read-only review found no Critical issues and graded the low-code Agent A; root contracts passed 21/21, app source/package versions were reconciled to the deployed versions, both app test/lint/build/pack-readiness gates passed, and stale persistence project context was corrected. Authenticated Chrome automation is unavailable because the required ChatGPT browser extension and native host are not installed in the signed-in Chrome profile; no alternate browser or session was substituted.
