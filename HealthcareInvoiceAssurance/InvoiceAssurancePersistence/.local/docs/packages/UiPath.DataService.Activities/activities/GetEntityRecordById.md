# Get Entity Record By Id

`UiPath.DataService.Activities.GetEntityRecordById<TEntity>`

Reads an existing record for the selected Entity from Data Service.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.EntityRecord

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `RecordId` | Record Id | InArgument | `Guid` | Yes | | Id for the record to be read from Data Service for the selected Entity type. |

### Configuration

| Name | Display Name | Type | Default | Description |
|------|-------------|------|---------|-------------|
| `ExpansionDepth` | Related Record Depth | `int` | `2` | Specifies the depth of related records to be retrieved from the service. Supports values from 1 to 3. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `OutputEntity` | Output Record | OutArgument | `TEntity` | The retrieved record from Data Service. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## XAML Example

```xml
<ds:GetEntityRecordById x:TypeArguments="local:MyEntity"
    RecordId="[recordGuid]"
    ExpansionDepth="2"
    OutputEntity="[retrievedRecord]"
    DisplayName="Get Entity Record By Id" />
```

## Notes

- Read-only activity — does not fire `WorkflowNotifier`.
- `RecordId` must not be null; emits a `ValidationError` if missing.
- Entity name falls back to `typeof(TEntity).Name` when not found in bindings.
