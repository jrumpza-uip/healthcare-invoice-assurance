import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflowPath = new URL(
  "../HealthcareInvoiceAssurance/ProjectCostLookupApi/Workflow.json",
  import.meta.url,
);

function evaluateLookup(input) {
  const workflow = JSON.parse(readFileSync(workflowPath, "utf8"));
  const activities = workflow.do?.[0]?.Sequence_1?.do ?? [];
  const evaluator = activities.find((activity) => activity.Javascript_EvaluateLookup)
    ?.Javascript_EvaluateLookup;

  assert.ok(evaluator, "Workflow must contain Javascript_EvaluateLookup");
  const execute = new Function(
    "$workflow",
    "$context",
    "$input",
    evaluator.run.script.code,
  );
  return execute(
    { input, definition: workflow },
    { variables: {}, outputs: {} },
    input,
  );
}

function canonicalInput(overrides = {}) {
  return {
    correlationId: "corr-api-test",
    invoiceRecordId: "11111111-1111-4111-8111-111111111111",
    contractProfileId: "profile-west-pavilion",
    accountId: "account-lakeshore-regional-health-system",
    projectId: "project-west-pavilion-renovation",
    supplier: { name: "Northbridge General Contractors" },
    invoice: {
      number: "NBG 0726 01",
      date: "2026-07-31",
      total: 63024.9,
      currency: "USD",
    },
    register: {
      total: 63024.9,
      lines: [
        {
          lineId: "register-apex",
          supplier: "Apex Electrical",
          invoiceNumber: "AE-7742",
          amount: 5000,
        },
      ],
    },
    supportingInvoices: [
      {
        documentId: "support-apex",
        supplier: { name: "Apex Electrical" },
        invoice: { number: "AE-7742", total: 5000, currency: "USD" },
      },
    ],
    ...overrides,
  };
}

test("API-01 finds the approved project and normalized invoice variant with a tied register", () => {
  const result = evaluateLookup(canonicalInput());

  assert.equal(result.searchStatus, "Found");
  assert.equal(result.projectMatch.matched, true);
  assert.equal(result.supplierMatch.matched, true);
  assert.equal(result.invoiceRecord.externalRecordId, "cost-invoice-nbg-0726-01");
  assert.deepEqual(result.invoiceRegisterComparison, {
    status: "Tied",
    invoiceTotal: 63024.9,
    registerTotal: 63024.9,
    variance: 0,
  });
  assert.equal(result.supportingDocumentComparisons[0].status, "Matched");
  assert.equal(result.errorType, "");
});

test("API-02 reports the exact input-derived register variance", () => {
  const input = canonicalInput({
    register: { total: 62874.9, lines: [] },
    supportingInvoices: [],
  });

  const result = evaluateLookup(input);

  assert.equal(result.searchStatus, "Found");
  assert.equal(result.invoiceRegisterComparison.status, "Variance");
  assert.equal(result.invoiceRegisterComparison.variance, 150);
});

test("API-03 keeps completed project and register facts when the invoice record is not found", () => {
  const input = canonicalInput({
    invoice: { number: "UNLISTED-2026-009", total: 900, currency: "USD" },
    register: { total: 875, lines: [] },
    supportingInvoices: [],
  });

  const result = evaluateLookup(input);

  assert.equal(result.searchStatus, "NotFound");
  assert.equal(result.projectMatch.matched, true);
  assert.equal(result.supplierMatch.matched, true);
  assert.equal(result.invoiceRecord, null);
  assert.equal(result.invoiceRegisterComparison.variance, 25);
  assert.equal(result.errorType, "InvoiceNotFound");
});

test("API-04 returns SearchIncomplete when the approved outage switch is true", () => {
  const result = evaluateLookup(
    canonicalInput({ simulateSearchUnavailable: true }),
  );

  assert.equal(result.searchStatus, "SearchIncomplete");
  assert.equal(result.errorType, "SearchUnavailable");
  assert.equal(result.projectMatch.matched, true);
  assert.deepEqual(result.searchesAttempted, ["project-profile"]);
  assert.equal(result.warnings[0].retryable, true);
});

test("API-05 derives comparisons from a different supported invoice instead of fixture totals", () => {
  const input = canonicalInput({
    invoice: { number: "NBG-0826-17", total: 1200, currency: "USD" },
    register: { total: 1100, lines: [] },
    supportingInvoices: [],
  });

  const result = evaluateLookup(input);

  assert.equal(result.searchStatus, "NotFound");
  assert.equal(result.invoiceRegisterComparison.invoiceTotal, 1200);
  assert.equal(result.invoiceRegisterComparison.registerTotal, 1100);
  assert.equal(result.invoiceRegisterComparison.variance, 100);
});

test("API-E1 rejects a missing project identifier before attempting a search", () => {
  const result = evaluateLookup(canonicalInput({ projectId: "" }));

  assert.equal(result.searchStatus, "SearchIncomplete");
  assert.equal(result.errorType, "ValidationError");
  assert.deepEqual(result.searchesAttempted, []);
  assert.match(result.errorMessage, /projectId/);
});

test("API-E2 rejects a malformed invoice decimal before attempting a comparison", () => {
  const input = canonicalInput({
    invoice: { number: "NBG-0726-01", total: "not-a-decimal", currency: "USD" },
  });

  const result = evaluateLookup(input);

  assert.equal(result.errorType, "ValidationError");
  assert.deepEqual(result.searchesAttempted, []);
  assert.equal(result.invoiceRegisterComparison.status, "NotCompared");
});

test("API-E3 rejects duplicate register line identifiers", () => {
  const input = canonicalInput({
    register: {
      total: 10,
      lines: [
        { lineId: "duplicate", invoiceNumber: "A", amount: 5 },
        { lineId: "duplicate", invoiceNumber: "B", amount: 5 },
      ],
    },
    supportingInvoices: [],
  });

  const result = evaluateLookup(input);

  assert.equal(result.errorType, "ValidationError");
  assert.match(result.errorMessage, /duplicate register line IDs/i);
});

test("API-E4 records missing supporting invoices without turning them into technical failures", () => {
  const input = canonicalInput({ supportingInvoices: [] });

  const result = evaluateLookup(input);

  assert.equal(result.searchStatus, "Found");
  assert.equal(result.errorType, "");
  assert.equal(
    result.supportingDocumentComparisons[0].status,
    "MissingSupportingInvoice",
  );
});

test("repeating the same lookup is deterministic", () => {
  const input = canonicalInput();

  assert.deepEqual(evaluateLookup(input), evaluateLookup(input));
});
