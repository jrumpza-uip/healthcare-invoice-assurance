You are a senior UiPath solution designer and demo engineer. Design and build a polished, demo-grade solution called **Healthcare Invoice Assurance**. Do NOT build any UiPath assets yet - treat this as the planning and design phase

## Reference materials

Review these materials before designing the solution:

- Example statement reconciliation PDD from Houston Methodist: <attached>
- Fictional invoice, receipt, contract, and amendment package: <attached>
- UiPath Office of the CFO invoice-processing screenshots or video: <attached>
- Additional architecture requirements: Plan to build this UiPath Maestro Flow using the attached Architecture Review
If an architectural decision is not specified, propose the simplest UiPath architecture that supports a convincing end-to-end demo. Clearly separate business requirements from architectural assumptions.

## Business direction

This should feel like a healthcare-focused variant of UiPath's Office of the CFO invoice-processing solution, but it must not revolve around purchase-order matching.

The broader problem is **financial assurance for complex, exception-heavy hospital invoices**. Hospitals receive invoices and supporting documentation that must be validated against different sources of truth, including:

- Master contracts
- Revised agreements
- Amendments
- Monthly or project-specific addenda
- Rate schedules
- Receipts and equipment records
- Subcontractor invoices
- Cost registers
- Internal policies and approval evidence

The common pattern across the Mayo Clinic and Houston Methodist scenarios is:

1. Receive messy financial documents.
2. Normalize them into a consistent set of records.
3. Evaluate each record against the applicable context and business rules.
4. Surface exceptions with evidence and an explanation.
5. Let people investigate, comment, request information, and supply corrections.
6. Re-evaluate only the affected items.
7. Produce an auditable final disposition.

## Demo objective

Show how UiPath can compress the initial "pre-pencil" review of a complex monthly invoice package from days of manual analysis into an explainable, human-controlled workflow.

The solution should:

- Review 100% of the submitted charges.
- Perform any lookups in external systems (a SQL database or a uipath app that mocks an external application)
- Identify likely exceptions before the first review meeting.
- Create the initial exception log automatically.
- Cite the contract provision or supporting document behind every finding.
- Quantify the potential financial impact.
- Coordinate comments and evidence collection.
- Reassess findings when new evidence or corrections arrive.
- Preserve a complete audit trail.
- Recommend a payable amount without making the final human decision.

Position the solution as **contract-aware invoice assurance**, not as a legal-opinion system. You must NOT use any customer names in the solution. Interview me for anything that is unclear or seems to be contradicting other information in the prompt. 

## Primary users

- Hospital capital-project finance or AP reviewer
- Construction manager or project manager
- Finance approver
- Contractor or subcontractor participant, simulated if external access is outside the demo scope

## Core demo scenario

Use the fictional Lakeshore Regional Health System / Northbridge General Contractors package supplied with this request.

The primary case is invoice `NBG-0726-01` for **$63,024.90**.

The package contains:

- A master construction agreement
- A revised agreement
- Labor, equipment, and evidence amendments
- A July project addendum
- The general-contractor invoice
- Two subcontractor invoices
- Equipment, materials, and meal receipts
- A cost register

The solution must determine the effective contract stack for the July 2026 service period. Later and more specific documents override earlier provisions only for the topics they address.

### Seeded findings

Note that all the extraction and analysis should be real - you must not hardcode the explainable findings.
The initial review should identify these explainable findings:

1. **Carpenter labor-rate exception**

   - Claimed: 160 hours at $130
   - Allowed: 160 hours at $115
   - Potential adjustment: $2,400

2. **Small-tools allowance exception**

   - Claimed: 5% or $1,702.40
   - Contract cap: 3% of $34,048 eligible craft labor, or $1,021.44
   - Potential adjustment: $680.96

3. **Scissor-lift rate exception**

   - Claimed: 10 days at $425
   - Contract cap: 10 days at $375
   - Potential adjustment: $500

