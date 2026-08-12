# Delete Multiple Entity Records

`UiPath.DataService.Activities.DeleteMultipleEntityRecords<TEntity>`

Deletes multiple records in bulk for the selected Entity from Data Service.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.Batch

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `InputRecords` | Record Ids | InArgument | `ICollection<Guid>` | Yes | | A list of Ids for the records to be deleted from Data Service for the selected Entity type. |

### Configuration

| Name | Display Name | Type | Default | Description |
|------|-------------|------|---------|-------------|
| `ContinueBatchOnFailure` | Continue Batch on Failure | `bool` | `true` | Specifies if Data Service should continue processing remaining records when a record fails to delete. If set to False, Data Service will stop processing records on first failure. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `FailedRecords` | Failed Records | OutArgument | `IList<Guid>` | The list of record GUIDs that could not be deleted from Data Service. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## XAML Example

```xml
<ds:DeleteMultipleEntityRecords x:TypeArguments="local:MyEntity"
    InputRecords="[guidCollection]"
    ContinueBatchOnFailure="True"
    FailedRecords="[failedIds]"
    DisplayName="Delete Multiple Entity Records" />
```

## Notes

- **Different from Create/Update batch**: Takes `ICollection<Guid>` (record IDs), not entity objects. No `OutputRecords`, no `ExpansionDepth`.
- Inherits directly from `BaseEntityActivity<TEntity>` (not `BaseUpsertMultipleEntityRecords`).
- Does not fire `WorkflowNotifier` and does not call `FixRelationshipFieldIds`.
- If any failures exist, throws `EntityServiceException` (catchable by `ContinueOnError`).
