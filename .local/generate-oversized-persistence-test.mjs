const invoiceRecordId = "CF32DD4C-B494-F111-9B33-7C1E522150AC";

const inputs = {
  in_InvoiceRecordId: invoiceRecordId,
  in_MainRecordUpdatesJson: JSON.stringify({
    ProcessingStatus: "OversizedTestShouldNotWrite",
  }),
  in_LineRecordsJson: "[]",
  in_ActivityRecordJson: JSON.stringify({
    InvoiceRecordId: invoiceRecordId,
    CorrelationId: "hia-manual-1786363754470-751152530",
    EventTimestamp: "2026-08-12T17:20:00-05:00",
    EventName: "This oversized test must not be written",
    EventType: "NegativeTest",
    EventSource: "InvoiceAssurancePersistenceV2 manual verification",
    Summary: "Oversized PayloadJson rejection test.",
    PayloadJson: "x".repeat(10001),
  }),
};

process.stdout.write(JSON.stringify(inputs, null, 2));
