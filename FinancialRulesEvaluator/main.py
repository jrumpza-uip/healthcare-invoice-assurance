from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Literal

from pydantic import BaseModel, Field
from uipath.tracing import traced


MONEY = Decimal("0.01")
TRACE_VERSION = "1.0"
REQUIRED_OPERANDS = {
    "LaborRateLimit": ("maxRate",),
    "PercentageCap": ("percentage", "eligibleSubmittedBase"),
    "EquipmentUnitCap": ("maxUnitRate",),
    "EvidenceRequirement": ("requiredEvidenceTypes", "amountThreshold"),
}
NUMERIC_OPERANDS = {
    "LaborRateLimit": ("maxRate",),
    "OvertimeRule": ("explicitRate", "straightTimeRate", "multiplier"),
    "PercentageCap": ("percentage", "eligibleSubmittedBase"),
    "EquipmentUnitCap": ("maxUnitRate",),
    "EvidenceRequirement": ("amountThreshold",),
}


def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY, rounding=ROUND_HALF_UP)


class Charge(BaseModel):
    chargeId: str
    category: str
    description: str = ""
    serviceDate: str | None = None
    quantity: Decimal = Decimal("0")
    unit: str = ""
    unitRate: Decimal = Decimal("0")
    submittedAmount: Decimal
    evidenceTypes: list[str] = Field(default_factory=list)


class Rule(BaseModel):
    ruleId: str
    ruleType: str
    scope: dict[str, Any] = Field(default_factory=dict)
    operands: dict[str, Any] = Field(default_factory=dict)
    effectivePeriod: dict[str, Any] = Field(default_factory=dict)
    sourceDocumentId: str
    sourceClause: str
    confidence: Decimal = Decimal("0")


class FindingProposal(BaseModel):
    findingId: str
    chargeId: str
    ruleId: str
    evidenceState: str = ""


class Input(BaseModel):
    correlationId: str
    invoiceRecordId: str
    analysisVersion: int
    mode: Literal["initial", "targeted"]
    currency: str
    invoiceSubmittedTotal: Decimal
    canonicalCharges: list[Charge]
    normalizedRules: list[Rule]
    proposedFindings: list[FindingProposal]
    reconciliationResult: dict[str, Any]
    previousSnapshot: dict[str, Any] | None = None
    changedFindingIds: list[str] = Field(default_factory=list)


class AuthoritativeFinding(BaseModel):
    findingId: str
    chargeId: str
    ruleId: str
    ruleType: str
    status: str
    submittedAmount: Decimal
    allowedAmount: Decimal
    adjustment: Decimal
    sourceDocumentId: str
    sourceClause: str


class CalculationLine(BaseModel):
    findingId: str
    chargeId: str
    ruleId: str
    ruleType: str
    operands: dict[str, Any]
    submittedAmount: Decimal
    allowedAmount: Decimal
    adjustment: Decimal
    trace: list[str]


class FinancialSnapshot(BaseModel):
    submittedTotal: Decimal
    totalAdjustment: Decimal
    proposedPayable: Decimal
    currency: str
    version: int


class ReconciliationState(BaseModel):
    invoiceRegisterStatus: str = ""
    invoiceTotal: Decimal | None = None
    registerTotal: Decimal | None = None
    invoiceRegisterVariance: Decimal | None = None
    supportingDocumentComparisons: list[dict[str, Any]] = Field(default_factory=list)


class Output(BaseModel):
    status: Literal["valid", "invalid", "technicalError"]
    authoritativeFindings: list[AuthoritativeFinding] = Field(default_factory=list)
    calculationLines: list[CalculationLine] = Field(default_factory=list)
    financialSnapshot: FinancialSnapshot | None = None
    reconciliationState: ReconciliationState = Field(default_factory=ReconciliationState)
    validationErrors: list[dict[str, Any]] = Field(default_factory=list)
    preservedFindingIds: list[str] = Field(default_factory=list)
    traceVersion: str = TRACE_VERSION
    errorType: str = ""
    errorMessage: str = ""


