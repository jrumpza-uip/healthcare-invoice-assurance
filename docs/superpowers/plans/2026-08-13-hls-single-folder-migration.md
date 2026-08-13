# HLS Single-Folder Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the two remaining runtime dependencies into `AMER Presales/HLS`, rebind the Flow to them, verify an HLS-only execution path, and then retire the duplicate Shared resources.

**Architecture:** Reuse the working Agent and API Workflow packages currently deployed under `Shared/HealthcareInvoiceAssurance` instead of deploying the complete Solution into a new folder. Create HLS process releases from those packages, bind the Agent to the existing HLS Context Grounding index, let the user manually select the new HLS processes in the Flow, and keep Shared intact as rollback until verification passes.

**Tech Stack:** UiPath CLI 1.198.x or later, Orchestrator processes/packages, low-code Agent, API Workflow, Maestro Flow, Context Grounding, Storage Buckets.

## Global Constraints

- Organization: `uipathlabs`; tenant: `Playground`.
- Sole target runtime folder: `AMER Presales/HLS`; folder key `79d872b0-bee1-4264-a6de-3e780f4e4239`.
- Preserve `Shared/HealthcareInvoiceAssurance` unchanged until the HLS end-to-end smoke test succeeds.
- Reuse the HLS index `healthcare-invoice-assurance-contractsIndex` and HLS bucket `healthcare-invoice-assurance-contractFiles`; do not create replacements.
- Preserve all three folder-scoped Data Fabric entities in HLS.
- The user performs the two Flow node rebindings manually.
- Shared cleanup is destructive and requires explicit approval immediately before execution.

---

### Task 1: Capture the authenticated deployment baseline

**Files:**
- Read: `HealthcareInvoiceAssurance/resources/solution_folder/process/agent/ContractComplianceAgent.json`
- Read: `HealthcareInvoiceAssurance/resources/solution_folder/process/api/ProjectCostLookupApi.json`
- Create: `.local/investigations/raw/hls-migration-login-status.json`
- Create: `.local/investigations/raw/hls-migration-hls-processes.json`
- Create: `.local/investigations/raw/hls-migration-shared-processes.json`
- Create: `.local/investigations/raw/hls-migration-agent-packages.json`
- Create: `.local/investigations/raw/hls-migration-api-packages.json`

**Interfaces:**
- Consumes: Existing Orchestrator folders and the authenticated `uip` session.
- Produces: Exact package keys, versions, process keys, entry points, and folder/feed evidence used by Tasks 2 and 3.

- [ ] **Step 1: Verify authentication**

Run:

```bash
uip login status --output json > .local/investigations/raw/hls-migration-login-status.json
```

Expected: `Status` is `Logged in`, `Organization` is `uipathlabs`, and `Tenant` is `Playground`.

- [ ] **Step 2: Capture both process inventories**

Run:

```bash
uip or processes list --folder-path "AMER Presales/HLS" --output json > .local/investigations/raw/hls-migration-hls-processes.json
uip or processes list --folder-path "Shared/HealthcareInvoiceAssurance" --output json > .local/investigations/raw/hls-migration-shared-processes.json
```

Expected: HLS contains `InvoiceAssuranceFlow`, `InvoiceAssurancePersistence`, and `FinancialRulesEvaluator`; Shared contains `ContractComplianceAgent` and `ProjectCostLookupApi` at version `1.0.2`.

- [ ] **Step 3: Resolve the package feed entries**

Run:

```bash
uip or packages list --search "HealthcareInvoiceAssurance.agent.ContractComplianceAgent" --output json > .local/investigations/raw/hls-migration-agent-packages.json
uip or packages list --search "HealthcareInvoiceAssurance.api.ProjectCostLookupApi" --output json > .local/investigations/raw/hls-migration-api-packages.json
```

Expected: each result exposes a retrievable `1.0.2` package. If either package is absent, stop before mutations and use the source-pack fallback described in Task 2 Step 1.

- [ ] **Step 4: Inspect package entry points**

Run:

```bash
uip or packages entry-points "HealthcareInvoiceAssurance.agent.ContractComplianceAgent:1.0.2" --output json
uip or packages entry-points "HealthcareInvoiceAssurance.api.ProjectCostLookupApi:1.0.2" --output json
```

Expected: the Agent exposes `content/agent.json`; the API exposes `content/Workflow.json`.

### Task 2: Create the Project Cost Lookup API process in HLS

