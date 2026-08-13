const context = $vars.validateSubmission.output ?? {};
const packets = Array.isArray($vars.extractDocuments.output)
  ? $vars.extractDocuments.output
  : [];

const key = value =>
  String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const instances = (extraction, groupName) => {
  const group = (extraction?.fieldGroups ?? []).find(
    item => key(item?.name) === key(groupName)
  );
  return Array.isArray(group?.instances) ? group.instances : [];
};

const field = (instance, fieldName) =>
  (instance?.fields ?? []).find(item => key(item?.name) === key(fieldName));

const value = (instance, fieldName, fallback = "") => {
  const result = field(instance, fieldName)?.value;
  return result === null || result === undefined || result === ""
    ? fallback
    : result;
};

const money = input => {
  const parsed = Number(
    String(input ?? "").replace(/,/g, "").replace(/[^\d.+-]/g, "")
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

const documents = [];
const supportingInvoices = [];
const receipts = [];
const canonicalCharges = [];
let invoice = null;
let supplier = { name: "" };
let register = null;

for (const packet of packets) {
  const collected = packet?.collectExtractedDocument?.output ?? packet ?? {};
  const extraction = collected?.extraction ?? {};
  const documentPath = String(
    collected?.documentPath ?? extraction?.sourceDocumentPath ?? ""
  );
  const classification = instances(extraction, "Document Classification")[0];
  const documentType = String(value(classification, "Document Type", "Unknown"));

  documents.push({
    documentId: documentPath,
    bucketPath: documentPath,
    displayName: documentPath.split("/").pop() || documentPath,
    documentType,
    checksum: ""
  });

  if (documentType === "Primary Invoice" || documentType === "Supporting Invoice") {
    const header = instances(extraction, "Invoice Header")[0];
    const totalText = value(header, "Invoice Total", "");
    const headerData = {
      sourceDocumentId: documentPath,
      number: String(value(header, "Invoice Number", "")),
      date: String(value(header, "Invoice Date", "")).slice(0, 10),
      supplierName: String(value(header, "Invoice Supplier Name", "")),
      customerName: String(value(header, "Invoice Customer Name", "")),
      projectName: String(value(header, "Invoice Project Name", "")),
      total: money(totalText),
      currency: (String(totalText).match(/\b[A-Z]{3}\b/) ?? ["USD"])[0]
    };

    if (documentType === "Primary Invoice") {
      invoice = headerData;
      supplier = { name: headerData.supplierName };

      for (const [index, line] of instances(extraction, "Invoice Line Items").entries()) {
        const lineId = String(value(line, "Invoice Line Identifier", index + 1));
        canonicalCharges.push({
          chargeId: `${documentPath}#${lineId}`,
          externalRecordId: `${documentPath}#${lineId}`,
          sourceDocumentId: documentPath,
          sourceDocumentType: documentType,
          description: String(value(line, "Invoice Line Description", `Invoice line ${lineId}`)),
          category: String(value(line, "Invoice Line Category", "unclassified")),
          quantity: money(value(line, "Invoice Line Quantity", 0)),
          unit: String(value(line, "Invoice Line Unit", "")),
          unitRate: money(value(line, "Invoice Line Unit Rate", 0)),
          submittedAmount: money(value(line, "Invoice Line Amount", 0)),
          serviceDate: String(value(line, "Invoice Line Service Date", "")).slice(0, 10),
          reference: String(value(line, "Invoice Line Reference", "")),
          ixpConfidence: Number(line?.confidence ?? 0),
          evidenceTypes: [],
          evidenceDocumentIds: []
        });
      }
    } else {
      supportingInvoices.push(headerData);
    }
  }

  if (documentType === "Receipt") {
    const header = instances(extraction, "Receipt Header")[0];
    receipts.push({
      sourceDocumentId: documentPath,
      receiptNumber: String(value(header, "Receipt Number", "")),
      receiptDate: String(value(header, "Receipt Date", "")).slice(0, 10),
      vendorName: String(value(header, "Receipt Vendor Name", "")),
      total: money(value(header, "Receipt Total", 0))
    });
  }

  if (documentType === "Cost Register") {
    const header = instances(extraction, "Cost Register Header")[0];
    register = {
      sourceDocumentId: documentPath,
      identifier: String(value(header, "Register Identifier", "")),
      invoiceNumber: String(value(header, "Register Invoice Number", "")),
      total: money(value(header, "Register Total", 0)),
      lines: []
    };
  }
}

invoice ??= {
  sourceDocumentId: "",
  number: "",
  date: "",
  supplierName: "",
  total: 0,
  currency: "USD"
};

register ??= { total: invoice.total, lines: [] };

const missingRequiredFields = [];
if (!supplier.name.trim()) missingRequiredFields.push("Supplier Name");
if (!invoice.number.trim()) missingRequiredFields.push("Invoice Number");
if (!invoice.date.trim()) missingRequiredFields.push("Invoice Date");
if (!(Number(invoice.total) > 0)) missingRequiredFields.push("Invoice Total");

return {
  invoiceRecordId: context.invoiceRecordId,
  correlationId: context.correlationId,
  contractProfileId: context.contractProfileId,
  accountId: context.accountId,
  projectId: context.projectId,
  invoice,
  supplier,
  register,
  supportingInvoices,
  receipts,
  canonicalCharges,
  documents,
  currency: invoice.currency || "USD",
  missingRequiredFields,
  requiresCorrection: missingRequiredFields.length > 0
};
