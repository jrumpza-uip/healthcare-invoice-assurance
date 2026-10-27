# Delta Register — element-by-element

Classification key: **BUILT** (as designed) · **DROPPED** (designed, absent) · **COLLAPSED** (separate thing → merged/inline) · **SIMPLIFIED** (built, materially thinner) · **ADDED** (built, never designed) · **DIVERGED** (same intent, different shape).

"Over-design?" answers: *did designing this waste effort or mislead the build?*

---

## A. Solution architecture

| Element | Class | Design → As-built | Over-design? |
|---|---|---|---|
| 7-project inventory | DIVERGED | 7 named projects → 8 code projects (Function gone; Extract Uploaded Document + Log Activity added) | Partial |
| `FinancialRulesEvaluator` as a deployable Coded Function | **DROPPED** | "Published callable package; solution-bound resource" → inline flow script; 1,504 lines of built Python orphaned | **Yes** — see Findings §1 |
| Maestro Flow | BUILT (renamed) | `InvoiceAssuranceFlow` → `Process Invoice` | No |
| `ContractComplianceAgent` | BUILT | grounded, exception-only, no monetary authority | No |
| One reusable Action App for both modes | BUILT | design principle 6, held | No |
| `ProjectCostLookupApi` as a mock | BUILT | mock ordered, mock delivered | No |
| `InvoiceAssurancePersistence` adapter | BUILT | added at SDD v1.6 for a real platform limit | No — earned its keep |
| 3 folder-scoped entities in `AMER Presales/HLS` | BUILT | exact | No |
| 2 buckets + context-grounding index | BUILT | same names, ids `204616`/`204617` | No |
| Custom IXP project over OOB extractor | BUILT | published, bound | No |
| Three deployment boundaries (apps outside the `.uipx`) | DIVERGED | design said apps "are not registered inside the `.uipx` package"; as-built packs them in the solution tree | Partial |
| Solution *activation* into the folder | DROPPED | T17 required activate; never activated (platform limitation, per handoff) | No |
| Bounded retry / timeout policy | **DROPPED** | "`[DEFAULT]` bounded retry" → "no automatic retries anywhere" | **Yes** |
| 11-row error/recovery model | **SIMPLIFIED** | 11 typed conditions → ~4 branches, 1 error code | **Yes** |
| 13 evaluation classes | **SIMPLIFIED** | → 6 agent evals + unit tests; 0 flow simulations | **Yes** |
| 6 demo success conditions incl. "8–10 minute" runtime | DROPPED (unverified) | open acceptance gates at handoff | Partial |
| Duplicate-submission package fingerprint | DROPPED | "Reject or return the existing invoice record using package fingerprint" → absent | **Yes** |
| Security boundaries (8 bullets) | SIMPLIFIED | "displays only invoices the signed-in user can access" → `IsRbacEnabled: false` | Partial |
| "Resource identifiers must be configuration…not runtime constants" | **DIVERGED** | violated: bucket ids, account/project ids, folder ids hardcoded in ≥4 places | No (design was right; build ignored it) |
| 12+ design documents for a 7-document system | ADDED (design-only) | 19 tasks, 7 child SDDs, goal prompt, handoff | **Yes** |

**Counts:** components 13 designed / 14 built · deployment boundaries 3 / 1 · tasks-with-validate-gates 19 / 13 complete · error conditions 11 / ~4 · eval classes 13 / 6 · design docs 12+ / 7 as-built docs.

---

## B. Flow & financial rules

