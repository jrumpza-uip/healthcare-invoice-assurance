# Healthcare Invoice Assurance — Codex Implementation Goal

## Purpose

Use this prompt only when the user is ready to authorize the complete build, publication, deployment, and verification phase. It is a Codex execution handoff, not a UiPath runtime artifact and not a replacement for the approved SDD set.

## Goal prompt

```text
/goal Build, publish, deploy, and verify the Healthcare Invoice Assurance demo according to the approved design files. Continue through the authorized implementation checkpoints until the complete solution is deployed to uipathlabs / Playground / AMER Presales/HLS and the documented end-to-end acceptance criteria pass. Treat the approved SDD set as authoritative, preserve a concise checkpoint log, verify each checkpoint with fresh evidence, and stop only at the completion or blocking conditions below.

Read before acting:
- /Users/josephrumpza/projects/healthcare-invoice-assurance/AGENTS.md, if present.
- /Users/josephrumpza/projects/healthcare-invoice-assurance/InitialPlanningPrompt.md.
- Every Markdown file in /Users/josephrumpza/projects/healthcare-invoice-assurance/docs/superpowers/specs-joe/.
- The fictional source pack in /Users/josephrumpza/projects/healthcare-invoice-assurance/docs/Healthcare_Invoice_Assurance_Demo_Pack/.
- Inspect the actual repository, current UiPath CLI behavior, generated metadata, authenticated organization/tenant/folder, and existing Studio Web solution before making platform changes.

Authoritative target:
- Automation Cloud: https://cloud.uipath.com/
- Organization: uipathlabs
- Tenant: Playground
- Folder: AMER Presales/HLS
- Folder numeric ID: 2036001
- Folder GUID/key: 79d872b0-bee1-4264-a6de-3e780f4e4239
- Studio Web solution: Healthcare Invoice Assurance
- Deployed Main App URL: https://uipathlabs.uipath.host/healthcare-invoice-assurance

Prepared resources to reuse:
- Uploaded invoice/evidence bucket: healthcare-invoice-assurance-uploadedInvoices
- Contract bucket: healthcare-invoice-assurance-contractFiles
- Contract Context Grounding index: healthcare-invoice-assurance-contractsIndex
- IXP project title: Healthcare Invoice Assurance
- IXP project name: healthcare-invoice-assurance-51392a38-ixp
- IXP project ID: 43a0c85c-5d97-80f8-9f1f-2ac01bae3742

Implementation boundaries:
- Build the linear Maestro Flow, low-code Contract Compliance Agent editable in Studio Web, deterministic Financial Rules Evaluator Coded Function, mock Project Cost Lookup API Workflow, Main Coded Web App, and reusable Reviewer/Manager Coded Action App defined by the SDDs.
- Use UiPath Action Center for both Reviewer and Manager tasks. Create tasks unassigned so an eligible user can claim them. Render the active Action Center task within the Main App as a single pane of glass.
- Create HLS_InvoiceAssurance_Main, HLS_InvoiceAssurance_LineItems, and HLS_InvoiceAssurance_Activity as folder-scoped Data Fabric entities in AMER Presales/HLS. Do not create or bind tenant-scoped equivalents or same-named entities in another folder.
- Use the builder's user-delegated UiPath permissions. Do not embed secrets or use a builder service account.
- Use the prepared IXP project for the mixed invoice package. Configure and evaluate its taxonomy, publish the validated model, and bind that published model; do not silently substitute an unrelated out-of-the-box extractor.
- Apply UiPath Apollo app design guidance first and the uipath-brand-ui-jmr visual guidance second.
- Use only fictional organizations and people. Do not reference real healthcare providers or customers anywhere in runtime artifacts, test data, prompts, configuration, or UI.
- Treat canonical expected amounts and findings only as evaluation oracles. Never hard-code invoice-specific identifiers, values, findings, adjustments, or payable totals into runtime prompts, code, workflows, Data Fabric seed logic, or UI behavior.
- Support different invoices against the selected indexed contract family, including fully compliant invoices that produce no compliance exceptions.
- Do not add historical mock portfolio data unless the user separately requests it.
- Do not implement ERP posting, payment release, live supplier communication, production identity design, or new contract/amendment upload during review.
- Preserve all unrelated repository changes. Do not delete, overwrite, rename, or replace existing UiPath resources outside the named solution and approved resources.

Execution checkpoints:
1. Reconfirm repository state, UiPath authentication, target folder, prepared-resource identifiers, available CLI/plugin capabilities, and current solution contents.
2. Apply the agreed fictional source-pack corrections and verify the Demo Guide or answer key cannot enter runtime context, IXP inputs, or the Context Grounding index.
3. Create and validate the three folder-scoped Data Fabric entities and their demo-grade schemas.
4. Configure, evaluate, publish, and bind the IXP model for invoice, receipt, subcontractor invoice, and cost-register extraction.
5. Build and verify the deterministic Project Cost Lookup API Workflow and Financial Rules Evaluator.
6. Build and evaluate the low-code Contract Compliance Agent using grounded contract evidence and structured outputs.
7. Build and validate the linear Maestro Flow, including reviewer evidence collection, amount correction, targeted re-evaluation, manager approval, retry/error paths, and Data Fabric activity history.
8. Build and deploy the reusable Coded Action App for Reviewer and Manager modes.
9. Build and deploy the Apollo-first Main Coded Web App with upload, account/project selection, live progress, invoice workspace, and embedded Action Center task.
10. Package, publish, deploy, and bind the complete Studio Web solution and independently deployed Coded Apps to the approved environment.
11. Run component, contract, accessibility, integration, and end-to-end verification. Fix verified defects and repeat the affected checks.
12. Produce a final deployment inventory and evidence-backed handoff containing resource identifiers, versions, URLs, validation results, known limitations, and the deterministic demo reset procedure.

Authority and pause conditions:
- Platform writes are authorized only after the user invokes this goal, and only for artifacts and existing resources named by the approved SDDs and this prompt.
- Safe creation, update, publication, deployment, and activation steps within that scope are authorized implementation actions.
- Pause and ask before destructive operations, deleting or replacing existing resources, changing organization/tenant/folder, broadening OAuth permissions, incurring an unanticipated paid dependency, modifying an unlisted external system, or materially departing from the approved design.
- If blocked, exhaust safe in-scope diagnostics and documented alternatives. Report the exact evidence and smallest user action needed; do not invent a workaround that changes the architecture.

Completion condition:
- All authorized components are built, published, deployed, and bound in the approved environment.
- The deployed Main App is reachable at the approved URL.
- A user can upload an invoice package, select the account/project contract profile, start the Maestro Flow, observe dynamically derived analysis, claim and complete the Reviewer task with correction/evidence, pass targeted re-evaluation, claim and complete Manager approval, and view the final disposition and activity history in the Main App.
- Automated evaluations demonstrate that results change with supported input changes and that a compliant invoice can complete without hard-coded exceptions.
- Required build, schema, contract, accessibility, and end-to-end checks pass with fresh evidence.
- The final handoff documents deployed identifiers, versions, URLs, verification evidence, known limitations, and reset instructions.
```

## Usage note

Review the goal against the latest SDD revisions immediately before invoking it. If implementation scope or environment bindings change, update the SDD first and then update this handoff to match.
