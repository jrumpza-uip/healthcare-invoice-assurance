# Create Entity Record

`UiPath.DataService.Activities.CreateEntityRecord<TEntity>`

Creates a new record for the selected Entity in Data Service.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.EntityRecord

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `InputEntity` | Input Record | InArgument | `TEntity` | Yes (Record View) | | The record to be created for the selected entity. Its type must match the entity. Active when `IsInRecordView = true`. |
| `InputEntityInFieldView` | Input Record | InArgument | `TEntity` | Yes (Field View) | | The record to be created with individually bound fields. Active when `IsInRecordView = false`. |

### Configuration

| Name | Display Name | Type | Default | Description |
|------|-------------|------|---------|-------------|
| `IsInRecordView` | Is In Record View | `bool` | | Switches between Record View and Field View input modes. Set by designer. |
| `VisibleDynamicPropertiesInfo` | — | `string` | | Serialized metadata for dynamic field visibility. Set by designer. |
| `State` | — | `RecordState` | `new()` | Design-time field state tracking. Set by designer, not user. |
| `ExpansionDepth` | Related Record Depth | `int` | `2` | Specifies the depth of related records to be retrieved from the service. Supports values from 1 to 3. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `OutputEntity` | Output Record | OutArgument | `TEntity` | The created record from Data Service. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## Valid Configurations

Two mutually exclusive input modes controlled by `IsInRecordView`:

- **Record View** (`IsInRecordView = true`): Uses `InputEntity`. Must not be null.
- **Field View** (`IsInRecordView = false`): Uses `InputEntityInFieldView`. Must not be null; all required fields in `State.SelectedFields` must have a non-null `ArgumentValue`.

### Conditional Properties

- `InputEntity` is active only when `IsInRecordView = true`.
- `InputEntityInFieldView` is active only when `IsInRecordView = false`.

## XAML Example

```xml
<ds:CreateEntityRecord x:TypeArguments="local:MyEntity"
    InputEntity="[myEntityVariable]"
    IsInRecordView="True"
    ExpansionDepth="2"
    OutputEntity="[createdRecord]"
    DisplayName="Create Entity Record" />
```

## Notes

- The designer automatically sets `IsInRecordView` and `State`. When generating XAML programmatically, use Record View (`IsInRecordView = true`) with a pre-built entity object.
- Fires `WorkflowNotifier.NotifyChange` with `EntityRecordChangeData` on both success and failure.
- Calls `FixRelationshipFieldIds` to handle JIT-generated types where `IEntity.Id` returns `Guid.Empty` but the actual property value is correct.
- Folder-scoped requests inject `X-UiPath-FolderPath` as an HTTP header from runtime bindings.