4. **Unsupported PPE charge**

   - Claimed: $915
   - An itemized receipt is required but missing
   - Treat as pending evidence rather than fraud or confirmed nonperformance
   - Potential adjustment pending support: $915

5. **Prohibited alcohol**

   - The meal receipt contains $68.50 of alcohol
   - Alcohol is nonreimbursable even if the remainder of the meal is allowable
   - Potential adjustment: $68.50

6. **Invoice-to-register mismatch**

   - Invoice total: $63,024.90
   - Register total: $62,874.90
   - Difference: $150
   - Treat this as a reconciliation exception requiring correction, not an additional contract deduction

The initial potential adjustment should be **$4,564.46**, producing an illustrative payable amount of **$58,460.44**. Do not double-count the $150 register difference.

### Compliant examples

The solution must also recognize compliant charges so the demo does not imply that everything is problematic:

- Electrician straight-time labor at $138 per hour
- Twenty-four overtime hours at the July addendum's approved $207 rate
- The approved $1,248 power-quality testing charge
- Generator and boom-lift charges that meet the equipment schedule
- Supported materials charges
- Properly documented subcontractor invoices

## Required experience

### 1. Portfolio dashboard

Create an opening dashboard that presents invoice-assurance cases rather than ordinary PO invoices.

Show:

- Cases awaiting review
- Invoice amount
- Review deadline or eight-day SLA
- Number and value of open findings
- Cases awaiting evidence
- Cases ready for final disposition
- Finding categories and financial exposure

Use additional fictional cases to make the dashboard feel populated, but the Northbridge case should be the complete interactive scenario.

### 2. Case workspace

The Northbridge case should include:

- Invoice header and supplier/project information
- Submitted amount
- Recommended payable amount
- Open and resolved finding counts
- SLA status
- Current owner
- Activity timeline
- Tabs or views for Review, Charges, Documents, Collaboration, and Audit History

The main review experience should make the following visible together:

- A navigable list of findings
- The relevant invoice, receipt, or contract page
- The extracted charge and calculated comparison
- The governing contract term
- The potential dollar impact
- Reviewer comments, ownership, and next action

Do not make the experience chat-only. An assistant or conversational control can explain findings and answer questions, but the primary interface should be a structured review workspace.

### 3. Contract and amendment library

Provide a contract-library view that:

- Shows the master, revision, amendments, and monthly addendum
- Displays effective dates and document precedence
- Identifies superseded versus currently governing terms
- Supports navigation from a finding to its source provision
- Makes it clear why a particular rate or rule was selected

### 4. Charge normalization

Represent the invoice package as a canonical charge set.

Each charge should include, where applicable:

- Invoice and line identifier
- Category
- Description
- Quantity
- Unit
- Claimed rate
- Claimed amount
- Supplier or subcontractor
- Service period
- Supporting-document references
- Applicable contract term
- Compliance result
- Confidence or review status

Users should be able to move between the normalized charge and the source document.

### 5. Explainable findings

Every finding should contain:

- Finding category
- Invoice page or source location
- Claimed amount
- Allowed amount or rule
- Potential impact
- Plain-language explanation
- Governing document and section
- Supporting evidence reviewed
- Confidence
- Status
- Owner
- Requested action or evidence

The application must distinguish among:

- Confirmed adjustment
- Pending evidence
- Reconciliation issue
- Informational observation
- Compliant charge

### 6. Pre-pencil collaboration

Demonstrate the workflow that happens before and after the pre-pencil meeting.

A reviewer must be able to:

- Add a comment
- Assign a finding to a construction manager
- Request evidence or a correction
- Record a manager response
- Simulate contractor or subcontractor participation
- Upload or select replacement evidence
- Mark a finding ready for re-evaluation
- Preserve the entire exchange in the timeline

At minimum, implement one complete resolution path:

1. The reviewer requests the missing PPE receipt.
2. The manager or contractor supplies evidence.
3. The affected finding is re-evaluated.
4. The status, payable amount, and audit history update.
5. Unrelated findings are not rerun or reset.

Also demonstrate correction of the $150 register mismatch without treating it as a deduction.

