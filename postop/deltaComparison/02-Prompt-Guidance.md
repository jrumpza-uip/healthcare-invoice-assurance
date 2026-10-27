# How to Stop the Over-Design Next Time

Derived from the measured deltas in [00-Findings.md](00-Findings.md) and [01-Delta-Register.md](01-Delta-Register.md). Every rule below traces to a specific waste instance in this project.

The goal is **not** less design. A third of this design set was load-bearing and survived verbatim. The goal is to move design effort from operations to behavior.

---

## 1. The single highest-leverage change

Put the de-scoping sentence in the SDD, not in a rescue plan three weeks later. This project's best constraint line already exists — it just arrived too late:

> "Treat this as an 8–10 minute demo: no queues, case stages, production retry framework, ERP integration, or extra persistence layers."

Promote a version of that to the **top of the design prompt**, before any SDD is written:

```text
This is a DEMO, not a production system. Target: a <N>-minute live walkthrough
for <audience>. Optimize for "the happy path is undeniable and the story is
legible," not for resilience, scale, or operability.

Demo-grade means:
- The happy path works end to end and is visually obvious.
- Exactly ONE deliberate failure/edge case, only if the demo narrative needs it.
- Everything else fails fast and loudly. No retries, no backoff, no fallbacks.
- No queues, no case stages, no extra persistence layers, no ERP integration.
- Mocks are first-class. A mock needs fixtures and a contract, nothing else.
```

---

## 2. Ban the sections that produced zero build output

In this project these sections generated documentation the build ignored, and in several cases the section's own content was "not applicable."

**Add to the design prompt:**

```text
DO NOT write these sections for a demo SDD. Omit them entirely — do not
include them with "N/A" or "None":
  - Error taxonomies / typed error-code enums
  - Retry, backoff, or timeout policies
  - Performance budgets (p50/p99/latency/throughput)
  - Security & Authentication (unless the demo actually authenticates
    to something beyond the platform's own session)
  - Rate limits
  - Telemetry, logging, or analytics specifications
  - Escalation matrices
  - Framework/vendor comparison tables
  - Load tests, E2E test matrices, accessibility audit plans

Instead write ONE "Failure posture" paragraph: what happens when something
breaks, in plain language. For a demo the correct answer is almost always
"it faults visibly and we restart the run."
```

Evidence: 36+ designed error scenarios → 1 error code. 6+ retry policies → 0 retries. 4 telemetry specs → 0 lines of code. 12 E2E scenarios → no test harness. An entire Security section whose content read "No external-system credentials are required."

---

## 3. Cap the component inventory — and ban capability adjectives

Naming a component in a table is free for the designer and reads as obligatory to the builder. 17 named Main App components became 3 files, and produced two dead, fully-tested helpers along the way.

```text
Component tables: list ONLY components that will be their own source file.
If you cannot commit to it being a separate file, describe it in prose inside
the page/screen it belongs to.

Adjectives that imply machinery are FORBIDDEN unless the demo script
actually exercises them: "searchable", "paginated", "sortable", "filterable",
"with load/error/refresh state", "virtualized", "N-M row pages".
If the demo shows 5 rows, say "renders the full list."
```

Evidence: "paginated table / 25–50 row pages" produced `paginateRows` — built, unit-tested, **never called**. "6-step correlation algorithm" produced `findCorrelatedPendingTask` — built, tested, superseded by a one-line `.find()`. The designed `src/state/` directory was never created.

---

## 4. Make the prompt a first-class design deliverable

The largest under-design in the project: **the agent SDD contained no prompt text at all**, yet the 9 rules invented at build time *are* the demo's correctness logic.

```text
For any LLM/agent component, the design MUST include:
  - The full draft system prompt (not a description of one)
  - The complete rule/enum vocabulary the agent may emit
    (here: the 8 ruleType values and 5 evidenceState values — the design
     enumerated neither)
  - 3-6 concrete eval cases as input → expected behavior, including at
    least one adversarial/injection case
  - An explicit statement of what the agent must NOT do
    (here: "never compute monetary amounts" — this one was designed, and
     it survived as the best idea in the whole set)

Do NOT write: agent retry policies, guardrail tables, typed error channels,
or numeric accuracy SLAs. A low-code agent has nowhere to express them.
```

---

## 5. Specify data types, not just field names

The design listed entity field *names* and zero types, lengths, required-flags, or defaults — 0 of ~45 declarations. It came out nearly right by luck, but two load-bearing constraints were invented blind (`IxpConfidence` max 1; `Variance` as the only signed field, where copying the default `min 0` would have rejected every negative variance).