| Element | Class | Design → As-built | Over-design? |
|---|---|---|---|
| 8 supported rule types | BUILT | identical set, identical formulas | No |
| Evaluator 8-code error taxonomy | SIMPLIFIED | → `INVALID_REFERENCE` + `UNSUPPORTED_RULE` only | **Yes** |
| `mode: initial\|targeted`, `previousSnapshot`, `preservedFindingIds` scope enforcement | **DROPPED** | deterministic scoping → relocated into the agent's *prompt* (rule 4) | **Yes** — and the replacement is more fragile |
| Decimal money semantics | DIVERGED | Python `Decimal`/`ROUND_HALF_UP` → JS floats (no decimal type) | Partial |
| `calculationLines[]` + `financialSnapshot` | BUILT | trace and snapshot survive | No |
| Max-adjustment de-duplication per charge | ADDED | undesigned, financially significant | n/a |
| `markProcessing` node + subflow | DROPPED | removed by the 08-12 rescue plan | **Yes** |
| `contractGovernedGate` node | DROPPED | agent `ambiguities[]` covers it | **Yes** |
| `RecordActivityEvent` reusable subflow | DIVERGED | 1 subflow → 5 discrete `logActivity` calls to an undesigned RPA workflow | No |
| 3 named persistence subflows | COLLAPSED | → inline scripts + 3 direct calls | Partial |
| Native IXP node, single package | DIVERGED | → RPA wrapper inside a **parallel** per-document loop | No (necessary correction) |
| Bounded retries (IXP/Agent/API) | **DROPPED** | three specified → zero built | **Yes** |
| Low-confidence field → reviewer finding | DIVERGED | → `correctRequiredFields` quick-form HITL + correction script | No |
| Reviewer/Manager HITL + readiness gate + return loop | BUILT | essentially as drawn | No |
| `forceManagerReview` input | ADDED | 5th flow input, bypasses the designed gate | n/a |
| Persistence-success decision nodes | ADDED | 3 extra gates with throwing branches | n/a |

**Node counts:** top-level nodes 18 designed / ~35 built · subflows 3 / 0 · decision nodes 2 / 6 · HITL nodes 2 / 3 · loops 0 / 1 · flow inputs 4 / 5. The built flow is ~2× the node count while expressing *fewer* distinct concepts — growth is mechanical (subflow inlining, five logging call sites, three persistence gates).

---

## C. Agent & API workflow

| Element | Class | Design → As-built | Over-design? |
|---|---|---|---|
| Low-code Agent Builder choice | BUILT | `type: lowCode`, non-conversational | No |
| 4-framework comparison matrix | DROPPED | zero build impact | Partial (cheap ceremony) |
| Input contract (9 fields) / output (6) | BUILT | exact, both | No |
| Per-item sub-schemas & enums | ADDED | design gave names only → 34 sub-fields, 2 enums | n/a (necessary) |
| Single context-grounding tool | BUILT | one index, semantic, top-8, PDF-only | No |
| Memory | BUILT ("none") | "Not required" → `agentMemoryEnabled: false` | No — a valuable *negative* decision |
| Agent error table (7 scenarios, backoff) | **DROPPED** | `guardrails: []`, no retry, no typed errors | **Yes** — platform can't express it |
| `unsupportedRuleType` ambiguity token | DROPPED | absent; ambiguities are free-text | Yes |
| Runtime-overridable contract-profile → index binding | DROPPED | index name hardcoded, one profile | **Yes** |
| Success metrics (6, with % targets) | COLLAPSED | → 2 judge prompts scoring 0–100, no thresholds enforced | **Yes** |
| Eval dataset A-01…A-06 | BUILT | 6 cases, identical IDs | No — best artifact in the set |
| Regression gate ("block deployment on schema failure") | DROPPED *(uncertain — no CI inspected)* | no gate found | Yes |
| **System prompt** | **ADDED** | **design contains none** → 9 rules + 4 user-turn bullets | n/a — *under*-design |
| API: mock, no connectors | BUILT | explicitly ordered as a mock | No |
| API 8-step flow w/ distinct activity types | COLLAPSED | → 1 JS node (~8 KB) + 1 response node | Partial |
| API retry policy | **DROPPED** | retry for inline literals → none | **Yes** |
| API p50/p99 latency budgets | **DROPPED** | no instrumentation | **Yes** |
| API Security & Auth section | **DROPPED** | section's own content: "No external-system credentials are required" | **Yes** |
| API rate limits | **DROPPED** | "No vendor limit applies." | **Yes** |
| `simulateSearchUnavailable` hook | BUILT | exact | No |
| API error taxonomy | DIVERGED | `UnexpectedFailure` designed but absent; `SupplierNotFound` built but undesigned | No |
| API test cases (9) | BUILT | 9 + a determinism test | No |

**Counts:** prompt rules 0 designed / 9 built · input fields 9 / 9 · output fields 6 / 6 · nested sub-fields 0 / 34 · tools 1 / 1 · agent error scenarios 7 / 0 · eval cases 6 / 6 · scored dimensions 14 implied / 2 built · API steps 8 / 2 nodes · API retries 1 / 0.

---

## D. Data model & persistence

