import importlib.util
import copy
import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = PROJECT_ROOT / "main.py"


def load_evaluator_module():
    if not MODULE_PATH.exists():
        raise AssertionError(
            "FinancialRulesEvaluator/main.py is missing; the evaluator behavior is not implemented"
        )

    spec = importlib.util.spec_from_file_location("financial_rules_evaluator", MODULE_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("FinancialRulesEvaluator/main.py could not be loaded")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def base_payload() -> dict:
    return {
        "correlationId": "corr-category-exclusion",
        "invoiceRecordId": "invoice-record-category-exclusion",
        "analysisVersion": 1,
        "mode": "initial",
        "currency": "USD",
        "invoiceSubmittedTotal": "100.00",
        "canonicalCharges": [
            {
                "chargeId": "charge-alcohol",
                "category": "alcohol",
                "description": "Explicit alcoholic beverage",
                "serviceDate": "2026-07-25",
                "quantity": "1",
                "unit": "item",
                "unitRate": "100.00",
                "submittedAmount": "100.00",
                "evidenceTypes": [],
            }
        ],
        "normalizedRules": [
            {
                "ruleId": "rule-category-exclusion",
                "ruleType": "CategoryExclusion",
                "scope": {"categories": ["alcohol"]},
                "operands": {},
                "effectivePeriod": {
                    "start": "2026-01-01",
                    "end": "2026-12-31",
                },
                "sourceDocumentId": "contract-document",
                "sourceClause": "Category exclusions",
                "confidence": "0.99",
            }
        ],
        "proposedFindings": [
            {
                "findingId": "finding-category-exclusion",
                "chargeId": "charge-alcohol",
                "ruleId": "rule-category-exclusion",
                "evidenceState": "notRequired",
            }
        ],
        "reconciliationResult": {
            "invoiceRegisterStatus": "Tied",
            "invoiceTotal": "100.00",
            "registerTotal": "100.00",
            "supportingDocumentComparisons": [],
        },
        "previousSnapshot": None,
        "changedFindingIds": [],
    }


def canonical_oracle_payload() -> dict:
    charges = [
        {
            "chargeId": "charge-carpenter",
            "category": "carpenter-labor",
            "quantity": "160",
            "unit": "hour",
            "unitRate": "130.00",
            "submittedAmount": "20800.00",
        },
        {
            "chargeId": "charge-small-tools",
            "category": "small-tools",
            "submittedAmount": "1702.40",
        },
        {
            "chargeId": "charge-scissor-lift",
            "category": "scissor-lift",
            "quantity": "10",
            "unit": "day",
            "unitRate": "425.00",
            "submittedAmount": "4250.00",
        },
        {
            "chargeId": "charge-ppe",
            "category": "ppe",
            "submittedAmount": "915.00",
            "evidenceTypes": [],
        },
        {
            "chargeId": "charge-alcohol",
            "category": "alcohol",
            "submittedAmount": "68.50",
        },
        {
            "chargeId": "charge-compliant-remainder",
            "category": "compliant",
            "submittedAmount": "35289.00",
        },
    ]
    rules = [
        {
            "ruleId": "rule-carpenter-rate",
            "ruleType": "LaborRateLimit",
            "scope": {"categories": ["carpenter-labor"]},
            "operands": {"maxRate": "115.00"},
            "sourceDocumentId": "contract-document",
            "sourceClause": "Labor rate schedule",
        },
        {
            "ruleId": "rule-small-tools-cap",
            "ruleType": "PercentageCap",
            "scope": {"categories": ["small-tools"]},
            "operands": {
                "percentage": "0.03",
                "eligibleSubmittedBase": "34048.00",
            },
            "sourceDocumentId": "contract-document",
            "sourceClause": "Small tools cap",
        },
        {
            "ruleId": "rule-scissor-lift-cap",
            "ruleType": "EquipmentUnitCap",
            "scope": {"categories": ["scissor-lift"]},
            "operands": {"maxUnitRate": "375.00"},
            "sourceDocumentId": "contract-document",
            "sourceClause": "Equipment rate schedule",
        },
        {
            "ruleId": "rule-ppe-evidence",
            "ruleType": "EvidenceRequirement",
            "scope": {"categories": ["ppe"]},
            "operands": {
                "requiredEvidenceTypes": ["itemized-receipt"],
                "amountThreshold": "1.00",
            },
            "sourceDocumentId": "contract-document",
            "sourceClause": "PPE evidence requirement",
        },
        {
            "ruleId": "rule-alcohol-exclusion",
            "ruleType": "CategoryExclusion",
            "scope": {"categories": ["alcohol"]},
            "operands": {},
            "sourceDocumentId": "contract-document",
            "sourceClause": "Alcohol exclusion",
        },
    ]
    findings = [
        {
            "findingId": "finding-carpenter-rate",
            "chargeId": "charge-carpenter",
            "ruleId": "rule-carpenter-rate",
        },
        {
            "findingId": "finding-small-tools-cap",
            "chargeId": "charge-small-tools",
            "ruleId": "rule-small-tools-cap",
        },
        {
            "findingId": "finding-scissor-lift-cap",
            "chargeId": "charge-scissor-lift",
            "ruleId": "rule-scissor-lift-cap",
        },
        {
            "findingId": "finding-ppe-evidence",
            "chargeId": "charge-ppe",
            "ruleId": "rule-ppe-evidence",
            "evidenceState": "missing",
        },
        {
            "findingId": "finding-alcohol-exclusion",
            "chargeId": "charge-alcohol",
            "ruleId": "rule-alcohol-exclusion",
        },
    ]
    return {
        "correlationId": "canonical-oracle-correlation",
        "invoiceRecordId": "canonical-oracle-record",
        "analysisVersion": 1,
        "mode": "initial",
        "currency": "USD",
        "invoiceSubmittedTotal": "63024.90",
        "canonicalCharges": charges,
        "normalizedRules": rules,
        "proposedFindings": findings,
        "reconciliationResult": {
            "invoiceRegisterStatus": "Variance",
            "invoiceTotal": "63024.90",
            "registerTotal": "62874.90",
            "invoiceRegisterVariance": "150.00",
            "supportingDocumentComparisons": [],
        },
        "previousSnapshot": None,
        "changedFindingIds": [],
    }


class FinancialRulesEvaluatorTests(unittest.TestCase):
    def test_category_exclusion_removes_the_matching_charge(self) -> None:
        """Catches a missing exclusion handler or a reversed adjustment sign."""
        evaluator = load_evaluator_module()

        result = evaluator.financial_rules_evaluator(evaluator.Input(**base_payload()))

        self.assertEqual(result.status, "valid")
        self.assertEqual(len(result.authoritativeFindings), 1)
        self.assertEqual(
            result.authoritativeFindings[0].findingId,
            "finding-category-exclusion",
        )
        self.assertEqual(result.authoritativeFindings[0].adjustment, Decimal("100.00"))
        self.assertEqual(result.financialSnapshot.totalAdjustment, Decimal("100.00"))
        self.assertEqual(result.financialSnapshot.proposedPayable, Decimal("0.00"))
        self.assertEqual(result.errorType, "")

    def test_labor_rate_limit_uses_quantity_and_the_declared_rate_cap(self) -> None:
        """Catches a missing labor cap, wrong quantity basis, or reversed subtraction."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["invoiceSubmittedTotal"] = "360.00"
        payload["canonicalCharges"][0].update(
            {
                "chargeId": "charge-labor",
                "category": "labor",
                "quantity": "3",
                "unitRate": "120.00",
                "submittedAmount": "360.00",
            }
        )
        payload["normalizedRules"][0].update(
            {
                "ruleId": "rule-labor-rate-limit",
                "ruleType": "LaborRateLimit",
                "scope": {"categories": ["labor"]},
                "operands": {"maxRate": "100.00"},
            }
        )
        payload["proposedFindings"][0].update(
            {
                "findingId": "finding-labor-rate-limit",
                "chargeId": "charge-labor",
                "ruleId": "rule-labor-rate-limit",
            }
        )

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "valid")
        self.assertEqual(result.authoritativeFindings[0].allowedAmount, Decimal("300.00"))
        self.assertEqual(result.authoritativeFindings[0].adjustment, Decimal("60.00"))
        self.assertEqual(result.financialSnapshot.proposedPayable, Decimal("300.00"))

    def test_overtime_rule_supports_explicit_rate_and_multiplier_operands(self) -> None:
        """Catches ignored explicit rates or a multiplier applied to the wrong base."""
        evaluator = load_evaluator_module()
        cases = [
            ({"explicitRate": "200.00"}, Decimal("800.00"), Decimal("100.00")),
            (
                {"straightTimeRate": "100.00", "multiplier": "1.50"},
                Decimal("600.00"),
                Decimal("300.00"),
            ),
        ]

        for operands, expected_allowed, expected_adjustment in cases:
            with self.subTest(operands=operands):
                payload = copy.deepcopy(base_payload())
                payload["invoiceSubmittedTotal"] = "900.00"
                payload["canonicalCharges"][0].update(
                    {
                        "chargeId": "charge-overtime",
                        "category": "overtime",
                        "quantity": "4",
                        "unitRate": "225.00",
                        "submittedAmount": "900.00",
                    }
                )
                payload["normalizedRules"][0].update(
                    {
                        "ruleId": "rule-overtime",
                        "ruleType": "OvertimeRule",
                        "scope": {"categories": ["overtime"]},
                        "operands": operands,
                    }
                )
                payload["proposedFindings"][0].update(
                    {
                        "findingId": "finding-overtime",
                        "chargeId": "charge-overtime",
                        "ruleId": "rule-overtime",
                    }
                )

                result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

                self.assertEqual(result.status, "valid")
                self.assertEqual(
                    result.authoritativeFindings[0].allowedAmount,
                    expected_allowed,
                )
                self.assertEqual(
                    result.authoritativeFindings[0].adjustment,
                    expected_adjustment,
                )

    def test_percentage_cap_uses_the_declared_submitted_eligible_base(self) -> None:
        """Catches use of an allowed base or the current charge as the cap basis."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["invoiceSubmittedTotal"] = "600.00"
        payload["canonicalCharges"][0].update(
            {
                "chargeId": "charge-capped-category",
                "category": "capped-category",
                "quantity": "1",
                "unitRate": "600.00",
                "submittedAmount": "600.00",
            }
        )
        payload["normalizedRules"][0].update(
            {
                "ruleId": "rule-percentage-cap",
                "ruleType": "PercentageCap",
                "scope": {"categories": ["capped-category"]},
                "operands": {
                    "percentage": "0.10",
                    "eligibleSubmittedBase": "1000.00",
                },
            }
        )
        payload["proposedFindings"][0].update(
            {
                "findingId": "finding-percentage-cap",
                "chargeId": "charge-capped-category",
                "ruleId": "rule-percentage-cap",
            }
        )

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "valid")
        self.assertEqual(result.authoritativeFindings[0].allowedAmount, Decimal("100.00"))
        self.assertEqual(result.authoritativeFindings[0].adjustment, Decimal("500.00"))

    def test_equipment_unit_cap_uses_eligible_quantity_and_unit_rate_cap(self) -> None:
        """Catches a flat cap or a cap that ignores the equipment quantity."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["invoiceSubmittedTotal"] = "1500.00"
        payload["canonicalCharges"][0].update(
            {
                "chargeId": "charge-equipment",
                "category": "equipment",
                "quantity": "3",
                "unit": "day",
                "unitRate": "500.00",
                "submittedAmount": "1500.00",
            }
        )
        payload["normalizedRules"][0].update(
            {
                "ruleId": "rule-equipment-cap",
                "ruleType": "EquipmentUnitCap",
                "scope": {"categories": ["equipment"]},
                "operands": {"maxUnitRate": "400.00"},
            }
        )
        payload["proposedFindings"][0].update(
            {
                "findingId": "finding-equipment-cap",
                "chargeId": "charge-equipment",
                "ruleId": "rule-equipment-cap",
            }
        )

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "valid")
        self.assertEqual(result.authoritativeFindings[0].allowedAmount, Decimal("1200.00"))
        self.assertEqual(result.authoritativeFindings[0].adjustment, Decimal("300.00"))

    def test_evidence_requirement_clears_only_when_required_evidence_is_valid(self) -> None:
        """Catches evidence that is ignored or cleared by an invalid document."""
        evaluator = load_evaluator_module()
        cases = [
            ([], "missing", Decimal("0.00"), Decimal("250.00")),
            (["itemized-receipt"], "valid", Decimal("250.00"), Decimal("0.00")),
        ]

        for evidence_types, evidence_state, expected_allowed, expected_adjustment in cases:
            with self.subTest(evidence_state=evidence_state):
                payload = copy.deepcopy(base_payload())
                payload["invoiceSubmittedTotal"] = "250.00"
                payload["canonicalCharges"][0].update(
                    {
                        "chargeId": "charge-evidence",
                        "category": "evidence-controlled",
                        "submittedAmount": "250.00",
                        "evidenceTypes": evidence_types,
                    }
                )
                payload["normalizedRules"][0].update(
                    {
                        "ruleId": "rule-evidence-requirement",
                        "ruleType": "EvidenceRequirement",
                        "scope": {"categories": ["evidence-controlled"]},
                        "operands": {
                            "requiredEvidenceTypes": ["itemized-receipt"],
                            "amountThreshold": "100.00",
                        },
                    }
                )
                payload["proposedFindings"][0].update(
                    {
                        "findingId": "finding-evidence-requirement",
                        "chargeId": "charge-evidence",
                        "ruleId": "rule-evidence-requirement",
                        "evidenceState": evidence_state,
                    }
                )

                result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

                self.assertEqual(result.status, "valid")
                self.assertEqual(
                    result.authoritativeFindings[0].allowedAmount,
                    expected_allowed,
                )
                self.assertEqual(
                    result.authoritativeFindings[0].adjustment,
                    expected_adjustment,
                )

    def test_reconciliation_rules_never_convert_variance_into_a_deduction(self) -> None:
        """Catches automatic deductions from register or supporting-document variance."""
        evaluator = load_evaluator_module()

        for rule_type in ["InvoiceRegisterTieOut", "SupportingDocumentTieOut"]:
            with self.subTest(rule_type=rule_type):
                payload = copy.deepcopy(base_payload())
                payload["normalizedRules"][0].update(
                    {
                        "ruleId": "rule-reconciliation",
                        "ruleType": rule_type,
                        "scope": {},
                        "operands": {},
                    }
                )
                payload["proposedFindings"][0].update(
                    {
                        "findingId": "finding-reconciliation",
                        "ruleId": "rule-reconciliation",
                    }
                )
                payload["reconciliationResult"] = {
                    "invoiceRegisterStatus": "Variance",
                    "invoiceTotal": "100.00",
                    "registerTotal": "80.00",
                    "invoiceRegisterVariance": "20.00",
                    "supportingDocumentComparisons": [
                        {
                            "registerLineId": "register-line",
                            "supportingDocumentId": "supporting-document",
                            "status": "Variance",
                            "variance": "5.00",
                        }
                    ],
                }

                result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

                self.assertEqual(result.status, "valid")
                self.assertEqual(result.authoritativeFindings[0].adjustment, Decimal("0.00"))
                self.assertEqual(result.financialSnapshot.totalAdjustment, Decimal("0.00"))
                self.assertEqual(result.financialSnapshot.proposedPayable, Decimal("100.00"))
                self.assertEqual(
                    result.reconciliationState.invoiceRegisterVariance,
                    Decimal("20.00"),
                )

    def test_missing_rule_citation_returns_ungrounded_rule_without_snapshot(self) -> None:
        """Catches monetary promotion of a rule with no governing clause citation."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["normalizedRules"][0]["sourceClause"] = "  "

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.errorType, "UNGROUNDED_RULE")
        self.assertIsNone(result.financialSnapshot)
        self.assertEqual(result.validationErrors[0]["ruleId"], "rule-category-exclusion")

    def test_missing_required_operand_returns_typed_validation_error(self) -> None:
        """Catches a missing operand leaking out as an unexpected technical failure."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["canonicalCharges"][0]["category"] = "labor"
        payload["normalizedRules"][0].update(
            {
                "ruleType": "LaborRateLimit",
                "scope": {"categories": ["labor"]},
                "operands": {},
            }
        )

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.errorType, "MISSING_OPERAND")
        self.assertIsNone(result.financialSnapshot)
        self.assertEqual(result.validationErrors[0]["operand"], "maxRate")

    def test_duplicate_charge_identifier_returns_invalid_input(self) -> None:
        """Catches silent dictionary overwrite of a duplicate canonical charge."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["canonicalCharges"].append(copy.deepcopy(payload["canonicalCharges"][0]))
        payload["invoiceSubmittedTotal"] = "200.00"

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.errorType, "INVALID_INPUT")
        self.assertIsNone(result.financialSnapshot)
        self.assertEqual(result.validationErrors[0]["field"], "canonicalCharges")

    def test_charge_total_mismatch_rejects_the_financial_snapshot(self) -> None:
        """Catches promotion of a snapshot whose canonical charges do not tie to the invoice."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["invoiceSubmittedTotal"] = "99.99"

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.errorType, "TOTAL_MISMATCH")
        self.assertIsNone(result.financialSnapshot)
        self.assertEqual(result.validationErrors[0]["chargeTotal"], "100.00")

    def test_targeted_mode_rejects_findings_outside_changed_scope(self) -> None:
        """Catches a targeted request that silently widens its reevaluation scope."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload.update(
            {
                "mode": "targeted",
                "changedFindingIds": ["finding-authorized"],
                "previousSnapshot": {
                    "authoritativeFindings": [],
                    "financialSnapshot": {
                        "submittedTotal": "100.00",
                        "totalAdjustment": "0.00",
                        "proposedPayable": "100.00",
                        "currency": "USD",
                        "version": 1,
                    },
                },
            }
        )

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.errorType, "TARGET_SCOPE_VIOLATION")
        self.assertIsNone(result.financialSnapshot)

    def test_targeted_mode_preserves_unaffected_findings_and_aggregates_them(self) -> None:
        """Catches loss of prior lineage or totals during a narrow reevaluation."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["invoiceSubmittedTotal"] = "150.00"
        payload["canonicalCharges"][0].update(
            {
                "chargeId": "charge-targeted",
                "category": "evidence-controlled",
                "evidenceTypes": ["itemized-receipt"],
            }
        )
        payload["canonicalCharges"].append(
            {
                "chargeId": "charge-preserved",
                "category": "preserved-category",
                "submittedAmount": "50.00",
            }
        )
        payload["normalizedRules"][0].update(
            {
                "ruleId": "rule-evidence-requirement",
                "ruleType": "EvidenceRequirement",
                "scope": {"categories": ["evidence-controlled"]},
                "operands": {
                    "requiredEvidenceTypes": ["itemized-receipt"],
                    "amountThreshold": "1.00",
                },
            }
        )
        payload["proposedFindings"][0].update(
            {
                "findingId": "finding-targeted",
                "chargeId": "charge-targeted",
                "ruleId": "rule-evidence-requirement",
                "evidenceState": "valid",
            }
        )
        payload.update(
            {
                "mode": "targeted",
                "changedFindingIds": ["finding-targeted"],
                "previousSnapshot": {
                    "authoritativeFindings": [
                        {
                            "findingId": "finding-preserved",
                            "chargeId": "charge-preserved",
                            "ruleId": "rule-prior",
                            "ruleType": "CategoryExclusion",
                            "status": "partiallyExcluded",
                            "submittedAmount": "50.00",
                            "allowedAmount": "30.00",
                            "adjustment": "20.00",
                            "sourceDocumentId": "contract-document",
                            "sourceClause": "Prior grounded clause",
                        }
                    ],
                    "financialSnapshot": {
                        "submittedTotal": "150.00",
                        "totalAdjustment": "120.00",
                        "proposedPayable": "30.00",
                        "currency": "USD",
                        "version": 1,
                    },
                },
            }
        )

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "valid")
        self.assertEqual(result.preservedFindingIds, ["finding-preserved"])
        self.assertEqual(
            {finding.findingId for finding in result.authoritativeFindings},
            {"finding-targeted", "finding-preserved"},
        )
        self.assertEqual(result.financialSnapshot.totalAdjustment, Decimal("20.00"))
        self.assertEqual(result.financialSnapshot.proposedPayable, Decimal("130.00"))

    def test_canonical_oracle_and_post_evidence_targeted_reevaluation(self) -> None:
        """Independently checks the approved demo oracle without runtime answer keys."""
        evaluator = load_evaluator_module()
        initial_payload = canonical_oracle_payload()

        initial = evaluator.financial_rules_evaluator(
            evaluator.Input(**initial_payload)
        )

        self.assertEqual(initial.status, "valid")
        self.assertEqual(initial.financialSnapshot.totalAdjustment, Decimal("4564.46"))
        self.assertEqual(initial.financialSnapshot.proposedPayable, Decimal("58460.44"))
        self.assertEqual(
            initial.reconciliationState.invoiceRegisterVariance,
            Decimal("150.00"),
        )

        targeted_payload = copy.deepcopy(initial_payload)
        targeted_payload["analysisVersion"] = 2
        targeted_payload["mode"] = "targeted"
        targeted_payload["changedFindingIds"] = ["finding-ppe-evidence"]
        targeted_payload["canonicalCharges"][3]["evidenceTypes"] = ["itemized-receipt"]
        targeted_payload["proposedFindings"] = [
            {
                "findingId": "finding-ppe-evidence",
                "chargeId": "charge-ppe",
                "ruleId": "rule-ppe-evidence",
                "evidenceState": "valid",
            }
        ]
        targeted_payload["previousSnapshot"] = {
            "authoritativeFindings": [
                finding.model_dump(mode="json")
                for finding in initial.authoritativeFindings
            ],
            "financialSnapshot": initial.financialSnapshot.model_dump(mode="json"),
        }

        targeted = evaluator.financial_rules_evaluator(
            evaluator.Input(**targeted_payload)
        )

        self.assertEqual(targeted.status, "valid")
        self.assertEqual(targeted.financialSnapshot.totalAdjustment, Decimal("3649.46"))
        self.assertEqual(targeted.financialSnapshot.proposedPayable, Decimal("59375.44"))
        self.assertEqual(targeted.authoritativeFindings[0].adjustment, Decimal("0.00"))
        self.assertEqual(len(targeted.preservedFindingIds), 4)
        self.assertLessEqual(
            targeted.financialSnapshot.totalAdjustment,
            initial.financialSnapshot.totalAdjustment,
        )

    def test_unknown_charge_or_rule_reference_returns_invalid_input(self) -> None:
        """Catches broken finding references becoming unexpected technical failures."""
        evaluator = load_evaluator_module()

        for field, missing_value in [
            ("chargeId", "missing-charge"),
            ("ruleId", "missing-rule"),
        ]:
            with self.subTest(field=field):
                payload = copy.deepcopy(base_payload())
                payload["proposedFindings"][0][field] = missing_value

                result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

                self.assertEqual(result.status, "invalid")
                self.assertEqual(result.errorType, "INVALID_INPUT")
                self.assertIsNone(result.financialSnapshot)
                self.assertEqual(result.validationErrors[0]["field"], field)

    def test_unexpected_internal_failure_returns_a_safe_typed_error(self) -> None:
        """Catches exceptions escaping or sensitive internal detail entering output."""
        evaluator = load_evaluator_module()

        with patch.object(
            evaluator,
            "money",
            side_effect=RuntimeError("sensitive implementation detail"),
        ):
            result = evaluator.financial_rules_evaluator(
                evaluator.Input(**base_payload())
            )

        self.assertEqual(result.status, "technicalError")
        self.assertEqual(result.errorType, "UNEXPECTED_FAILURE")
        self.assertIsNone(result.financialSnapshot)
        self.assertNotIn("sensitive implementation detail", result.errorMessage)

    def test_negative_financial_inputs_return_invalid_input(self) -> None:
        """Catches negative invoice or submitted-charge values entering calculations."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["invoiceSubmittedTotal"] = "-100.00"
        payload["canonicalCharges"][0]["submittedAmount"] = "-100.00"

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.errorType, "INVALID_INPUT")
        self.assertIsNone(result.financialSnapshot)

    def test_malformed_decimal_operand_returns_invalid_input(self) -> None:
        """Catches malformed rule numerics leaking into a technical-error path."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["canonicalCharges"][0]["category"] = "labor"
        payload["normalizedRules"][0].update(
            {
                "ruleType": "LaborRateLimit",
                "scope": {"categories": ["labor"]},
                "operands": {"maxRate": "not-a-decimal"},
            }
        )

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.errorType, "INVALID_INPUT")
        self.assertEqual(result.validationErrors[0]["field"], "operands.maxRate")

    def test_rule_outside_its_effective_period_does_not_adjust_the_charge(self) -> None:
        """Catches category-only matching that ignores the charge service date."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["canonicalCharges"][0].update(
            {
                "category": "labor",
                "quantity": "1",
                "unitRate": "100.00",
                "submittedAmount": "100.00",
                "serviceDate": "2026-07-25",
            }
        )
        payload["normalizedRules"][0].update(
            {
                "ruleType": "LaborRateLimit",
                "scope": {"categories": ["labor"]},
                "operands": {"maxRate": "50.00"},
                "effectivePeriod": {
                    "start": "2025-01-01",
                    "end": "2025-12-31",
                },
            }
        )

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "valid")
        self.assertEqual(result.authoritativeFindings[0].adjustment, Decimal("0.00"))
        self.assertEqual(result.authoritativeFindings[0].status, "allowed")

    def test_overlapping_findings_cannot_double_deduct_the_same_charge(self) -> None:
        """Catches additive aggregation that drives payable below a charge's floor."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["canonicalCharges"][0].update(
            {"category": "labor", "quantity": "1", "submittedAmount": "100.00"}
        )
        payload["normalizedRules"] = [
            {
                "ruleId": "rule-exclusion",
                "ruleType": "CategoryExclusion",
                "scope": {"categories": ["labor"]},
                "sourceDocumentId": "contract-document",
                "sourceClause": "Exclusion clause",
            },
            {
                "ruleId": "rule-rate-cap",
                "ruleType": "LaborRateLimit",
                "scope": {"categories": ["labor"]},
                "operands": {"maxRate": "50.00"},
                "sourceDocumentId": "contract-document",
                "sourceClause": "Rate clause",
            },
        ]
        payload["proposedFindings"] = [
            {
                "findingId": "finding-exclusion",
                "chargeId": "charge-alcohol",
                "ruleId": "rule-exclusion",
            },
            {
                "findingId": "finding-rate-cap",
                "chargeId": "charge-alcohol",
                "ruleId": "rule-rate-cap",
            },
        ]

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "valid")
        self.assertEqual(result.financialSnapshot.totalAdjustment, Decimal("100.00"))
        self.assertEqual(result.financialSnapshot.proposedPayable, Decimal("0.00"))

    def test_unsupported_rule_returns_typed_validation_error(self) -> None:
        """Catches guessed calculations for an unknown rule shape."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["normalizedRules"][0]["ruleType"] = "UnknownRule"

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "invalid")
        self.assertEqual(result.errorType, "UNSUPPORTED_RULE")
        self.assertIsNone(result.financialSnapshot)

    def test_fully_compliant_supported_invoice_has_zero_adjustment(self) -> None:
        """Catches handlers that deduct even when every charge is within its rule."""
        evaluator = load_evaluator_module()
        payload = copy.deepcopy(base_payload())
        payload["invoiceSubmittedTotal"] = "450.00"
        payload["canonicalCharges"] = [
            {
                "chargeId": "charge-compliant-labor",
                "category": "labor",
                "quantity": "2",
                "unitRate": "100.00",
                "submittedAmount": "200.00",
            },
            {
                "chargeId": "charge-compliant-equipment",
                "category": "equipment",
                "quantity": "1",
                "unitRate": "150.00",
                "submittedAmount": "150.00",
            },
            {
                "chargeId": "charge-compliant-evidence",
                "category": "evidence-controlled",
                "submittedAmount": "100.00",
                "evidenceTypes": ["itemized-receipt"],
            },
        ]
        payload["normalizedRules"] = [
            {
                "ruleId": "rule-compliant-labor",
                "ruleType": "LaborRateLimit",
                "scope": {"categories": ["labor"]},
                "operands": {"maxRate": "100.00"},
                "sourceDocumentId": "contract-document",
                "sourceClause": "Labor schedule",
            },
            {
                "ruleId": "rule-compliant-equipment",
                "ruleType": "EquipmentUnitCap",
                "scope": {"categories": ["equipment"]},
                "operands": {"maxUnitRate": "175.00"},
                "sourceDocumentId": "contract-document",
                "sourceClause": "Equipment schedule",
            },
            {
                "ruleId": "rule-compliant-evidence",
                "ruleType": "EvidenceRequirement",
                "scope": {"categories": ["evidence-controlled"]},
                "operands": {
                    "requiredEvidenceTypes": ["itemized-receipt"],
                    "amountThreshold": "50.00",
                },
                "sourceDocumentId": "contract-document",
                "sourceClause": "Evidence clause",
            },
        ]
        payload["proposedFindings"] = [
            {
                "findingId": "finding-compliant-labor",
                "chargeId": "charge-compliant-labor",
                "ruleId": "rule-compliant-labor",
            },
            {
                "findingId": "finding-compliant-equipment",
                "chargeId": "charge-compliant-equipment",
                "ruleId": "rule-compliant-equipment",
            },
            {
                "findingId": "finding-compliant-evidence",
                "chargeId": "charge-compliant-evidence",
                "ruleId": "rule-compliant-evidence",
                "evidenceState": "valid",
            },
        ]

        result = evaluator.financial_rules_evaluator(evaluator.Input(**payload))

        self.assertEqual(result.status, "valid")
        self.assertEqual(result.financialSnapshot.totalAdjustment, Decimal("0.00"))
        self.assertEqual(result.financialSnapshot.proposedPayable, Decimal("450.00"))

    def test_identical_validated_input_produces_identical_output(self) -> None:
        """Catches nondeterministic traces or calculation output."""
        evaluator = load_evaluator_module()
        request = evaluator.Input(**canonical_oracle_payload())

        first = evaluator.financial_rules_evaluator(request)
        second = evaluator.financial_rules_evaluator(request)

        self.assertEqual(first.model_dump(mode="json"), second.model_dump(mode="json"))


if __name__ == "__main__":
    unittest.main()
