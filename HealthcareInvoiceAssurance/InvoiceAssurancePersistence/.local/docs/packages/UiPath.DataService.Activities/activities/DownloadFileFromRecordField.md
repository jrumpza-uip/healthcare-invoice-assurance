# Download File From Record Field

`UiPath.DataService.Activities.DownloadFileFromRecordField<TEntity>`

Downloads a file from a specified field of an entity record from Data Service. It will return nothing if no file is present.

**Package:** `UiPath.DataService.Activities`
**Category:** Data Service.File

## Properties

### Input

| Name | Display Name | Kind | Type | Required | Default | Description |
|------|-------------|------|------|----------|---------|-------------|
| `RecordId` | Record Id | InArgument | `Guid` | Yes | | Id for the record from Data Service for the selected Entity type to download the file. |
| `Field` | Field | InArgument | `string` | Yes | | Specifies the field to download the file for a record. This property only support fields of type File from Data Service. `[Browsable(false)]` — set by designer. |
| `FilePath` | File Path | InArgument | `string` | | | The full local path where you want to download the file. Relative paths are resolved based on the runtime execution directory. If no value is provided, the file will be downloaded in the current execution directory with the stored name. |

### Output

| Name | Display Name | Kind | Type | Description |
|------|-------------|------|------|-------------|
| `DownloadedFileResource` | Downloaded File Resource | OutArgument | `ILocalResource` | The File Resource of the file downloaded. |

### Common

| Name | Display Name | Kind | Type | Default | Description |
|------|-------------|------|------|---------|-------------|
| `ContinueOnError` | Continue On Error | InArgument | `bool` | `false` | Specifies if the automation should continue even when the activity throws an error. |
| `TimeoutInMs` | Timeout (milliseconds) | InArgument | `int` | `30000` | Specifies the amount of time (in milliseconds) to wait for the activity to run before an error is thrown. |

## XAML Example

```xml
<ds:DownloadFileFromRecordField x:TypeArguments="local:MyEntity"
    RecordId="[recordGuid]"
    Field="AttachmentField"
    FilePath="[targetFilePath]"
    DownloadedFileResource="[downloadedFile]"
    DisplayName="Download File From Record Field" />
```

## Notes

- Read-only activity — does not fire `WorkflowNotifier`.
- No `ExpansionDepth` — download does not return an entity.
- Output is a `FileResourceItem` (implements `ILocalResource`). Other activities can consume it via `ILocalResource.LocalPath`.
