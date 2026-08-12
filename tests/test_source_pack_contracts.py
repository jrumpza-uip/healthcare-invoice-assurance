import json
import unittest
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "docs" / "Healthcare_Invoice_Assurance_Demo_Pack"


def pdf_text(relative_path: str) -> str:
    reader = PdfReader(PACK / relative_path)
    extracted = "\n".join(page.extract_text() or "" for page in reader.pages)
    return " ".join(extracted.split())


class SourcePackContractTests(unittest.TestCase):
    def test_july_addendum_preapproves_the_outage_coordination_meal(self) -> None:
        text = pdf_text("01_Contract_Library/06_July_2026_Project_Addendum.pdf")

        self.assertIn(
            "The July 25, 2026 outage coordination meal is pre-approved",
            text,
        )
        self.assertIn("Beer, wine, and all other alcohol remain nonreimbursable", text)

    def test_reconciliation_requires_each_subcontractor_line_to_match_support(self) -> None:
        text = pdf_text(
            "01_Contract_Library/05_Amendment_03_Evidence_and_Eligibility.pdf"
        )

        self.assertIn(
            "Each subcontractor line in the cost register must match the amount on its corresponding included subcontractor invoice",
            text,
        )

    def test_runtime_manifest_excludes_the_demo_guide(self) -> None:
        manifest_path = ROOT / "config" / "runtime-source-manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        sources = manifest["runtimeSources"]

        self.assertGreater(len(sources), 0)
        self.assertTrue(
            all(
                source.startswith(
                    (
                        "01_Contract_Library/",
                        "02_Invoice_Package/",
                        "03_Receipts_and_Support/",
                    )
                )
                for source in sources
            )
        )
        self.assertFalse(any("Demo_Guide" in source for source in sources))
        self.assertEqual(
            manifest["excludedSources"],
            ["04_Demo_Guide/Demo_Guide_and_Expected_Findings.pdf"],
        )


if __name__ == "__main__":
    unittest.main()