| Element | Class | Design → As-built | Over-design? |
|---|---|---|---|
| `operation` input + 5-value stage enum + 5-row mapping table | **DROPPED** | per-stage branching → one unconditional path (empty arrays already encode "no lines this stage") | **Yes** |
| 8-key typed output contract | **SIMPLIFIED** | → 3 keys; `lineItemsCreated`/`Updated` counts never plumbed | **Yes** |
| 5-code error enum | **COLLAPSED** | → single `"PersistenceError"`; the SDD's own test matrix now contradicts the build | **Yes** |
| BR-02 GUID format pre-check | DROPPED | the Get already fails closed | **Yes** |
| BR-03 partial Main update | BUILT | → literal 12-field present-key-else-keep | No — highest-value element |
| BR-04 `ExternalRecordId` upsert key | BUILT | exact | No |
| BR-05 append-only Activity, 7 required fields | BUILT | exact | No |
| BR-06 size limits on 4 JSON fields | SIMPLIFIED | only `PayloadJson` checked; `FindingsJson` handled upstream instead | Partial |
| BR-07 folder scope | BUILT | the constraint the whole SDD exists for | No |
| No-retry / no-replay policy | BUILT | explicit refusal to add retry, honored | No — restraint that survived |
| Batch create/update activities | DIVERGED | batched → per-row loop (simpler, fine at demo volume) | No |
| E3 per-batch confirmed counts | DROPPED | depends on the dropped count outputs | **Yes** |
| Test matrix (5 happy + 3 exception + 3 error) | DROPPED | 2 of 3 exception tests would now fail on error code | **Yes** |
| Line-lookup pagination | ADDED | `Top=100` silent cap, undesigned | n/a — *under*-design |
| Identity-field preservation on update | ADDED | sensible, invented at build time | n/a |
| **`Log Activity` workflow** | **ADDED** | **zero hits across all 12 SDDs**; shipped with no validation, no error handling | n/a — *under*-design |

**Field-level diff:** designed 42 · built 45 · designed-but-unbuilt **0** · built-but-undesigned **3** (`Main.FinalSummary`, `LineItems.AnalysisVersion`, + Activity behavioral) · dead **1**.

- `Main.FinalSummary` — `MULTILINE_TEXT(10000)`, no writer, no reader, **zero mentions in any design doc**. Build-phase scope creep, not design over-reach.
- Design specified field *names only* — **0 of ~45** type/constraint/required/default declarations. Two load-bearing constraints were therefore invented blind: `IxpConfidence` max 1 and `Variance` min −1e12 (the only signed field).
- *Uncertain:* `Main.AccountId`/`ProjectId`/`ContractProfileId` are required and written once but every consumer reads them from flow variables, not the entity — possibly write-only audit columns. Confirm before trimming.

---

## E. Coded apps

### Main App

| Element | Class | Design → As-built | Over-design? |
|---|---|---|---|
| 4 routes + redirect | BUILT | exact | No |
| Platform base path for router | BUILT | `basename={getAppBase()}` | No |
| 17 named components | **COLLAPSED / SIMPLIFIED** | → **3 component files** (verified) | **Yes** |
| `InvoiceTable` "searchable, 25–50 row pages" | **SIMPLIFIED** | → plain table, full array, **no component state at all** | **Yes** |
| `AccountProjectPicker` / `ContractProfilePicker` "search pickers" | **SIMPLIFIED** | → 3 native `<select>`, one hardcoded option each | **Yes** |
| `ChargeTable` "paginated" | **SIMPLIFIED** | → unpaginated `.map()` | **Yes** |
| `FindingsPanel` w/ citations + next action | **SIMPLIFIED** | → no citation, no clause, no next action | **Yes** |
| `ContractEvidencePanel` | **DROPPED** | absent from the Main App entirely | **Yes** |
| `TaskEmbed` w/ load/error/refresh state | **SIMPLIFIED** | → bare `<iframe>` | **Yes** |
| `ProcessingTimeline` | COLLAPSED | → raw `<dl>` variable dump | Partial |
| 5 global state slices + `src/state/` dir | **DIVERGED** | **no `src/state/` exists**; 9 `useState` in `App.tsx`, prop-drilled | **Yes** |
| Live-update accumulate-by-id rules | BUILT | `accumulateVariables` + ref merge | No — subtle and worth designing |
| 6-step task-correlation algorithm | SIMPLIFIED | → server filter + inline `.find()`; the purpose-built helper is **never called** | **Yes** |
| "must not use naive hostname replacement" | BUILT | `utils/urls.ts` host map | No — prevented a real bug |
| 9-row error matrix | **DROPPED** (mostly) | 3 of 9; no duplicate/stale/failed-to-start/re-auth handling | **Yes** |
| 6 E2E scenarios | **DROPPED** | no Playwright/Cypress/axe dependency | **Yes** |
| Checksums + correlationId + placeholder-then-link submission | ADDED | design showed one box; this is the app's most intricate logic | n/a |
| "Optimize for demo" force-review toggle | ADDED | not designed | n/a |