```text
Every entity field gets: name, platform type, required?, default, and any
min/max/precision/length constraint — in the platform's own notation, not
SQL-style shorthand. This is cheap, mechanical, and prevents silent
data-corruption bugs.
```

This is a case for *more* design, not less.

---

## 6. Force an explicit "component or script?" decision

The costliest single item: `FinancialRulesEvaluator` — 533 lines of Python, a 971-line test suite, a published package, wired into an earlier flow — replaced by an inline script node, with no design or plan document recording the decision.

```text
Before specifying any new deployable component, answer in the SDD:
  "Why is this a separate deployed artifact rather than a script/step
   inside the caller?"
Valid demo answers: it is reused by 2+ callers; it needs a different
runtime; the platform cannot express it inline.
NOT valid for a demo: separation of concerns, testability, future reuse,
architectural cleanliness.

Separation of CONCERNS does not require separation of DEPLOYMENT.
```

Note what to preserve: the *idea* that the LLM proposes and deterministic code disposes was correct and survived. Only the deployment boundary was waste.

---

## 7. Right-size the verification regime to the harness you actually have

19 tasks each with a Validate gate, 13 evaluation classes, 12 E2E scenarios — against 0 flow simulations, 0 E2E harness, and 6 acceptance gates still open at handoff.

```text
Only specify a test if the harness for it already exists in the stack, or
the plan includes a task to add that harness. Name the command that runs it.
For a demo, the default verification set is:
  - unit tests for pure business rules (this project did this well)
  - the agent eval set
  - ONE scripted end-to-end rehearsal of the actual demo narrative
Do not specify accessibility audits, load tests, or E2E matrices without
a harness and an owner.
```

---

## 8. Also constrain the BUILD, not just the design

Over-design was not purely a planning-phase disease — the as-built exceeds the design in ~11 places.

```text
During implementation:
- If you build something the design didn't ask for, say so and why.
- If you abandon something the design DID ask for, record the decision
  in the plan file before moving on.
- Do not add UI affordances the demo script doesn't use.
- Never hardcode a resource id, folder id, or bucket id — even "temporarily."
```

Evidence: the Action App's resizable two-pane layout (~60 lines of drag/persist/clamp) from a design that said only "responsive work area"; the dead `FinalSummary` column; hardcoded `HLS_FOLDER_ID`, bucket ids, and account/project ids in at least four places — directly contradicting the solution SDD's own rule that "Resource identifiers must be configuration or deployment bindings, not runtime constants."

---

## 9. A one-page checklist to paste into the next demo design prompt

```text
DEMO DESIGN CONSTRAINTS

Framing
□ State the demo length, audience, and the story beat each component serves.
□ Any component that doesn't serve a visible beat is cut.

Forbidden sections (omit entirely, not "N/A")
□ error taxonomies · retry/backoff · latency budgets · security/auth
□ rate limits · telemetry · escalation matrices · framework comparisons
□ load tests · E2E matrices · accessibility audit plans
□ Replace all of the above with one "Failure posture" paragraph.

Required and non-negotiable
□ Full draft system prompt for every agent, plus its rule vocabulary
□ 3-6 eval cases incl. one adversarial
□ Full data types for every entity field (platform notation)
□ Explicit negative constraints ("must not…") — these survived best here
□ A named justification for every separately deployed component

Sizing
□ Component tables list only real files. No capability adjectives.
□ Only specify tests whose harness exists; name the command.
□ Mocks get fixtures + contract, nothing else.

Build-time discipline
□ Record any deviation from the design in the plan file, both directions.
□ No hardcoded resource/folder/bucket ids, ever.
```

---

## 10. What NOT to change

Preserve these — the delta analysis shows they worked:

- **Negative constraints and anti-scope.** "No queue", "no REFramework", "no memory required", "Case Management out of scope", "must not call SDK initialization that causes a browser redirect", "must not use naive hostname replacement." Cheap to write, and every one of them held. The two SDK/URL constraints prevented real platform failures.
- **Platform-constraint discovery.** Recognizing that Maestro cannot reach folder-scoped entities, and adding the persistence adapter in response, was the design set's most valuable mid-course correction.
- **Business-rule specification.** The 8 rule types, the Action App's 4 validation rules, partial-update semantics, and the `ExternalRecordId` upsert key were all specified precisely and built exactly.
- **The eval datasets.** 6 agent cases and 9 API cases, built one-for-one with matching IDs. The highest design-effort-to-value ratio in the project.
- **Iterating the SDD when reality pushed back** (v1.0 → v1.6). The revisions improved it.
