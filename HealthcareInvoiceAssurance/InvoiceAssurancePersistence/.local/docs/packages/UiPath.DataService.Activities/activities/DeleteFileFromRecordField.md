# Delete File From Record Field

`UiPath.DataService.Activities.DeleteFileFromRecordField<TEntity>`

Deletes a file from a specified field of an entity record from Data Service. It will return nothing if no file is present.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.File

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `RecordId` | Record Id | InArgument | `Guid` | Yes | | Id for the record from Data Service for the selected Entity type to delete the file. |
| `Field` | Field | InArgument | `string` | Yes | | Specifies the field from where you want to delete the file for specified record. This property only support fields of type File from Data Service. `[Browsable(false)]` — set by designer. |

### Configuration

| Name | Display Name | Type | Default | Description |
|------|-------------|------|---------|-------------|
| `ExpansionDepth` | Related Record Depth | `int` | `2` | Specifies the depth of related records to be retrieved from the service. Supports values from 1 to 3. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `OutputEntity` | Output Record | OutArgument | `TEntity` | The updated record from Data Service. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## XAML Example

```xml
<ds:DeleteFileFromRecordField x:TypeArguments="local:MyEntity"
    RecordId="[recordGuid]"
    Field="AttachmentField"
    ExpansionDepth="2"
    OutputEntity="[updatedRecord]"
    DisplayName="Delete File From Record Field" />
```

## Notes

- This clears the file content from the field — it does not delete the entity record itself.
- `Field` is set by the designer's file-field picker, not typed manually.
- Fires `WorkflowNotifier.NotifyChange` on both success and failure with `recordId`.
- Only sets `OutputEntity` if the service returns a non-null entity.
