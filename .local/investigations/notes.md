# Quick Form task 19678238 investigation

- Expected outcome: identify why the task fails to open with `Invalid time value`; no source or cloud changes authorized yet.
- Anchor: Action Center task ID `19678238`, title shown as `Correct invoice fields #19678238`, status Pending.
- Reported signal: Quick Form host toast says `An unexpected error has occured. Please try again later (Invalid time value)` on 2026-08-19.
- Environment to verify: production UiPath Cloud, organization `uipathlabs`, tenant `Playground`.

## Correlated runtime signals

- `raw/login-status.json`: active org `uipathlabs`, tenant `Playground`.
- `raw/task-19678238-form.json`: task `19678238`, `QuickFormTask`, folder `AMER Presales/HLS/HealthcareInvoiceAssurance`, created `2026-08-19T15:23:38.033Z`; payload contains `Invoicedate: null`. It is the only date-like field and only null in the four-field task payload.
- `raw/creator-job-traces.json`: creator instance `02969ad1-bf60-42f4-ba11-4f36525f9133` completed `Normalize extracted package`, branched through `Required fields complete?`, then entered `Correct required invoice fields` / element `correctRequiredFields`; trace links that node directly to task `19678238`.
- `raw/extraction-job-get.json`: correlated child job `5a8b69f6-35f2-4976-b4aa-8749e03a6434` successfully processed `01_Northbridge_GC_Invoice_NBG-0726-01.pdf`; its Invoice Header `Invoice Date` field was `missing: true`, `value: null`, `confidence: 0.0`.
- `raw/normalize-syntax-instance-asset.json`: deployed node `correctRequiredFields` defines field `invoicedate` as `Type: date`, `Required: true`, bound directly to `$vars.normalizePackage.output.invoice.date`.
- `raw/docsai-quick-form-null-date.json`: UiPath documentation guidance says extracted values may be null/empty and date fields should receive only valid date strings; when missing, leave the field unbound/empty or provide a valid default.

## Escalation candidates

1. Upstream extraction returned no invoice date and the value propagated unchanged into the task. Confirm: correlated extraction output and task payload both null. Eliminate: extraction contains a valid date or task contains a different date value.
2. The Quick Form boundary binds a nullable extraction value directly into a required `date` control. Confirm: deployed node definition and task payload pairing. Eliminate: deployed field is not date-typed, not bound to the extracted date, or the task contains a valid date.
3. Originating fault is elsewhere (another malformed time field or the Action App/client ID). Confirm: another date/time value in this exact Quick Form payload or trace enters the coded Action App. Eliminate: sole date-like field is `Invoicedate`, task type is `QuickFormTask`, and trace stops in the native Quick Form node.

## Probe h1 — null propagation

- Task identity/environment/time: supported by `raw/task-19678238.json` and `raw/task-19678238-form.json` (`Id=19678238`, `Type=QuickFormTask`, `CreatedTime=2026-08-19T15:23:38.033Z`, creator key matches).
- Task date null: supported by `raw/task-19678238-form.json` (`Data.Data.Invoicedate=null`).
- Upstream extraction null: supported by `raw/extraction-job-get.json` (`Invoice Date`, `missing=true`, `value=null`, `confidence=0.0`).
- Competing malformed time value: contradicted; no other date/time field exists in the four-field Quick Form payload.
- Gap: no browser stack is exposed by the CLI, so the renderer call throwing `Invalid time value` is correlated rather than stack-level evidence.

## Probe h2 — deployed source boundary

- Deployed node identity: supported by `raw/creator-job-traces.json` (`correctRequiredFields`, task link `19678238`).
- Direct nullable-to-date binding: supported by `raw/normalize-syntax-instance-asset.json` (`invoicedate`, `Type=date`, `Required=true`, binding to normalized invoice date).
- Local editable match: contradicted. `HealthcareInvoiceAssurance/InvoiceAssuranceFlow/InvoiceAssuranceFlow.flow` contains no `correctRequiredFields` node or equivalent correction variables.
- Gap: the deployed Flow definition and local source are out of sync; an exact source edit is blocked until the deployed Flow is pulled/exported or reconciled.

## Adjudication

- Candidate 1 survives: runtime evidence proves the extractor emitted a missing/null Invoice Date; the deployed normalizer converted the missing value to an empty string, and the task boundary materialized it as null.
- Candidate 2 survives as the propagation defect: the deployed Quick Form binds that nullable value directly into a required date control.
- Candidate 3 is eliminated: this is a native `QuickFormTask`, not the coded Action App, and no other date/time payload value exists.
- Conclusion confidence: medium. The full data path is correlated, but browser stack-level proof or a controlled valid-date comparison is unavailable; a host-renderer regression cannot be fully eliminated.

## Verification checklist

1. Cause named: no exact installed playbook matched. Evidence-supported trigger is a missing extracted invoice date propagated as an empty/null date value across the boundary into a required Quick Form date binding.
2. Evidence pinned: extraction `Invoice Date missing=true/value=null`; task `Invoicedate=null`; deployed field `Type=date/Required=true` with direct binding.
3. Runtime evidence: task, creator Flow trace, and child extraction job all share the same tenant, folder/instance chain, document, and 2026-08-19 15:23 UTC window.
4. Resolution aligned: official docs confirm date fields are supported and extraction values may be null/empty; DocsAI-derived mitigation is to leave a missing date unbound or supply a valid default rather than bind an invalid/empty date. The docs do not explicitly guarantee null runtime behavior.
5. Causal precedence: IXP did not extract Invoice Date; the normalizer propagated null; the required-fields gateway intentionally opened the correction task; the Quick Form received null in its date control and failed while rendering.
6. Fix scope: adjust only the `correctRequiredFields.invoicedate` input boundary once matching deployed source is available. No Action App/client ID change is implicated.

## Fresh-eyes verification

- Verdict: shallow because the original wording overstated proof, not because the correlated data chain was contradicted.
- Factual correction applied: extraction null became an empty string in the deployed normalizer and later appeared as null in task data; it was not propagated unchanged.
- Remaining factual gap: no browser stack, renderer instrumentation, or controlled valid-date comparison is exposed. The null/empty date is the sole correlated trigger, but the exact throw site remains an inference.
- Documentation correction applied: the Human Task docs do not specify null rendering behavior; the mitigation is DocsAI-derived from supported field/extraction contracts.
- Source blocker verified: local `InvoiceAssuranceFlow.flow` does not contain deployed node `correctRequiredFields`, so no exact edit is safe until deployed source is recovered/reconciled.

---

# Initial persistence failure investigation

- Expected outcome: determine why initial persistence cannot find Main record `CF32DD4C-B494-F111-9B33-7C1E522150AC`; no source or cloud mutation authorized.
- Anchor: same running Flow instance `02969ad1-bf60-42f4-ba11-4f36525f9133`, folder key `0e94dc5e-161a-44c8-8a42-2bb571b8d353`, after resolving Quick Form task `19678238`.
- User-provided step variables: `persistInitialAnalysis.output.out_Success=false`, `out_ErrorCode=PersistenceError`, `out_ErrorMessage="Main record not found: CF32DD4C-B494-F111-9B33-7C1E522150AC"`.
- Source signal: `InvoiceAssurancePersistence/Main.xaml` calls `GetEntityRecordById` against entity `d0fed526-9d93-f111-9b32-000d3ab5d4c4`, `RecordId=Guid.Parse(in_InvoiceRecordId)`, `ScopeValue=Folder`, then throws when `mainRecord Is Nothing`.