@traced(name="financial_rules_evaluator", run_type="uipath")
def financial_rules_evaluator(input: Input) -> Output:
    try:
        if (
            input.invoiceSubmittedTotal < 0
            or any(
                charge.submittedAmount < 0
                or charge.quantity < 0
                or charge.unitRate < 0
                for charge in input.canonicalCharges
            )
        ):
            return Output(
                status="invalid",
                validationErrors=[
                    {
                        "errorType": "INVALID_INPUT",
                        "field": "financialAmounts",
                        "message": "Invoice, charge, quantity, and rate values cannot be negative",
                    }
                ],
                errorType="INVALID_INPUT",
                errorMessage="Financial input contains a negative value",
            )

        charge_ids = [charge.chargeId for charge in input.canonicalCharges]
        if len(charge_ids) != len(set(charge_ids)):
            return Output(
                status="invalid",
                validationErrors=[
                    {
                        "errorType": "INVALID_INPUT",
                        "field": "canonicalCharges",
                        "message": "Canonical charge identifiers must be unique",
                    }
                ],
                errorType="INVALID_INPUT",
                errorMessage="Canonical charges contain duplicate identifiers",
            )
        charge_total = money(
            sum(
                (charge.submittedAmount for charge in input.canonicalCharges),
                Decimal("0"),
            )
        )
        invoice_total = money(input.invoiceSubmittedTotal)
        if charge_total != invoice_total:
            return Output(
                status="invalid",
                validationErrors=[
                    {
                        "errorType": "TOTAL_MISMATCH",
                        "chargeTotal": str(charge_total),
                        "invoiceSubmittedTotal": str(invoice_total),
                        "message": "Canonical charge total does not match invoice total",
                    }
                ],
                errorType="TOTAL_MISMATCH",
                errorMessage="Canonical charges do not reconcile to the invoice total",
            )
        if input.mode == "targeted":
            proposed_ids = {
                proposal.findingId for proposal in input.proposedFindings
            }
            changed_ids = set(input.changedFindingIds)
            if input.previousSnapshot is None or not changed_ids:
                return Output(
                    status="invalid",
                    validationErrors=[
                        {
                            "errorType": "INVALID_INPUT",
                            "field": "previousSnapshot/changedFindingIds",
                            "message": "Targeted mode requires a prior snapshot and changed finding IDs",
                        }
                    ],
                    errorType="INVALID_INPUT",
                    errorMessage="Targeted evaluation context is incomplete",
                )
            outside_scope = sorted(proposed_ids - changed_ids)
            if outside_scope:
                return Output(
                    status="invalid",
                    validationErrors=[
                        {
                            "errorType": "TARGET_SCOPE_VIOLATION",
                            "findingIds": outside_scope,
                            "message": "Targeted request contains findings outside changedFindingIds",
                        }
                    ],
                    errorType="TARGET_SCOPE_VIOLATION",
                    errorMessage="Targeted evaluation attempted to widen its scope",
                )

        for rule in input.normalizedRules:
            if not rule.sourceDocumentId.strip() or not rule.sourceClause.strip():
                return Output(
                    status="invalid",
                    validationErrors=[
                        {
                            "errorType": "UNGROUNDED_RULE",
                            "ruleId": rule.ruleId,
                            "message": "Rule requires a source document and clause citation",
                        }
                    ],
                    errorType="UNGROUNDED_RULE",
                    errorMessage="A normalized rule is missing its governing citation",
                )
            missing_operands = [
                operand
                for operand in REQUIRED_OPERANDS.get(rule.ruleType, ())
                if operand not in rule.operands
            ]
            if rule.ruleType == "OvertimeRule" and "explicitRate" not in rule.operands:
                missing_operands.extend(
                    operand
                    for operand in ("straightTimeRate", "multiplier")
                    if operand not in rule.operands
                )
            if missing_operands:
                operand = missing_operands[0]
                return Output(
                    status="invalid",
                    validationErrors=[
                        {
                            "errorType": "MISSING_OPERAND",
                            "ruleId": rule.ruleId,
                            "operand": operand,
                            "sourceDocumentId": rule.sourceDocumentId,
                            "sourceClause": rule.sourceClause,
                            "message": f"Required operand is missing: {operand}",
                        }
                    ],
                    errorType="MISSING_OPERAND",
                    errorMessage=f"Rule {rule.ruleId} is missing a required operand",
                )
            for operand in NUMERIC_OPERANDS.get(rule.ruleType, ()):
                if operand not in rule.operands:
                    continue
                try:
                    operand_value = Decimal(str(rule.operands[operand]))
                except (InvalidOperation, TypeError, ValueError):
                    operand_value = Decimal("-1")
                if not operand_value.is_finite() or operand_value < 0:
                    return Output(
                        status="invalid",
                        validationErrors=[
                            {
                                "errorType": "INVALID_INPUT",
                                "field": f"operands.{operand}",
                                "ruleId": rule.ruleId,
                                "message": "Rule operand must be a non-negative finite decimal",
                            }
                        ],
                        errorType="INVALID_INPUT",
                        errorMessage=f"Rule {rule.ruleId} has an invalid numeric operand",
                    )

        charges = {charge.chargeId: charge for charge in input.canonicalCharges}
        rules = {rule.ruleId: rule for rule in input.normalizedRules}
        for proposal in input.proposedFindings:
            if proposal.chargeId not in charges:
                return Output(
                    status="invalid",
                    validationErrors=[
                        {
                            "errorType": "INVALID_INPUT",
                            "field": "chargeId",
                            "findingId": proposal.findingId,
                            "message": "Finding references an unknown canonical charge",
                        }
                    ],
                    errorType="INVALID_INPUT",
                    errorMessage="A proposed finding has an unknown charge reference",
                )
            if proposal.ruleId not in rules:
                return Output(
                    status="invalid",
                    validationErrors=[
                        {
                            "errorType": "INVALID_INPUT",
                            "field": "ruleId",
                            "findingId": proposal.findingId,
                            "message": "Finding references an unknown normalized rule",
                        }
                    ],
                    errorType="INVALID_INPUT",
                    errorMessage="A proposed finding has an unknown rule reference",
                )
        findings: list[AuthoritativeFinding] = []
        lines: list[CalculationLine] = []
        preserved_finding_ids: list[str] = []

        for proposal in input.proposedFindings:
            charge = charges[proposal.chargeId]
            rule = rules[proposal.ruleId]
            submitted = money(charge.submittedAmount)

            if rule.ruleType not in {
                "CategoryExclusion",
                "LaborRateLimit",
                "OvertimeRule",
                "PercentageCap",
                "EquipmentUnitCap",
                "EvidenceRequirement",
                "InvoiceRegisterTieOut",
                "SupportingDocumentTieOut",
            }:
                return Output(
                    status="invalid",
                    validationErrors=[
                        {
                            "errorType": "UNSUPPORTED_RULE",
                            "ruleId": rule.ruleId,
                            "message": f"Unsupported rule type: {rule.ruleType}",
                        }
                    ],
                    errorType="UNSUPPORTED_RULE",
                    errorMessage=f"Unsupported rule type: {rule.ruleType}",
                )

            categories = {
                str(category).strip().casefold()
                for category in rule.scope.get("categories", [])
            }
            category_matches = charge.category.strip().casefold() in categories
            period_matches = True
            if charge.serviceDate:
                period_start = str(rule.effectivePeriod.get("start", "")).strip()
                period_end = str(rule.effectivePeriod.get("end", "")).strip()
                if period_start and charge.serviceDate < period_start:
                    period_matches = False
                if period_end and charge.serviceDate > period_end:
                    period_matches = False
            applies = category_matches and period_matches
            trace: list[str]
            if rule.ruleType == "CategoryExclusion":
                allowed = Decimal("0.00") if applies else submitted
                status = "excluded" if applies else "allowed"
                trace = [
                    "matched charge category to rule scope",
                    "allowed = 0 when the exclusion applies",
                    "adjustment = submitted - allowed",
                ]
            elif rule.ruleType == "LaborRateLimit":
                max_rate = Decimal(str(rule.operands["maxRate"]))
                capped_amount = money(charge.quantity * max_rate)
                allowed = min(submitted, capped_amount) if applies else submitted
                status = "rateCapped" if allowed < submitted else "allowed"
                trace = [
                    "matched charge category to rule scope",
                    "cap = quantity * maxRate",
                    "allowed = minimum of submitted and cap",
                    "adjustment = submitted - allowed",
                ]
            elif rule.ruleType == "OvertimeRule":
                if "explicitRate" in rule.operands:
                    overtime_rate = Decimal(str(rule.operands["explicitRate"]))
                    rate_trace = "overtimeRate = explicitRate"
                else:
                    straight_rate = Decimal(str(rule.operands["straightTimeRate"]))
                    multiplier = Decimal(str(rule.operands["multiplier"]))
                    overtime_rate = straight_rate * multiplier
                    rate_trace = "overtimeRate = straightTimeRate * multiplier"
                capped_amount = money(charge.quantity * overtime_rate)
                allowed = min(submitted, capped_amount) if applies else submitted
                status = "overtimeCapped" if allowed < submitted else "allowed"
                trace = [
                    "matched charge category to rule scope",
                    rate_trace,
                    "cap = quantity * overtimeRate",
                    "allowed = minimum of submitted and cap",
                    "adjustment = submitted - allowed",
                ]
            elif rule.ruleType == "PercentageCap":
                percentage = Decimal(str(rule.operands["percentage"]))
                eligible_base = Decimal(
                    str(rule.operands["eligibleSubmittedBase"])
                )
                capped_amount = money(eligible_base * percentage)
                allowed = min(submitted, capped_amount) if applies else submitted
                status = "percentageCapped" if allowed < submitted else "allowed"
                trace = [
                    "matched charge category to rule scope",
                    "cap = eligibleSubmittedBase * percentage",
                    "allowed = minimum of submitted and cap",
                    "adjustment = submitted - allowed",
                ]
            elif rule.ruleType == "EquipmentUnitCap":
                max_unit_rate = Decimal(str(rule.operands["maxUnitRate"]))
                capped_amount = money(charge.quantity * max_unit_rate)
                allowed = min(submitted, capped_amount) if applies else submitted
                status = "unitCapped" if allowed < submitted else "allowed"
                trace = [
                    "matched charge category to rule scope",
                    "cap = quantity * maxUnitRate",
                    "allowed = minimum of submitted and cap",
                    "adjustment = submitted - allowed",
                ]
            elif rule.ruleType == "EvidenceRequirement":
                threshold = Decimal(str(rule.operands["amountThreshold"]))
                required_types = {
                    str(value).strip().casefold()
                    for value in rule.operands["requiredEvidenceTypes"]
                }
                supplied_types = {
                    value.strip().casefold() for value in charge.evidenceTypes
                }
                evidence_valid = (
                    proposal.evidenceState.strip().casefold() == "valid"
                    and required_types.issubset(supplied_types)
                )
                evidence_required = applies and submitted >= threshold
                allowed = (
                    Decimal("0.00")
                    if evidence_required and not evidence_valid
                    else submitted
                )
                status = (
                    "pendingEvidence"
                    if evidence_required and not evidence_valid
                    else "allowed"
                )
                trace = [
                    "matched charge category to rule scope",
                    "evidence is required when submitted meets amountThreshold",
                    "required evidence types must be present with a valid evidence state",
                    "adjustment = submitted - allowed",
                ]
            else:
                allowed = submitted
                status = "reconciliationRecorded"
                trace = [
                    "read the structured reconciliation result",
                    "recorded variance as a non-monetary reconciliation state",
                    "reconciliation variance does not imply a deduction",
                    "adjustment = 0",
                ]
            adjustment = money(submitted - allowed)

            findings.append(
                AuthoritativeFinding(
                    findingId=proposal.findingId,
                    chargeId=charge.chargeId,
                    ruleId=rule.ruleId,
                    ruleType=rule.ruleType,
                    status=status,
                    submittedAmount=submitted,
                    allowedAmount=money(allowed),
                    adjustment=adjustment,
                    sourceDocumentId=rule.sourceDocumentId,
                    sourceClause=rule.sourceClause,
                )
            )
            lines.append(
                CalculationLine(
                    findingId=proposal.findingId,
                    chargeId=charge.chargeId,
                    ruleId=rule.ruleId,
                    ruleType=rule.ruleType,
                    operands=rule.operands,
                    submittedAmount=submitted,
                    allowedAmount=money(allowed),
                    adjustment=adjustment,
                    trace=trace,
                )
            )

        if input.mode == "targeted" and input.previousSnapshot is not None:
            changed_ids = set(input.changedFindingIds)
            for previous in input.previousSnapshot.get("authoritativeFindings", []):
                finding = AuthoritativeFinding(**previous)
                if finding.findingId not in changed_ids:
                    findings.append(finding)
                    preserved_finding_ids.append(finding.findingId)

        adjustment_by_charge: dict[str, Decimal] = {}
        for finding in findings:
            current = adjustment_by_charge.get(finding.chargeId, Decimal("0"))
            adjustment_by_charge[finding.chargeId] = max(current, finding.adjustment)
        total_adjustment = money(
            sum(adjustment_by_charge.values(), Decimal("0"))
        )
        submitted_total = money(input.invoiceSubmittedTotal)
        snapshot = FinancialSnapshot(
            submittedTotal=submitted_total,
            totalAdjustment=total_adjustment,
            proposedPayable=money(submitted_total - total_adjustment),
            currency=input.currency,
            version=input.analysisVersion,
        )
        return Output(
            status="valid",
            authoritativeFindings=findings,
            calculationLines=lines,
            financialSnapshot=snapshot,
            reconciliationState=ReconciliationState(**input.reconciliationResult),
            preservedFindingIds=preserved_finding_ids,
        )
    except Exception:
        return Output(
            status="technicalError",
            errorType="UNEXPECTED_FAILURE",
            errorMessage="Financial evaluation failed unexpectedly",
        )
