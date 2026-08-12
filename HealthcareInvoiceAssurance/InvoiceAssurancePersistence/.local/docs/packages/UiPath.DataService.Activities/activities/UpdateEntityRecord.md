# Update Entity Record

`UiPath.DataService.Activities.UpdateEntityRecord<TEntity>`

Updates an existing record for the selected Entity in Data Service.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.EntityRecord

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `RecordId` | Record Id | InArgument | `Guid` | Yes | | The Id of the record to be updated from Data Service for the selected Entity. |
| `InputEntity` | Input Record | InArgument | `TEntity` | Yes (Record View) | | The record to be updated for the selected Entity type based on the Id field of the Input Record. Its type must match the entity. Active when `IsInRecordView = true`. |
| `InputEntityInFieldView` | Input Record | InArgument | `TEntity` | Yes (Field View) | | The record to be updated with individually bound fields. Active when `IsInRecordView = false`. |

### Configuration

| Name | Display Name | Type | Default | Description |
|------|-------------|------|---------|-------------|
| `IsInRecordView` | Is In Record View | `bool` | | Switches between Record View and Field View. Set by designer. |
| `VisibleDynamicPropertiesInfo` | — | `string` | | Serialized metadata for dynamic field visibility. Set by designer. |
| `State` | — | `RecordState` | `new()` | Design-time field state. Set by designer, not user. |
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

## Valid Configurations

- **Record View** (`IsInRecordView = true`): Uses `InputEntity`. Must not be null.
- **Field View** (`IsInRecordView = false`): Uses `InputEntityInFieldView`. Must not be null; at least one field in `SelectedFields` must have a non-null `ArgumentValue`.

### Conditional Properties

- `InputEntity` is active only when `IsInRecordView = true`.
- `InputEntityInFieldView` is active only when `IsInRecordView = false`.

## XAML Example

```xml
<ds:UpdateEntityRecord x:TypeArguments="local:MyEntity"
    InputEntity="[myEntityVariable]"
    RecordId="[recordGuid]"
    IsInRecordView="True"
    ExpansionDepth="2"
    OutputEntity="[updatedRecord]"
    DisplayName="Update Entity Record" />
```

## Notes

- **ID fallback**: If `entity.Id == Guid.Empty && RecordId != Guid.Empty`, `RecordId` is copied into `entity.Id` before the API call. Always provide `RecordId` when the entity variable may not carry an ID.
- Fires `WorkflowNotifier.NotifyChange` on success (with `response.Id`) and failure.
- Calls `FixRelationshipFieldIds` before sending.
- `EntityId` shadows the base class property (declared with `new`).
