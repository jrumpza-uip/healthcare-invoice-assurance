from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = (
    ROOT
    / "docs"
    / "Healthcare_Invoice_Assurance_Demo_Pack"
    / "01_Contract_Library"
)

NAVY = colors.HexColor("#17365D")
LIGHT_BLUE = colors.HexColor("#EAF1F8")
TEAL = colors.HexColor("#A7D6D2")
NOTICE = colors.HexColor("#C8A96B")
TEXT = colors.HexColor("#1F2937")


def styles():
    base = getSampleStyleSheet()
    return {
        "notice": ParagraphStyle(
            "notice",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=6.5,
            leading=8,
            textColor=colors.HexColor("#6B5A36"),
        ),
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=20,
            textColor=NAVY,
            spaceAfter=3,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#526173"),
            spaceAfter=10,
        ),
        "heading": ParagraphStyle(
            "heading",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=13,
            textColor=NAVY,
            spaceBefore=7,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=7.8,
            leading=10.3,
            textColor=TEXT,
            spaceAfter=3,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=6.9,
            leading=8.5,
            textColor=TEXT,
        ),
        "cell_bold": ParagraphStyle(
            "cell_bold",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=6.9,
            leading=8.5,
            textColor=TEXT,
        ),
        "cell_header": ParagraphStyle(
            "cell_header",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=6.9,
            leading=8.5,
            textColor=colors.white,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=5.7,
            leading=7,
            textColor=colors.HexColor("#7A8796"),
            alignment=TA_CENTER,
        ),
    }


def paragraph(text: str, style) -> Paragraph:
    return Paragraph(text, style)


def metadata_table(rows, s):
    data = [
        [paragraph(label, s["cell_bold"]), paragraph(value, s["cell"])]
        for label, value in rows
    ]
    table = Table(data, colWidths=[1.35 * inch, 5.35 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#C8D2DE")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ]
        )
    )
    return table


def standard_header(title: str, subtitle: str, s):
    notice = Table(
        [[paragraph(
            "FICTIONAL DEMO DATA - NOT A REAL INVOICE, RECEIPT, CONTRACT, OR HEALTH SYSTEM",
            s["notice"],
        )]],
        colWidths=[6.7 * inch],
    )
    notice.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.6, NOTICE),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    return [
        notice,
        Spacer(1, 9),
        paragraph(title, s["title"]),
        paragraph(subtitle, s["subtitle"]),
    ]


