# Query Entity Records

`UiPath.DataService.Activities.QueryEntityRecords<TEntity>`

Retrieves a list of records for the selected Entity from Data Service, according to specified filters.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.EntityRecord

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `SortByField` | Sort By Field | InArgument | `string` | | | The name of the field you want to sort retrieved records by. The name has to be same as a valid field in the selected Entity type and needs to have the same capitalization. |
| `Top` | Top | InArgument | `int` | | `100` | Specifies the maximum number of records retrieved out of total records. Supports values from 1 to 1000. |
| `Skip` | Skip | InArgument | `long` | | `0` | Helps you skip the first "n" records. If the specified value is larger than total records, no records are retrieved. Supports values greater than or equal to 0. |

### Configuration

| Name | Display Name | Type | Default | Description |
|------|-------------|------|---------|-------------|
| `SortAscending` | Sort Ascending | `bool` | `true` | Sorts records in ascending order based on the field specified in 'Sort By' property. |
| `ExpansionDepth` | Related Record Depth | `int` | `2` | Specifies the depth of related records to be retrieved from the service. Supports values from 1 to 3. |
| `FilterArguments` | — | `FilterArgument` | | Compiled filter tree. `[Browsable(false)]`, set by filter builder UI. |
| `FilterValues` | — | `IList<InArgument>` | | Runtime values for filter placeholders. `[Browsable(false)]`. |
| `QueriedEntityId` | — | `Guid` | | Design-time tracking. `[Browsable(false)]`. |
| `RequiredForReadInput` | — | `TEntity` | | Values for `IsRequiredForRead` external fields. `[Browsable(false)]`. |
| `RequiredForReadFieldNames` | — | `IList<string>` | | Names of required external fields. `[Browsable(false)]`. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `OutputRecords` | Output Records | OutArgument | `IList<TEntity>` | The list of retrieved records from Data Service. |
| `TotalRecords` | Total Records | OutArgument | `long` | Total number of records matching specified query filters. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## Valid Configurations

### Filter System

Filters are built by the designer's filter builder UI. The `FilterArguments` and `FilterValues` properties are not typically set manually in XAML.

- `GroupFilter` (AND/OR) converts to `QueryFilterGroup`.
- `SimpleFilter` converts to `QueryFilter`.
- Operators requiring compound API calls (e.g., date range "on day") are expanded into sub-groups.
- `in` / `not in` operators use `ValueList` instead of single `Value`.
- Enum values are serialized as integers; collections as JSON arrays.

### Required-for-Read Injection

External fields with `IsRequiredForRead = true` are injected as mandatory AND equality filters automatically, wrapping the user's filter group:

```
AND
├── requiredField1 = value1
├── requiredField2 = value2
└── [user's original filter group]
```

## XAML Example

```xml
<ds:QueryEntityRecords x:TypeArguments="local:MyEntity"
    Top="50"
    Skip="0"
    SortByField="[&quot;Name&quot;]"
    SortAscending="True"
    ExpansionDepth="2"
    OutputRecords="[queryResults]"
    TotalRecords="[totalCount]"
    DisplayName="Query Entity Records" />
```

## Notes

- Read-only activity — does not fire `WorkflowNotifier`.
- Default page size is 100 records. Adjust `Top` and `Skip` for pagination.
- Sort is only applied when `SortByField` is not null or empty.
- `QueryEntityRecordsBuilder` extends this activity with `SearchColumn`/`SearchTerm` for UI builders.
