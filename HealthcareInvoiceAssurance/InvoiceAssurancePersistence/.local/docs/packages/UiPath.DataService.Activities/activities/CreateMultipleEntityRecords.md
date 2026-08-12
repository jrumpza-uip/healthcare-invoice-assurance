# Create Multiple Entity Records

`UiPath.DataService.Activities.CreateMultipleEntityRecords<TEntity>`

Creates multiple records in bulk for the selected Entity in Data Service.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.Batch

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `InputRecords` | Input Records | InArgument | `ICollection<TEntity>` | Yes | | A collection of records to be created for the selected Entity type. Its type must match the entity. |

### Configuration

| Name | Display Name | Type | Default | Description |
|------|-------------|------|---------|-------------|
| `ContinueBatchOnFailure` | Continue Batch on Failure | `bool` | `true` | Specifies if Data Service should continue processing remaining records when a record fails to delete. If set to False, Data Service will stop processing records on first failure. |
| `ExpansionDepth` | Related Record Depth | `int` | `2` | Specifies the depth of related records to be retrieved from the service. Supports values from 1 to 3. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `OutputRecords` | Output Records | OutArgument | `IList<TEntity>` | The list of created records from Data Service. |
| `FailedRecords` | Failed Records | OutArgument | `IList<Tuple<string, TEntity>>` | The list of Input Records that failed to create in Data Service. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## XAML Example

```xml
<ds:CreateMultipleEntityRecords x:TypeArguments="local:MyEntity"
    InputRecords="[entityCollection]"
    ContinueBatchOnFailure="True"
    ExpansionDepth="2"
    OutputRecords="[createdRecords]"
    FailedRecords="[failedRecords]"
    DisplayName="Create Multiple Entity Records" />
```

## Notes

- `failOnFirst = !ContinueBatchOnFailure` — the flag is inverted when forwarded to the service.
- Does not fire `WorkflowNotifier` (batch activities skip change notifications).
- Calls `FixRelationshipFieldIds` for all records before sending.
- If any failures exist, throws `EntityServiceException` (catchable by `ContinueOnError`).
- Check `FailedRecords.Count` after execution to determine partial failure.
