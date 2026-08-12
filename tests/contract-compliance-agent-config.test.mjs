import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const agentPath = new URL(
  "../HealthcareInvoiceAssurance/ContractComplianceAgent/agent.json",
  import.meta.url,
);
const evalSetPath = new URL(
  "../HealthcareInvoiceAssurance/ContractComplianceAgent/evals/eval-sets/evaluation-set-default.json",
  import.meta.url,
);
const outputEvaluatorPath = new URL(
  "../HealthcareInvoiceAssurance/ContractComplianceAgent/evals/evaluators/evaluator-default.json",
  import.meta.url,
);

const agent = JSON.parse(readFileSync(agentPath, "utf8"));
const evalSet = JSON.parse(readFileSync(evalSetPath, "utf8"));
const outputEvaluator = JSON.parse(
  readFileSync(outputEvaluatorPath, "utf8"),
);

function evaluation(name) {
  const found = evalSet.evaluations.find((candidate) => candidate.name === name);
  assert.ok(found, `Missing evaluation case ${name}`);
  return found;
}

test("A-01 supplies the complete eligible craft-labor base used by its oracle", () => {
  const a01 = evaluation("A-01-canonical-grounded-analysis");
  const eligibleBase = a01.inputs.canonicalCharges
    .filter((charge) =>
      ["carpenter-labor", "eligible-craft-labor"].includes(charge.category),
    )
    .reduce((total, charge) => total + charge.submittedAmount, 0);

  assert.equal(eligibleBase, 34048);
});

test("A-01 supplies the complete equipment evidence assumed by its oracle", () => {
  const a01 = evaluation("A-01-canonical-grounded-analysis");
  const scissorLift = a01.inputs.canonicalCharges.find(
    (charge) => charge.chargeId === "charge-scissor-lift",
  );

  assert.ok(scissorLift, "A-01 is missing the scissor-lift charge");
  assert.deepEqual(scissorLift.evidenceTypes, [
    "rental-invoice-or-ownership-log",
    "operating-dates",
  ]);
});

test("evaluation findings use only evidence states accepted by the agent output schema", () => {
  const allowedStates = new Set(
    agent.outputSchema.properties.proposedFindings.items.properties.evidenceState
      .enum,
  );

  for (const candidate of evalSet.evaluations) {
    for (const finding of candidate.expectedOutput.proposedFindings) {
      assert.ok(
        allowedStates.has(finding.evidenceState),
        `${candidate.name} uses unsupported evidenceState ${finding.evidenceState}`,
      );
    }
  }
});

test("grounded-output judge treats fixture source identifiers as semantic placeholders", () => {
  assert.match(
    outputEvaluator.prompt,
    /indexed-contract-source.*placeholder/i,
  );
  assert.match(
    outputEvaluator.prompt,
    /do not penalize.*real indexed document/i,
  );
  assert.match(
    outputEvaluator.prompt,
    /nested scope and operand fields.*semantically equivalent/i,
  );
});
