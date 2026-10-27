# InvoiceAssuranceMainApp — Coded Web App Specification

**Stack:** React 19 + `react-router-dom` v7 + `@uipath/uipath-typescript` SDK + `@uipath/apollo-wind` (Tailwind-based UiPath design system) + `lucide-react` + `next-themes`.

## 1. Purpose & Routes

Human front door for submitting invoices and tracking their assurance workflow to completion.

| Route | Page | Purpose |
|---|---|---|
| `/` | Portfolio | Dashboard: aggregate metrics + list of all invoice records |
| `/new` | New Analysis | Upload form to start a new assurance run |
| `/invoices/:invoiceId` | Invoice Workspace | Single-invoice detail, live-polled |
| `/contracts` | Contract Library | Read-only governed-contract metadata table |
| `*` | — | Redirect to `/` |

Unauthenticated users see a "Sign in with UiPath" card. Authenticated routes render inside an `AppShell` (topbar + left nav: Portfolio / New analysis / Contract library).

## 2. Platform Configuration

| Setting | Value |
|---|---|
| Org / Tenant | Configurable — source used `uipathlabs` / `Playground` |
| API base URL | `https://api.uipath.com` |
| Orchestrator folder (entities/buckets/tasks) | `AMER Presales/HLS` |
| Maestro flow folder + name | Separate folder reference; flow name `"Process Invoice"` |
| Storage buckets | `healthcare-invoice-assurance-uploadedInvoices`, `healthcare-invoice-assurance-contractFiles` |
| OAuth scopes needed | Orchestrator Administration/Assets/Buckets(RW)/Execution/Folders/Jobs(RW)/Queues/Tasks(RW), PIMS, Traces.Api, DataFabric.Data(RW), DataFabric.Schema.Read, OR.Users.Read, ConversationalAgents |

Rebuild as environment-driven config (client id, org/tenant/base URL, folder ids/keys, flow name, bucket names) rather than literals — do not hardcode a specific tenant's numeric folder/process ids.

## 3. Data Access (via SDK)

Uses the three Data Fabric entities from [01-Data-Model-Spec.md](01-Data-Model-Spec.md):

- **Main**: list all (Portfolio); get by id + poll (Workspace); insert placeholder + later update with `ProcessInstanceId` (New Analysis / submission flow).
- **LineItems / Activity**: query filtered by `InvoiceRecordId`, used only on the Workspace page.

SDK query pattern: `entities.queryRecordsById(entityId, {folderKey, pageSize, cursor, filterGroup:{logicalOperator: AND, queryFilters:[{fieldName, operator: Equals, value}]}})`, paginated by following `cursor` until no next page. Also uses `Buckets` (`getByName`, `uploadFile`, `getReadUri` — resolve a short-lived read URL, fetch it client-side, and hold it as an object URL for viewing/downloading), `Processes` (`getByName` + `start` to launch the Maestro flow with input arguments), `ProcessInstances` (`getVariables` — poll Maestro global variables for live progress display), and `Tasks` (`getAll` filtered by `CreatorJobKey eq <processInstanceId>` to find and embed the currently-pending Action Center task for this invoice).

## 4. Pages

### Portfolio (`/`)
Four metric cards computed client-side by aggregating the loaded invoice list: **Submitted value**, **Proposed adjustments**, **Open findings**, **Awaiting evidence**. Below them, a plain table of all invoices linking into the workspace — the source renders the full array with no sort, search, or pagination control (verified: `PortfolioPage.tsx` holds no component state).

### New Analysis (`/new`)
Upload form: required invoice file(s), optional supporting file(s); account/project/contract-profile selectors (single-option in the demo, but should be built as real selectors backed by config/lookup data in a rebuild); a "force manager review" checkbox (demo default: on, labeled as a demo-optimization toggle — treat as an operator override for production, default off).