### Action App

| Element | Class | Design → As-built | Over-design? |
|---|---|---|---|
| Two modes from trusted task input | BUILT | validated on load | No |
| 11 named components | COLLAPSED | → `<section>` blocks in one ~680-line file | Partial |
| `DocumentViewer`, no native PDF embed | BUILT | `react-pdf` w/ paging + zoom | No — environment constraint honored |
| No PKCE redirect / host-injected session | BUILT | no `initialize()` call | No — prevented a sandbox failure |
| Autosave on every edit; Save-and-exit | BUILT | exact | No |
| 4 validation rules | BUILT | all four + an extra `AwaitingEvidence` block | No |
| 9-row error matrix | BUILT (mostly) | genuinely implemented here | No |
| Double-submit protection | BUILT | `submissionLock` ref | No |
| Data Fabric fallback reads | ADDED | one design clause → full cursor-paginated reconstruction | n/a |
| **Resizable two-pane layout** | **ADDED** | "responsive work area" → ~60 lines drag/persist/clamp + keyboard `role="separator"` | n/a — build-phase scope creep |
| Hardcoded `HLS_FOLDER_ID`/`KEY` | ADDED | contradicts the solution SDD's own config rule | n/a |
| E2E tests | DROPPED | no harness | **Yes** |

### NFRs — designed vs. actually implemented

| NFR | Designed | Built |
|---|---|---|
| Accessibility | *No WCAG conformance claim* — only keyboard/focus/contrast **checks** | Real ARIA shipped (`aria-label`, `role="dialog" aria-modal`, `aria-live`, `role="separator"` with `aria-valuenow`). The **verification** was dropped, not the implementation. Design correctly did *not* over-claim |
| Responsive | "responsive work area" | Built — 2–3 breakpoints per app |
| Theming | Apollo light default + dark toggle | Built; Action App exceeds design (reads host theme incl. `DarkHighContrast`) |
| Reduced motion | Not designed | **Built anyway** (`prefers-reduced-motion`) |
| Loading states | Specified | Built |
| Empty states | Specified | Partial (2 of ~4 places) |
| Error states | 9 rows per app | Action App ≈ built; Main App 3 of 9 |
| **Telemetry / logging** | 4 distinct specifications ("Correlation-aware platform/client error", "Structured client error", …) | **Zero lines. Verified: 0 matches** for analytics/telemetry/logger |
| i18n / offline / perf budgets | Correctly **not** designed | Not built — aligned |

Note the nuance: the apps' NFR failure is **not** blanket padding. The design skipped i18n, offline, and performance budgets entirely, and made no WCAG claim. The waste is narrow and specific — telemetry specs with no logger, error matrices with no handlers, E2E lists with no harness.

### Dead code (grep-verified, no callers outside their own tests)

| Symbol | Designed driver |
|---|---|
| `paginateRows` (`utils/pagination.ts`) | "Paginated table … 25–50 row pages" |
| `findCorrelatedPendingTask` (`utils/task-correlation.ts`) | 6-step correlation algorithm |
| `src/state/`, `src/styles/` dirs | design §11 project tree — never created |
| Action App `assets/hero.png`, `react.svg`, `vite.svg` | scaffold leftovers |

---

## F. Uncertain / unverified

1. Whether the orphaned `FinancialRulesEvaluator` package is still *deployed* (unreferenced) in the tenant folder — repo and `.uis` checked; tenant process inventory not queried.
2. Whether any CI pipeline implements the designed "block deployment on schema failure" gate — no pipeline inspected.
3. Whether the agent eval thresholds are enforced anywhere — both evaluators emit 0–100 with no pass threshold in their JSON.
4. Whether `Main.AccountId`/`ProjectId`/`ContractProfileId` have a UI reader (see §D).
5. Whether `ProcessingTimeline` was attempted and replaced, or never started — no artifact records the decision.
6. Exact as-built flow node count (~35): a careful enumeration, not a graph parse.
7. Whether the duplicate-package feature was descoped deliberately or forgotten — no decision record either way.
8. The IXP project itself was never available for inspection, so no design/build delta is computable for it.
