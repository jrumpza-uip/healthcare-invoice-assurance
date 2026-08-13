# HLS Single-Folder Migration Design

## Objective

Consolidate the Healthcare Invoice Assurance demo runtime into `uipathlabs / Playground / AMER Presales/HLS` while preserving the existing Shared deployment as a temporary rollback path until the consolidated deployment passes smoke testing.

## Current State

- `AMER Presales/HLS` contains `InvoiceAssuranceFlow`, `InvoiceAssurancePersistence`, and `FinancialRulesEvaluator`.
- `Shared/HealthcareInvoiceAssurance` contains the only currently visible deployments of `ContractComplianceAgent` and `ProjectCostLookupApi`, plus duplicate deployments of the other processes.
- The authoritative contract bucket and Context Grounding index are the existing resources in `AMER Presales/HLS`.
- The user will manually rebind the two Flow nodes after the missing processes are available in HLS.

## Migration Design

1. Verify the authenticated CLI target is `uipathlabs / Playground`.
2. Inspect the exact package keys, versions, feeds, and resource bindings used by the working Shared Agent and API processes.
3. Prefer reusing the working `ContractComplianceAgent 1.0.2` and `ProjectCostLookupApi 1.0.2` packages. If either package cannot be retrieved, rebuild only that component from the existing source project and publish a new version.
4. Create `ContractComplianceAgent` and `ProjectCostLookupApi` processes in `AMER Presales/HLS`.
5. Confirm the HLS Agent resolves the HLS Context Grounding index and its HLS storage bucket. Do not create a third index or bucket.
6. The user manually rebinds the Contract Agent and Project Cost Lookup nodes in `InvoiceAssuranceFlow` to the new HLS processes, then publishes a new Flow version in HLS.
7. Run component smoke tests followed by a controlled end-to-end Flow test.
8. Verify the active HLS Flow has no runtime dependency on `Shared/HealthcareInvoiceAssurance`.
9. Only after verification, remove the Shared deployment or its individual resources using the safest available platform-managed cleanup path.

## Safety and Rollback

- Do not modify or delete Shared resources before HLS verification succeeds.
- Do not overwrite the existing HLS bucket, index, Data Fabric entities, apps, IXP model, persistence process, or financial evaluator.
- If an HLS component test fails, rebind the affected Flow node to its Shared process while correcting the HLS deployment.
- Shared cleanup is a separate destructive checkpoint requiring explicit approval immediately before execution.

## Verification Gates

- CLI authentication identifies `uipathlabs / Playground`.
- Both missing processes appear in `AMER Presales/HLS` at intentional versions.
- `ProjectCostLookupApi` returns the canonical Northbridge match with `searchStatus: Found` and invoice-register status `Tied`.
- `ContractComplianceAgent` completes a grounded smoke invocation using the HLS index.
- The newly published HLS Flow resolves both nodes from HLS and passes Health Analyzer.
- A controlled Flow run reaches the expected human-review path without a Shared resource invocation.
- HLS bucket/index contents and the three folder-scoped Data Fabric entities remain unchanged except for intentional test records.

## Completion Condition

The demo runs entirely from `AMER Presales/HLS`, no active Flow binding or Agent context depends on `Shared/HealthcareInvoiceAssurance`, and the Shared resources have either been retained pending explicit cleanup approval or removed after verified cutover.
