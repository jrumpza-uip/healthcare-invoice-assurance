# Delete Entity Record

`UiPath.DataService.Activities.DeleteEntityRecord<TEntity>`

Deletes a specified record for the selected Entity from Data Service.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.EntityRecord

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `RecordId` | Record Id | InArgument | `Guid` | Yes | | Id for the record to be deleted from Data Service for the selected Entity type. |

### Output

No output properties. The activity returns no data.

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## XAML Example

```xml
<ds:DeleteEntityRecord x:TypeArguments="local:MyEntity"
    RecordId="[recordGuid]"
    DisplayName="Delete Entity Record" />
```

## Notes

- No expansion depth parameter — the delete operation returns no data.
- `EntityId` is enforced as required by `[RequiredArgument]`; the WF runtime validates it automatically.
- Entity name is resolved from bindings first, then falls back to `InputEntity.ArgumentType.Name`.
- Fires `WorkflowNotifier.NotifyChange` with `recordId` on both success and failure.