**Submission flow** (this is the critical business logic to replicate exactly):
1. Generate a `correlationId` (client-side UUID).
2. Upload every file to the invoices bucket under `${correlationId}/invoice/<sanitized-filename>` or `${correlationId}/support/<sanitized-filename>`; compute a SHA-256 checksum client-side for each; collect `DocumentReference{path, type, name, checksum}[]`.
3. Insert a **placeholder** Main record: `InvoiceNumber: "Pending extraction · <correlationId>"`, `SupplierName: "Pending extraction"`, zeroed totals, `ProcessingStatus: "Submitted"`, `DocumentReferencesJson` populated, `AnalysisVersion: 1`.
4. Start the **Process Invoice** Maestro flow with `{invoiceRecordId, correlationId, contractProfileId, sourceDocumentIds, forceManagerReview}`.
5. Update the Main record with the started process's instance id and `ProcessingStatus: "Processing"`.

File validation: PDF/PNG/JPEG only, ≤25 MB each, ≥1 invoice file required.

### Invoice Workspace (`/invoices/:invoiceId`)
Header (process instance/invoice number, status badge, refresh button) → financial strip (Submitted → Adjustment → Payable) → main column (Findings list, canonical charges table, activity timeline) → sidebar (documents list opening a viewer modal; either an embedded live Action Center task iframe if one is pending and correlated to this process instance, or a raw process-variables panel otherwise).

Polling: every 5 seconds, re-fetch the Main/LineItems/Activity records and the Maestro process variables; accumulate variables by id across polls (last-write-wins) so values aren't lost between polls that return partial sets.

Status badge mapping (`ProcessingStatus` → visual variant): `Submitted→outline, Processing→info, ReviewerPending→warning, ManagerPending→warning, AwaitingEvidence→error, Approved→success, Rejected→destructive`, default `secondary`.

### Contract Library (`/contracts`)
Static/read-only precedence table of the governed contract documents (source used 7: index, master agreement, restatement, 3 amendments, one project addendum) — clicking a row opens the PDF from the contracts bucket via the document viewer.

## 5. Reusable Components

- **AppShell** — topbar + sidebar nav + content region; mobile-collapsible sidebar.
- **Document Viewer Modal** — modal `<iframe>`/PDF view over an object URL, closes on Escape/backdrop click, with loading/error states. `useDocumentViewer` hook manages the object URL lifecycle (revokes on close/reopen/unmount to avoid memory leaks).
- **Theme provider + toggle** — light/dark via a `class`-strategy theme library, default light, respects system preference.

## 6. Auth

OAuth/PKCE via the SDK — no manual token handling. On load, check for an OAuth callback and complete it; otherwise show sign-in. Expose `isAuthenticated`, `login()`, `logout()`, `error` through a single auth context wrapping one SDK instance for the app's lifetime.

## 7. Utilities / Business Rules to Replicate

- **Status label formatting**: insert a space before capital letters in camelCase status strings for display (`AwaitingEvidence` → "Awaiting Evidence").
- **Process-variable accumulation**: merge-by-id across polls, sorted by name, so the UI never regresses a previously-seen value.
- **Task correlation**: build an OData-style filter `CreatorJobKey eq <processInstanceId>` (instance id must be numeric) and pick the first task that is not completed, to embed in the workspace sidebar.
- **Currency formatting**: `Intl.NumberFormat('en-US', {style:'currency', currency:'USD'})` — make currency configurable if multi-currency support is in scope for the rebuild (the source is USD-only).

## 8. Visual Design Notes (brief)

Grid-based app shell (fixed topbar + sidebar), two-column workspace detail layout (~65/35 split: content vs. sidebar), teal = positive/informational, orange = adjustments/warnings, built on the UiPath Apollo Wind design tokens layered with a small set of hand-authored component classes rather than raw Tailwind utilities. Not a hard requirement to replicate exactly — treat as a reasonable starting palette/layout for a rebuild.