### 7. Final disposition

Provide a final review screen showing:

- Submitted amount
- Confirmed adjustments
- Pending items
- Reconciliation-only issues
- Recommended payable amount
- Resolved and unresolved findings
- Approval comments
- Final approver action
- Exportable exception log or disposition summary

The system may recommend an outcome, but a human must perform the final approval.

## Reusable product model

Although the demo focuses on contract compliance, avoid hard-coding the entire product around construction terminology.

Use a reusable conceptual model such as:

- Assurance Case
- Source Document
- Governing Rule or Context
- Financial Record or Charge
- Finding
- Evidence Request
- Human Decision
- Audit Event

The validation logic should be replaceable or configurable so another healthcare scenario could compare statement lines against payment-system results instead of comparing invoice charges against contracts.

## Architecture

`[INSERT DESIRED UIPATH PRODUCTS, DEPLOYMENT MODEL, AUTHENTICATION APPROACH, DATA STORAGE, AGENT MODEL, AND INTEGRATION DETAILS HERE]`

If this section is left blank:

- Recommend a minimal demo-grade UiPath architecture.
- Prefer a coherent end-to-end demonstration over unnecessary production complexity.
- Keep document extraction, contract reasoning, deterministic calculations, human tasks, and the user interface behind clear boundaries.
- Make the deterministic financial calculations independently testable.
- Permit mocked adapters where live systems are unavailable.
- Clearly label mocked behavior.
- Do not require a live ERP or hospital system for the core demo.

## UX direction

Take visual cues from the UiPath Office of the CFO invoice-processing experience:

- Professional financial-workbench appearance
- Dark navy, white, restrained teal, and selective orange accents
- Clear hierarchy and readable financial values
- Finding cards with severity and status
- Activity timeline
- AI-generated explanations presented alongside source evidence
- Minimal clutter and no excessive gradients or decorative effects

The experience should feel credible to a hospital finance leader and recognizable as a UiPath solution, while being purpose-built for contract assurance rather than PO matching.

## Demo constraints

- Use only fictional organizations, people, invoices, and contracts.
- Display a fictional-demo-data notice where appropriate.
- Do not include PHI.
- Do not characterize findings as fraud.
- Do not make legal conclusions.
- Do not implement PO matching as the primary validation mechanism.
- ERP posting, live supplier email, and production-grade identity integration are out of scope unless explicitly added in the architecture section.
- Optimize for a reliable 8-10 minute sales demonstration.

## Deliverables

Produce:

1. A concise solution design and architecture summary
2. A working demo application
3. Seeded data based on the supplied document package
4. A repeatable demo reset or seed mechanism
5. A README with setup and run instructions
6. A short demo script
7. Tests for:
   - Contract precedence
   - Rate and allowance calculations
   - Register reconciliation
   - Finding-state transitions
   - Re-evaluation after evidence is added
8. A list of mocked integrations and what would replace them in a production implementation

## Acceptance criteria

The demo is complete when:

- It can be launched from a clean setup using documented steps.
- The Northbridge case produces the expected findings and calculations.
- Every finding links to an understandable source rule or evidence document.
- Compliant and noncompliant charges are both represented.
- A user can complete the PPE evidence-resolution path.
- The register mismatch can be corrected without changing the contract-adjustment total.
- Amounts and finding counts update consistently across the case.
- The timeline records human and automated actions.
- No primary button is decorative or leads to a dead end.
- The core narrative can be demonstrated reliably in under ten minutes.
- The architecture can later accommodate other hospital financial-assurance scenarios.

## Working approach

Before implementation:

1. Inspect the existing repository and all supplied reference files.
2. Restate the proposed demo design and any assumptions.
3. Identify which functionality will be real, simulated, or mocked.
4. Propose the smallest architecture that satisfies the demo.
5. Create an implementation plan with testable milestones.

Then build and verify the demo. Make reasonable demo-grade assumptions rather than stopping for minor clarifications, but flag any decision that would materially change the product surface or architecture.
