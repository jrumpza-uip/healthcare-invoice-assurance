# Update Multiple Entity Records

`UiPath.DataService.Activities.UpdateMultipleEntityRecords<TEntity>`

Updates multiple existing records in bulk for the selected Entity in Data Service.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.Batch

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `InputRecords` | Input Records | InArgument | `ICollection<TEntity>` | Yes | | A collection of records to be updated for the selected Entity type based on the Id field of the Input Records. Its type must match the entity. |

### Configuration

| Name | Display Name | Type | Default | Description |
|------|-------------|------|---------|-------------|
| `ContinueBatchOnFailure` | Continue Batch on Failure | `bool` | `true` | Specifies if Data Service should continue processing remaining records when a record fails to delete. If set to False, Data Service will stop processing records on first failure. |
| `ExpansionDepth` | Related Record Depth | `int` | `2` | Specifies the depth of related records to be retrieved from the service. Supports values from 1 to 3. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `OutputRecords` | Output Records | OutArgument | `IList<TEntity>` | The list of updated records from Data Service. |
| `FailedRecords` | Failed Records | OutArgument | `IList<Tuple<string, TEntity>>` | The list of Input Records that failed to update in Data Service. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## XAML Example

```xml
<ds:UpdateMultipleEntityRecords x:TypeArguments="local:MyEntity"
    InputRecords="[entityCollection]"
    ContinueBatchOnFailure="True"
    ExpansionDepth="2"
    OutputRecords="[updatedRecords]"
    FailedRecords="[failedRecords]"
    DisplayName="Update Multiple Entity Records" />
```

## Notes

- Each entity in the collection must carry a valid `Id` for the update to target the correct record.
- Identical behavior to `CreateMultipleEntityRecords` except calls `BatchUpdateAsync` instead of `BatchInsertAsync`.
- Does not fire `WorkflowNotifier`. Calls `FixRelationshipFieldIds` for all records.
