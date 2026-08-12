from pathlib import Path
import json
import xml.etree.ElementTree as ET


WORKFLOW = (
    Path(__file__).parents[1]
    / "HealthcareInvoiceAssurance"
    / "InvoiceAssurancePersistence"
    / "Main.xaml"
)


def test_persistence_workflow_exposes_approved_contract() -> None:
    root = ET.parse(WORKFLOW).getroot()
    xaml = "http://schemas.microsoft.com/winfx/2006/xaml"
    properties = {
        node.attrib["Name"]: node.attrib["Type"]
        for node in root.findall(f".//{{{xaml}}}Property")
    }

    assert properties == {
        "in_Operation": "InArgument(x:String)",
        "in_InvoiceRecordId": "InArgument(x:String)",
        "in_CorrelationId": "InArgument(x:String)",
        "in_MainRecordJson": "InArgument(x:String)",
        "in_LineRecordsJson": "InArgument(x:String)",
        "in_ActivityRecordJson": "InArgument(x:String)",
        "out_Success": "OutArgument(x:Boolean)",
        "out_InvoiceRecordId": "OutArgument(x:String)",
        "out_CorrelationId": "OutArgument(x:String)",
        "out_Operation": "OutArgument(x:String)",
        "out_ActivityRecordId": "OutArgument(x:String)",
        "out_CreatedCount": "OutArgument(x:Int32)",
        "out_UpdatedCount": "OutArgument(x:Int32)",
        "out_ErrorCode": "OutArgument(x:String)",
        "out_ErrorMessage": "OutArgument(x:String)",
    }


def test_project_entry_point_metadata_matches_workflow_contract() -> None:
    project = json.loads((WORKFLOW.parent / "project.json").read_text())
    entry_point = next(
        item for item in project["entryPoints"] if item["filePath"] == "Main.xaml"
    )

    assert entry_point["input"] == [
        {"name": "in_Operation", "type": "System.String", "required": True},
        {"name": "in_InvoiceRecordId", "type": "System.String", "required": True},
        {"name": "in_CorrelationId", "type": "System.String", "required": True},
        {"name": "in_MainRecordJson", "type": "System.String", "required": True},
        {"name": "in_LineRecordsJson", "type": "System.String", "required": True},
        {"name": "in_ActivityRecordJson", "type": "System.String", "required": True},
    ]
    assert entry_point["output"] == [
        {"name": "out_Success", "type": "System.Boolean"},
        {"name": "out_InvoiceRecordId", "type": "System.String"},
        {"name": "out_CorrelationId", "type": "System.String"},
        {"name": "out_Operation", "type": "System.String"},
        {"name": "out_ActivityRecordId", "type": "System.String"},
        {"name": "out_CreatedCount", "type": "System.Int32"},
        {"name": "out_UpdatedCount", "type": "System.Int32"},
        {"name": "out_ErrorCode", "type": "System.String"},
        {"name": "out_ErrorMessage", "type": "System.String"},
    ]


def test_persistence_workflow_binds_all_approved_folder_entities() -> None:
    source = WORKFLOW.read_text()

    for entity_name in (
        "HLS_InvoiceAssurance_Main",
        "HLS_InvoiceAssurance_LineItems",
        "HLS_InvoiceAssurance_Activity",
    ):
        assert f'SolutionEntityName="{entity_name}"' in source

    assert source.count('ScopeValue="Folder"') >= 5


def test_persistence_workflow_enforces_operation_and_upsert_contract() -> None:
    source = WORKFLOW.read_text()

    for operation in (
        "MarkProcessing",
        "PersistInitial",
        "PersistReviewer",
        "PersistReevaluation",
        "Finalize",
    ):
        assert operation in source

    assert "DuplicateLineKey" in source
    assert "ExternalRecordId" in source
    assert "InvoiceRecordId" in source
    assert "Query Entity Records for Invoice Lines" in source
    assert "Create Missing Line Record" in source
    assert "Update Existing Line Record" in source


def test_validated_invoice_id_is_explicitly_parsed_before_main_lookup() -> None:
    root = ET.parse(WORKFLOW).getroot()
    activities = [
        (node.attrib.get("DisplayName"), node.attrib.get("Value"), node.attrib.get("RecordId"))
        for node in root.iter()
    ]

    parse_index = next(
        index
        for index, (display_name, value, _) in enumerate(activities)
        if display_name == "Parse Invoice Record Id"
        and value == "[Guid.Parse(in_InvoiceRecordId)]"
    )
    lookup_index = next(
        index
        for index, (display_name, _, record_id) in enumerate(activities)
        if display_name == "Get Main Record" and record_id == "[invoiceGuid]"
    )

    assert parse_index < lookup_index


def test_activity_append_occurs_after_main_and_line_writes() -> None:
    source = WORKFLOW.read_text()

    main_write = source.index('DisplayName="Update Main Record"')
    line_create = source.index('DisplayName="Create Missing Line Record"')
    line_update = source.index('DisplayName="Update Existing Line Record"')
    activity_append = source.index('DisplayName="Append Activity Record"')

    assert main_write < activity_append
    assert line_create < activity_append
    assert line_update < activity_append


def test_persistence_workflow_assigns_typed_success_and_error_outputs() -> None:
    source = WORKFLOW.read_text()

    for output_name in (
        "out_Success",
        "out_InvoiceRecordId",
        "out_CorrelationId",
        "out_Operation",
        "out_ActivityRecordId",
        "out_CreatedCount",
        "out_UpdatedCount",
        "out_ErrorCode",
        "out_ErrorMessage",
    ):
        assert f'To="[{output_name}]"' in source

    assert "DataFabricWriteFailed" in source
    assert "ValidationError" in source
