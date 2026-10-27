# Design vs. As-Built — Over-Design Analysis

**Question:** what did the coding agent design that the demo didn't need, and how do I stop that next time?

**Method:** every material element of the 16 original design documents (`docs/superpowers/`, 3,705 lines) classified against the reverse-engineered as-built spec (`postop/`, 7 documents), then load-bearing claims re-verified directly against the repository and the shipped `.uis` solution. Claims below are grep- or CLI-verified unless marked *uncertain*.

Companion documents: [01-Delta-Register.md](01-Delta-Register.md) (element-by-element table) · [02-Prompt-Guidance.md](02-Prompt-Guidance.md) (what to change next time).

---

## Headline: the diagnosis is not "the agent over-designed"

That framing is half right, and acting on the half-right version will make the next demo worse. The measured pattern is sharper:

> **The design was accurate about *structure* and fantastical about *operations*. Meanwhile the things that actually determine whether the demo works were never designed at all.**

Three numbers make the case:

| | Designed | Built | Verdict |
|---|---|---|---|
| Agent input/output schema fields | 9 in / 6 out | 9 in / 6 out | Perfect fidelity |
| Data Fabric entity fields | 42 | 45 (0 dropped, 3 added, 1 dead) | Near-perfect fidelity |
| Agent system-prompt rules | **0** | **9** | Design was silent on the demo's actual logic |
| Error-handling scenarios (across SDDs) | 36+ | ~4 behavioral branches, 1 error code | Near-total non-delivery |
| Main App named components | 17 | 3 files | Inventory inflation |
| Retry/backoff policies specified | 6+ | 0 | Zero delivery |
| Telemetry/logging specifications | 4 distinct | 0 lines of code | Zero delivery |

The agent designed a **production system** and built a **demo**. Every place those two diverge produced waste. But the waste was not evenly distributed, and roughly a third of the design was load-bearing and survived intact.

---

## Finding 1 — The most expensive artifact: an entire component built, tested, packaged, then abandoned

`FinancialRulesEvaluator` was specified as a standalone Python Coded Function with its own 282-line SDD, two dedicated tasks (T7/T8), a typed 11-field input and 10-field output contract, Pydantic models, `Decimal`/`ROUND_HALF_UP` money semantics, an 8-code error taxonomy, and dual `initial`/`targeted` evaluation modes.

**It was fully built.** Verified in the repo:

- `FinancialRulesEvaluator/main.py` — **533 lines**
- `FinancialRulesEvaluator/tests/test_financial_rules_evaluator.py` — **971 lines**
- Plus `entry-points.json` (29 KB), `.venv`, `.uipath`, a published `0.0.1` package, and `.pytest_cache` (the suite was really run)
- The earlier local flow references it **7 times** — it was genuinely wired in

**It is absent from the shipped solution.** Zero references to `FinancialRulesEvaluator` anywhere in the deployed `.uis` package. The running solution computes the same eight rule types in inline JavaScript inside the flow's `evaluateFinancialFindings` script node.

So ~1,500 lines of designed, implemented, tested, packaged Python were replaced by a script node — and **no design or plan document records the decision**. The `2026-08-12` simplification plan explicitly *protected* it ("Preserve the existing IXP model, Agent, **Function**, API Workflow…"), so the removal happened after that plan, undocumented.

What survived the collapse: all 8 rule types, the calculation trace, the financial snapshot, and — importantly — the *architectural* idea that the LLM proposes findings and deterministic code computes dollars. That idea was the SDD's best contribution and it outlived the component.

What vanished: the deployment boundary, the typed contract, decimal money semantics (JavaScript has no decimal type), 6 of 8 error codes, and the entire targeted re-evaluation machinery — which did not get reimplemented but **relocated into the agent's prompt** as natural-language rule 4. A deterministic guarantee became a prompt instruction verified by an LLM judge. That is *more* fragile than what was designed, not less.

**Lesson:** the SDD justified a separate deployable component on architectural-purity grounds ("Python Coded Function, not an Agent"; "Published callable package"). For a demo, the *separation of concerns* was worth keeping and the *separate deployment artifact* was not. The design conflated the two.

---

## Finding 2 — The build had to be de-scoped mid-flight, and that plan is the best evidence in the corpus

`plans/2026-08-12-demo-linear-flow.md` is not a build plan. It is a **rescue plan** for a flow that had been built to spec and didn't work as a demo:

> "Replace the structurally valid but business-incomplete Flow with the smallest orchestration that reliably demonstrates…"

"Structurally valid but business-incomplete" is precisely the failure mode of designing operations before behavior. Its constraint line is the single most useful sentence in all 3,705 lines of design:

> "Treat this as an 8–10 minute demo: no queues, case stages, production retry framework, ERP integration, or extra persistence layers."

That sentence appears on **2026-08-12**. The build started well before. Had it been in the original SDD, most of the waste catalogued here would not exist.

What the rescue removed: the `markProcessing` node and its persistence subflow, two of five persistence checkpoints, and the conversion of technical failures into human review work ("Technical failures fault clearly instead of being converted into human review work" — this is what produced the as-built's blanket no-retry posture). What it *added* was a genuine gap fix: the per-document extraction loop, because the designed single-document node violated the requirement that every uploaded document pass through IXP.

---

## Finding 3 — Where the waste actually concentrated: four categories

Every over-design instance measured falls into one of four buckets. This is the actionable taxonomy.

### 3.1 Template sections that a production SDD demands and a demo cannot use

The `ProjectCostLookupApi` SDD is the clearest specimen. The design correctly and explicitly ordered a mock — *"None. The primary design is an intentionally local deterministic mock"* — then wrapped that mock in production scaffolding it cannot possibly need:

- A **retry policy** for loading inline JavaScript literals ("Load mock configuration | 1 | Constant | 2 seconds")
- **p50/p99 latency budgets** ("Under 500 ms", "2 seconds") with no instrumentation built
- A **Security & Authentication** section whose own content is "No external-system credentials are required for the mock adapter"
- A **Rate Limits** row reading "No vendor limit applies"

Four sections exist to say *not applicable*. Roughly 5 of that SDD's 12 sections produced zero build output.

### 3.2 Error taxonomies and reliability regimes that were never implementable

Across the SDD set: 36+ specified error scenarios, 6+ retry/backoff policies, an 11-row error/recovery model, a 5-code persistence error enum, a 7-row agent error table with exponential backoff.

Built: **one** error code (`"PersistenceError"`, which swallows validation failures too), **zero** retries anywhere, and a system the as-built spec characterizes as "fail-fast." The persistence SDD's own test matrix now contradicts the implementation — it asserts a `ValidationError` code that does not exist.

Worth noting *why* much of this was undeliverable: a low-code Agent Builder agent has nowhere to express retry, backoff, or typed error codes. The platform owns that. The design specified governance the runtime cannot represent.

### 3.3 Component-inventory and adjective inflation

17 named Main App components → **3 component files** (verified: `AppShell.tsx`, `DocumentViewerModal.tsx`, `Theme.tsx`). The designed `src/state/` directory was never created; the app uses nine `useState` hooks in `App.tsx` with prop drilling.

Naming a component in a table is free for a designer and looks obligatory to a builder. The tell is the **dead code it produced** — both verified as having no callers outside their own tests:

| Symbol | Designed driver | Status |
|---|---|---|
| `paginateRows` (`utils/pagination.ts`) | "Paginated table … 25–50 row pages" | **Dead** — built, tested, never called |
| `findCorrelatedPendingTask` (`utils/task-correlation.ts`) | 6-step task-correlation algorithm | **Dead / superseded** — `platform.ts` inlines a one-line `.find()` instead |

Both are *tested*. The tests are their only consumers. That is the signature of design-driven over-build: the SDD named a capability, the agent dutifully built and tested the helper, and the UI never needed it.

Adjectives did the same work as nouns: "searchable picker" became three native `<select>` elements with one hardcoded option each; "paginated table" became `.map()` over the full array; "load/error/refresh state" became a bare `<iframe>`.

### 3.4 A verification regime the delivery model could not discharge

19 tasks (T1–T18 + T13A), each ending in a **Validate** gate. 13 evaluation classes. 6 demo success conditions. 12 named E2E scenarios including keyboard-only, focus-order, and contrast checks.

Actually built: 6 agent eval cases, ~10 app unit-test files, and **zero** flow simulations (`simulations.json` is empty), **zero** E2E harness (no Playwright/Cypress/axe dependency in either app), **zero** telemetry (verified: 0 matches for analytics/telemetry/logger across the Main App). Six acceptance gates were still open at handoff.

---

## Finding 4 — The counter-evidence: a third of the design earned its keep, and it wasn't the elaborate third

Cutting design effort indiscriminately would destroy the parts that worked. What survived, verbatim, into the running system:

- **The agent-proposes / code-computes split.** Survived even the deletion of the component that embodied it. The single best idea in the design set.
- **Folder-scoped Data Fabric entities**, with an explicit prohibition on tenant-scoped substitutes — a real platform constraint, held throughout.
- **The `InvoiceAssurancePersistence` adapter**, added at SDD v1.6 in response to a discovered platform limitation (Maestro cannot reach folder-level entities directly). Load-bearing: every state write in the system goes through it.
- **Partial-update semantics** ("never overwrite omitted fields") → a literal 12-field present-key-else-keep implementation. Without it, every stage write would null out fields.
- **`ExternalRecordId` as the upsert key** — the one real correctness mechanism in persistence, built exactly.
- **The 6-case agent eval set** (A-01…A-06), built one-for-one with identical IDs, including the adversarial answer-key injection case.
- **The 9 API test cases**, built verbatim plus a determinism test.
- **Two negative constraints that prevented a much larger build:** "must not call SDK initialization that causes a browser redirect" (Action App) and "must not use naive hostname replacement" (embed URL). Both encode environment facts the agent would otherwise have gotten wrong.
- **Explicit anti-scope**: "must not introduce a queue", "no REFramework", "no memory required", "Case Management out of scope". Cheap to write, high value.

The pattern is unmistakable: **constraints, business rules, and negative requirements survived. Component inventories, error taxonomies, and NFR matrices did not.**

---

## Finding 5 — The inverse failure, which matters as much

Over-design was not the only defect. In several places the design was **silent where it should have spoken**, and the build improvised:

1. **The agent's system prompt.** The design contains *no prompt text at all*. All 9 built rules are build-time inventions — and they are the demo's actual correctness logic (exception-only findings, ceiling semantics, tied-register suppression, decoy-charge discipline, the 8-value rule-type allow-list). The most important artifact in the solution was undesigned.
2. **Entity field types.** The design gave field *names* only — 0 of ~45 type/constraint/default declarations. It came out nearly right anyway, but two load-bearing constraints were invented blind: `IxpConfidence` max 1, and `Variance` as the model's only signed field.
3. **The `Log Activity` workflow.** A whole component that writes to Data Fabric, appearing in **zero** design documents (grep across all 12 SDDs: no hits). It shipped with no validation and no error handling.
4. **The `Top=100` cap** on the line-item upsert lookup — an undesigned silent-correctness limit.
5. **`Main.FinalSummary`** — dead schema. Never designed, never written by any component. Pure build-phase scope creep.
6. **The Action App's resizable two-pane layout** — ~60 lines of drag/persist/clamp logic with keyboard `role="separator"` support, from a design that said only "responsive work area." Agent-initiated scope in the *build*, not the design.

Point 6 deserves emphasis: **the as-built is more complex than designed in at least eleven places**, including a parallel extraction loop that contradicts the design's own stated linearity principle. Over-design is not solely a planning-phase disease.

---

## The one-paragraph answer

The coding agent applied a production SDD template to an 8–10 minute demo. Structural design (schemas, contracts, component boundaries, platform constraints) was excellent and mostly survived. Operational design (error taxonomies, retry policies, latency budgets, security sections, telemetry, E2E matrices, verification gates) was almost entirely undeliverable and produced the measured waste — plus one fully-built, fully-tested, silently-abandoned Python component. Simultaneously the design under-specified the two things that most determine demo success: the agent's prompt and the concrete data types. The fix is not "design less." It is **design the behavior, forbid the operations sections, and make the prompt a first-class deliverable** — see [02-Prompt-Guidance.md](02-Prompt-Guidance.md).

---

### Verification note

Directly verified for this analysis: the abandoned evaluator (line counts, package artifacts, absence from the shipped `.uis`, 7 references in the superseded local flow); both dead utilities' call sites; the 3-vs-17 component count; absence of `src/state/`; zero telemetry matches; 19 task IDs; 17 designed component-table entries. One claim from the delta pass **falsified my own postop spec** — it described the Portfolio table as "sortable"; the source has no sort state or handler. [04-Main-App-Spec.md](../04-Main-App-Spec.md) has been corrected. Items I could not verify are marked *uncertain* in [01-Delta-Register.md](01-Delta-Register.md).