def category_table(s):
    rows = [
        ("Category", "Required evidence", "Threshold / rule"),
        ("Materials", "Itemized vendor receipt", "Required for an individual charge over $500"),
        ("Equipment", "Rental invoice or ownership log plus operating dates", "Required for every equipment charge"),
        ("PPE and safety consumables", "Itemized vendor receipt", "Required when the charge exceeds $250"),
        ("Meals", "Itemized receipt and business-purpose notation", "Required for every meal"),
        ("Subcontractors", "Subcontractor invoice and referenced support", "Required for every pass-through invoice"),
    ]
    data = [
        [paragraph(value, s["cell_header"] if index == 0 else s["cell"]) for value in row]
        for index, row in enumerate(rows)
    ]
    table = Table(data, colWidths=[1.65 * inch, 2.5 * inch, 2.55 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#C8D2DE")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return table


def build_pdf(path: Path, story):
    document = SimpleDocTemplate(
        str(path),
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.42 * inch,
        title=path.stem.replace("_", " "),
        author="Healthcare Invoice Assurance fictional demo",
    )

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 5.7)
        canvas.setFillColor(colors.HexColor("#7A8796"))
        canvas.drawString(0.65 * inch, 0.24 * inch, "Healthcare Invoice Assurance - fictional demo package")
        canvas.drawRightString(7.85 * inch, 0.24 * inch, f"Page {doc.page}")
        canvas.restoreState()

    document.build(story, onFirstPage=footer, onLaterPages=footer)


def build_amendment_03():
    s = styles()
    story = standard_header(
        "Amendment 03 - Evidence and Cost Eligibility",
        "Clarifies supporting-document requirements effective July 1, 2026",
        s,
    )
    story.extend(
        [
            metadata_table(
                [
                    ("Amendment ID", "RCSA-LRHS-2026-001-A03"),
                    ("Effective date", "July 1, 2026"),
                    ("Purpose", "Reduce unsupported monthly charges and accelerate review"),
                    ("Applies to", "All July 2026 and later invoice packages"),
                ],
                s,
            ),
            paragraph("1. Evidence standard", s["heading"]),
            paragraph(
                "Evidence must identify the vendor, transaction date, item or service, quantity, and amount. "
                "A credit-card total without itemization is not sufficient. A missing document is recorded as an "
                "unsupported-cost exception pending cure; it is not automatically treated as fraud or nonperformance.",
                s["body"],
            ),
            paragraph("2. Category requirements", s["heading"]),
            category_table(s),
            paragraph("3. Prohibited-cost reaffirmation", s["heading"]),
            paragraph(
                "Alcohol remains nonreimbursable without exception. The non-alcohol portion of an otherwise eligible "
                "meal may be reviewed separately when the receipt is itemized.",
                s["body"],
            ),
            paragraph("4. Invoice-register reconciliation", s["heading"]),
            paragraph(
                "The invoice cover total must match the detailed cost-register total before final approval. Each "
                "subcontractor line in the cost register must match the amount on its corresponding included "
                "subcontractor invoice. Any difference must be explained or corrected, even when all underlying "
                "charges are otherwise allowable.",
                s["body"],
            ),
            paragraph("5. Signatures", s["heading"]),
            metadata_table(
                [
                    ("Owner approval", "Morgan Ellery - June 18, 2026"),
                    ("Contractor approval", "Rafael Dunn - June 21, 2026"),
                ],
                s,
            ),
        ]
    )
    build_pdf(CONTRACTS / "05_Amendment_03_Evidence_and_Eligibility.pdf", story)


def build_july_addendum():
    s = styles()
    story = standard_header(
        "July 2026 Project Addendum",
        "Temporary approvals for the clinical power outage window",
        s,
    )
    story.extend(
        [
            metadata_table(
                [
                    ("Addendum ID", "WPR-ADD-2026-07"),
                    ("Effective period", "July 1-31, 2026 only"),
                    ("Authorized event", "Clinical power outage preparation and testing"),
                    ("Expiration", "Automatically expires August 1, 2026"),
                ],
                s,
            ),
            paragraph("1. Electrician overtime approval", s["heading"]),
            paragraph(
                "Up to 24 electrician hours may be billed at 1.5 times the Amendment 01 electrician rate for work "
                "performed during the approved outage window. The resulting approved rate is $207.00 per hour. "
                "Hours above 24 require a separate written authorization.",
                s["body"],
            ),
            paragraph("2. Power-quality testing", s["heading"]),
            paragraph(
                "A fixed charge of $1,248.00 for power-quality testing and report preparation is approved for Apex "
                "Electrical Services, provided its invoice is included in the July package.",
                s["body"],
            ),
            paragraph("3. Outage coordination meal", s["heading"]),
            paragraph(
                "The July 25, 2026 outage coordination meal is pre-approved for the clinical power outage "
                "coordination meeting, provided an itemized receipt and business-purpose notation are included. "
                "Beer, wine, and all other alcohol remain nonreimbursable and must be evaluated separately from the "
                "otherwise eligible meal.",
                s["body"],
            ),
            paragraph("4. No other changes", s["heading"]),
            paragraph(
                "This Addendum does not change straight-time labor rates, the small-tools percentage, equipment caps, "
                "receipt requirements, alcohol prohibition, or invoice-register reconciliation requirements.",
                s["body"],
            ),
            paragraph("5. Approvals", s["heading"]),
            metadata_table(
                [
                    ("Owner", "Morgan Ellery - June 27, 2026"),
                    ("Construction manager", "Dana Cho - June 27, 2026"),
                    ("Contractor", "Rafael Dunn - June 28, 2026"),
                ],
                s,
            ),
        ]
    )
    build_pdf(CONTRACTS / "06_July_2026_Project_Addendum.pdf", story)


if __name__ == "__main__":
    build_amendment_03()
    build_july_addendum()