**Files:**
- Read: `HealthcareInvoiceAssurance/ProjectCostLookupApi/Workflow.json`
- Read: `HealthcareInvoiceAssurance/ProjectCostLookupApi/project.uiproj`
- Create: `.local/investigations/raw/hls-migration-api-create.json`
- Create: `.local/investigations/raw/hls-migration-api-process.json`
- Create only if the package is unavailable: `.local/build/hls-migration/ProjectCostLookupApi/`

**Interfaces:**
- Consumes: Package `HealthcareInvoiceAssurance.api.ProjectCostLookupApi:1.0.2` and HLS folder path.
- Produces: HLS process `ProjectCostLookupApi`, whose process key is used by the user's Flow rebinding.

- [ ] **Step 1: Use the working package or build the exact source fallback**

Primary path: use `HealthcareInvoiceAssurance.api.ProjectCostLookupApi:1.0.2` directly from the package inventory.

Fallback only when Task 1 proves version `1.0.2` cannot be retrieved:

```bash
mkdir -p .local/build/hls-migration/ProjectCostLookupApi
uip api-workflow build HealthcareInvoiceAssurance/ProjectCostLookupApi --output json
uip api-workflow pack HealthcareInvoiceAssurance/ProjectCostLookupApi .local/build/hls-migration/ProjectCostLookupApi --package-version 1.0.3 --output json
uip or packages upload .local/build/hls-migration/ProjectCostLookupApi/HealthcareInvoiceAssurance.api.ProjectCostLookupApi.1.0.3.nupkg --output json
```

Expected: either the working `1.0.2` package remains selected or a newly uploaded `1.0.3` package is visible in the tenant feed.

- [ ] **Step 2: Create the HLS API process**

Run with the selected version (`1.0.2` on the primary path; `1.0.3` only on the fallback path):

```bash
uip or processes create --name "ProjectCostLookupApi" --package-key "HealthcareInvoiceAssurance.api.ProjectCostLookupApi" --package-version "1.0.2" --entry-point "content/Workflow.json" --folder-path "AMER Presales/HLS" --job-priority Normal --no-auto-update --output json > .local/investigations/raw/hls-migration-api-create.json
```

Expected: a successful process creation response in HLS. If the fallback was required, replace only the version argument with `1.0.3`.

- [ ] **Step 3: Verify the created process**

Run:

```bash
uip or processes list --folder-path "AMER Presales/HLS" --output json > .local/investigations/raw/hls-migration-api-process.json
```

Expected: exactly one HLS process named `ProjectCostLookupApi` at the selected version.

### Task 3: Create the Contract Compliance Agent process in HLS

**Files:**
- Read: `HealthcareInvoiceAssurance/ContractComplianceAgent/agent.json`
- Read: `HealthcareInvoiceAssurance/ContractComplianceAgent/bindings_v2.json`
- Read: `HealthcareInvoiceAssurance/ContractComplianceAgent/resources/SelectedContractIndex/resource.json`
- Create: `.local/investigations/raw/hls-migration-agent-create.json`
- Create: `.local/investigations/raw/hls-migration-agent-resources.json`

**Interfaces:**
- Consumes: Package `HealthcareInvoiceAssurance.agent.ContractComplianceAgent:1.0.2`, HLS index key `5eaf632f-2960-4ea7-82eb-08def3f771f8`, and HLS folder key.
- Produces: HLS process `ContractComplianceAgent` with an HLS-only Context Grounding dependency.

- [ ] **Step 1: Confirm the source binding is HLS-scoped**

Run:

```bash
jq '.bindings[]? // .resources[]? // .' HealthcareInvoiceAssurance/ContractComplianceAgent/bindings_v2.json
jq '.' HealthcareInvoiceAssurance/ContractComplianceAgent/resources/SelectedContractIndex/resource.json
```

Expected: index name `healthcare-invoice-assurance-contractsIndex`, folder path `AMER Presales/HLS`, and folder key `79d872b0-bee1-4264-a6de-3e780f4e4239`.

- [ ] **Step 2: Create the HLS Agent process**

Run:

```bash
uip or processes create --name "ContractComplianceAgent" --package-key "HealthcareInvoiceAssurance.agent.ContractComplianceAgent" --package-version "1.0.2" --entry-point "content/agent.json" --folder-path "AMER Presales/HLS" --job-priority Normal --no-auto-update --output json > .local/investigations/raw/hls-migration-agent-create.json
```

Expected: a successful process creation response in HLS. If Task 1 proves the package cannot be retrieved, stop and explicitly approve a source repack before proceeding; do not manufacture a different Agent package silently.

- [ ] **Step 3: Verify runtime resources**

Read the new process key from `hls-migration-agent-create.json`, then run:

