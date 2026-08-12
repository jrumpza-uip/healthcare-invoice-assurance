# Upload File To Record Field

`UiPath.DataService.Activities.UploadFileToRecordField<TEntity>`

Uploads a file to a specified field of an entity record from Data Service. It will replace an existing file, if present, in specified field.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.File

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `RecordId` | Record Id | InArgument | `Guid` | Yes | | Id for the record from Data Service for the selected Entity type to upload the file. |
| `Field` | Field | InArgument | `string` | Yes | | Specifies the field where you want to upload the file for the specified record. This property only support fields of type File from Data Service. `[Browsable(false)]` — set by designer's file-field picker. |
| `FilePath` | File Path | InArgument | `string` | Conditional | | The full local path to the file you want to upload. Relative paths are resolved based on the runtime execution directory. File size cannot exceed 10 MB. |
| `FileResource` | File Resource | InArgument | `IResource` | Conditional | | The file resource of the file you want to upload. File size cannot exceed 10 MB. |

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

## Valid Configurations

At least one of `FilePath` or `FileResource` must be provided. Both null causes a `ValidationError`.

| Configuration | Description |
|--------------|-------------|
| `FilePath` provided | Upload from local file path. |
| `FileResource` provided | Resolve `IResource` → `ILocalResource` → `LocalPath`, then upload. |

## XAML Example

```xml
<ds:UploadFileToRecordField x:TypeArguments="local:MyEntity"
    RecordId="[recordGuid]"
    Field="AttachmentField"
    FilePath="[localFilePath]"
    ExpansionDepth="2"
    OutputEntity="[updatedRecord]"
    DisplayName="Upload File To Record Field" />
```

## Notes

- `Field` is always `[Browsable(false)]` — set by the designer's file-field picker, not typed by the user.
- When using `FileResource`, it is resolved via `resource.ToLocalResource().ResolveAsync()` before upload.
- Fires `WorkflowNotifier.NotifyChange` on both success and failure with `recordId`.
