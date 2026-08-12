# Healthcare Invoice Assurance Deployment Handoff

## Status

Build, component publication, direct HLS deployment, Solution packaging, and unauthenticated reachability are verified. Live Data Fabric writes, authenticated browser acceptance, and the approved interpretation of the Solution deployment-folder limitation remain open.

## Target

| Item | Value |
|---|---|
| Organization | `uipathlabs` |
| Tenant | `Playground` (`15eb07e5-edfb-4fcc-9229-7681ff056ff0`) |
| Folder | `AMER Presales/HLS` |
| Folder key | `79d872b0-bee1-4264-a6de-3e780f4e4239` |
| Folder numeric ID | `2036001` |
| Studio Web Solution ID | `21add0e6-ab52-4269-fdac-08def4e47b11` |

## Deployment inventory

| Artifact | Version / identifier | Verified state |
|---|---|---|
| Solution package | `HealthcareInvoiceAssurance:1.0.1`; version key `af5c77c3-1d6d-45ad-87e1-e085b27b6b89` | Tenant feed `Ready`; not activated because the CLI cannot deploy into the existing HLS folder |
| Maestro Flow | `InvoiceAssuranceFlow.flow.Flow:1.0.1`; release `27d5aedd-46f5-4714-a8c3-38e4ffa9687f` | Latest direct release in HLS |
| Persistence process | `HealthcareInvoiceAssurance.process.InvoiceAssurancePersistence:1.0.0`; release `dd273b1c-d925-45d0-b1b6-b719cd972819` | Latest direct release in HLS; live write test pending |
| Financial Function | `FinancialRulesEvaluator:0.0.1`; release `88ef616e-4e9d-4dba-90b3-beb53b5581d2` | Latest direct release in HLS |
| Contract Agent binding | process resource `7147dad8-2ef2-4d99-9af6-bafbc4c24a91` | Resolved by strict Flow validation in HLS |
| Cost Lookup API binding | process resource `8cb92544-1799-40af-91b2-6e2f3085fe69` | Resolved by strict Flow validation in HLS |
| IXP model | `Healthcare Invoice Assurance`; deployment `3994ca7a-2b93-807c-8f96-75602d7b1c47` | Bound in HLS |
| Main Coded App | `healthcare-invoice-assurance:1.0.0`; deployment `fc74d482-62f0-4abb-adbc-2995c1632c44` | Latest package; deployed URL below |
| Action App | `invoiceassuranceactionapp:1.0.1`; deployment `bce5cd65-5b89-4cfa-a0e4-c6cf3023521e` | Latest package; HLS Coded Action binding |
| Contract bucket | `healthcare-invoice-assurance-contractFiles`; `6dfc0608-733a-4465-9811-59e87d5095cb` | Solution resource in HLS |
| Contract index | `healthcare-invoice-assurance-contractsIndex`; `5eaf632f-2960-4ea7-82eb-08def3f771f8` | Agent-only indexed contract context |
| Main entity | `d0fed526-9d93-f111-9b32-000d3ab5d4c4` | Folder entity in HLS |
| LineItems entity | `ecfed526-9d93-f111-9b32-000d3ab5d4c4` | Folder entity in HLS |
| Activity entity | `c5d31b2f-9d93-f111-9b32-000d3ab5d4c4` | Folder entity in HLS |

Main App URL: `https://uipathlabs.uipath.host/healthcare-invoice-assurance`

## Verification evidence

| Gate | Fresh result |
|---|---|
| Root contracts | 21/21 passed |
| Main App | 24/24 passed; lint passed; production build passed |
| Action App | 22/22 passed; lint passed; production build passed |
| Financial Function | 23/23 passed through `uv` |
| Agent evaluation | Run `80381f77-13df-4852-b910-a89afcd60cdd`; grounded output `93.67`; trajectory `77.33`; all six cases completed |
| Independent review | Overall quality `Good`; no Critical findings; low-code Agent grade `A` (`G_det A`, `G_jud A`, architecture average `4.6`) |
| Flow | Strict tenant validation `Valid`; five synchronous persistence checkpoints; HLS release `1.0.1` |
| Solution | `1.0.1` dry-run `Valid`; archive packed and published `Ready` |
| Main App reachability | HTML, versioned JavaScript, and stylesheet each returned HTTP 200; production metadata contains the exact org, tenant, HLS folder, client, scopes, and redirect URI |
| Current demo data | Main, LineItems, and Activity each returned zero HLS records before live testing |

## Known limitations

- UiPath folder-level Data Fabric entities are unsupported from Maestro and connector/API workflows. The approved `InvoiceAssurancePersistence` Studio Web process uses native Data Service activities instead.
- `uip solution deploy run` creates a new Solution root folder under a parent and cannot activate into the existing authoritative HLS folder. Creating a child folder would duplicate folder resources and depart from the approved SDD.
- Authenticated browser verification requires the ChatGPT browser extension in the already signed-in Chrome profile, or equivalent manual evidence from the user. The public app shell and assets are verified independently.
- The two Flow pack warnings about missing API/Agent `folderPath` are tool false positives: archive inspection proves both HLS defaults exist in `content/bindings_v2.json`, and strict tenant validation resolves them.
- Vite reports demo-grade bundle-size warnings; builds complete successfully.
- `npm audit --omit=dev` reports one moderate OpenTelemetry baggage-allocation advisory through UiPath SDK telemetry dependencies in both apps. The registry proposes an unsafe UiPath SDK downgrade rather than a compatible upgrade, so no automated dependency change was applied.
- `InvoiceAssuranceActionApp/src/components/ActionWorkspace.tsx` is 592 lines. It is covered by 22 passing Action App tests but remains a maintainability refactor candidate after the demo.
- The live guardrail catalog exposes PII and prompt-injection validators as `Unauthorised` in this tenant. The Agent accepts structured internal workflow inputs and has no write-capable tools; no unsupported or substitute guardrail was invented.

## Deterministic demo reset

Reset is intentionally record-scoped. Never delete all records or use a broad folder target.

1. Capture the exact `InvoiceRecordId` created by the demo submission.
2. Query LineItems and Activity with `InvoiceRecordId = <exact ID>` in folder key `79d872b0-bee1-4264-a6de-3e780f4e4239` and record every returned system `Id`.
3. Query Main by the exact system `Id` and confirm its `CorrelationId`, invoice number, and supplier before deletion.
4. Delete only the captured LineItems IDs, then Activity IDs, then the Main ID with `uip df records delete <entity-id> <record-ids...> --folder-key 79d872b0-bee1-4264-a6de-3e780f4e4239 --yes --reason "Healthcare Invoice Assurance deterministic demo reset"`.
5. Repeat the three exact queries and require zero matching records. Job and task audit records are retained by the platform rather than deleted.

Every reset is a destructive operation and requires explicit approval immediately before execution.

## Open acceptance gates

- Run the reversible persistence success, repeat-upsert, invalid-input, oversized-input, missing-Main, duplicate-key, and batch-failure checks, then clean up only their captured records.
- Run the canonical Flow through Reviewer and Manager completion and record process, job, task, and activity IDs.
- Complete authenticated Main App, embedded Action App, accessibility, responsive, refresh/recovery, and under-ten-minute demo verification.
- Record the approved direct-HLS deployment exception or amend the SDD before allowing a child Solution folder.