```bash
hls_agent_process_key="$(jq -er '.Data.Key // .Data.ProcessKey // .Data.Id' .local/investigations/raw/hls-migration-agent-create.json)"
uip or processes resources "$hls_agent_process_key" --output json > .local/investigations/raw/hls-migration-agent-resources.json
```

Expected: no missing resources and the selected Context Grounding index resolves from HLS. The process key is intentionally obtained from the mutation response rather than copied from Shared.

### Task 4: Manually rebind and publish the HLS Flow

**Files:**
- Platform project: `InvoiceAssuranceFlow` in Studio Web.
- Read-only local comparison: `HealthcareInvoiceAssurance/InvoiceAssuranceFlow/InvoiceAssuranceFlow.flow`

**Interfaces:**
- Consumes: The two new HLS processes from Tasks 2 and 3.
- Produces: A new HLS `InvoiceAssuranceFlow` version whose Agent and API nodes both resolve from HLS.

- [ ] **Step 1: Rebind the API node**

In Studio Web, open the project-cost lookup node and select `AMER Presales/HLS / ProjectCostLookupApi` as its process resource. Confirm the node no longer displays a resource warning.

- [ ] **Step 2: Rebind the Agent node**

Open the contract-compliance Agent node and select `AMER Presales/HLS / ContractComplianceAgent`. Confirm its input and output schemas remain populated and the node has no resource warning.

- [ ] **Step 3: Run Health Analyzer**

Expected: no errors. Resolve warnings only when they affect execution; do not redesign the demo.

- [ ] **Step 4: Publish the Flow**

Publish an intentional version newer than `1.0.2` to `AMER Presales/HLS`, then confirm Orchestrator shows that version as latest.

### Task 5: Verify the HLS-only execution path

**Files:**
- Read: `HealthcareInvoiceAssurance/ContractComplianceAgent/evals/eval-sets/evaluation-set-default.json`
- Create: `.local/investigations/raw/hls-migration-api-smoke.json`
- Create: `.local/investigations/raw/hls-migration-agent-smoke.json`
- Create: `.local/investigations/raw/hls-migration-final-processes.json`

**Interfaces:**
- Consumes: New HLS Agent/API processes and the newly published HLS Flow.
- Produces: Evidence that the demo no longer invokes Shared resources.

- [ ] **Step 1: Run the API smoke test**

Use the same canonical Northbridge request previously verified for `ProjectCostLookupApi` and require:

```json
{
  "searchStatus": "Found",
  "invoiceRegisterComparison": {
    "status": "Tied",
    "variance": 0
  }
}
```

- [ ] **Step 2: Run the Agent smoke test**

Use case `A-01-canonical-grounded-analysis` from `evaluation-set-default.json`. Require a schema-valid response with cited governing documents and no missing-index/resource error.

- [ ] **Step 3: Run the controlled Flow test**

Start the latest `InvoiceAssuranceFlow` in HLS with the approved demo input. Require it to pass extraction, project-cost lookup, contract analysis, persistence, and reach the expected human-review path.

- [ ] **Step 4: Verify final process inventory and bindings**

Run:

```bash
uip or processes list --folder-path "AMER Presales/HLS" --output json > .local/investigations/raw/hls-migration-final-processes.json
```

Expected: HLS contains Flow, Persistence, Financial Rules, Contract Agent, and Project Cost API. Studio Web must show both migrated Flow nodes bound to HLS.

### Task 6: Retire Shared resources after a separate approval

**Files:**
- Create: `.local/investigations/raw/hls-migration-shared-before-cleanup.json`
- Create: `.local/investigations/raw/hls-migration-shared-after-cleanup.json`

**Interfaces:**
- Consumes: Successful Task 5 evidence and explicit destructive-action approval.
- Produces: A single-folder HLS deployment with no Healthcare Invoice Assurance runtime resources remaining in Shared.

- [ ] **Step 1: Capture the Shared inventory**

Run:

```bash
uip or processes list --folder-path "Shared/HealthcareInvoiceAssurance" --output json > .local/investigations/raw/hls-migration-shared-before-cleanup.json
```

- [ ] **Step 2: Request explicit cleanup approval**

Present the exact Shared process, index, and bucket targets. Do not continue without approval.

- [ ] **Step 3: Use platform-managed cleanup**

Prefer Solution deployment uninstall if a deployment record becomes available. Otherwise delete only the verified Healthcare Invoice Assurance processes, then the unused Shared index and bucket; never delete the parent `Shared` folder.

- [ ] **Step 4: Verify removal and rerun HLS smoke test**

Capture the post-cleanup Shared inventory and repeat the HLS API plus Flow smoke tests. Expected: HLS behavior is unchanged and no Shared Healthcare Invoice Assurance resource remains active.
