# UiPath Data Service Activities

`UiPath.DataService.Activities`

CRUD, batch, query, and file operations on UiPath Data Service entities. All activities are generic (`<TEntity>`) where `TEntity` is a JIT-generated type matching the Data Service entity schema, constrained to `IEntity`.

## Documentation

- [XAML Activities Reference](activities/)

## Activities

### Entity Record

| Activity | Description |
|----------|-------------|
| [Create Entity Record](activities/CreateEntityRecord.md) | Creates a new record for the selected Entity in Data Service |
| [Update Entity Record](activities/UpdateEntityRecord.md) | Updates an existing record for the selected Entity in Data Service |
| [Delete Entity Record](activities/DeleteEntityRecord.md) | Deletes a specified record for the selected Entity from Data Service |
| [Get Entity Record By Id](activities/GetEntityRecordById.md) | Reads an existing record for the selected Entity from Data Service |

| [Query Entity Records](activities/QueryEntityRecords.md) | Retrieves a list of records for the selected Entity from Data Service, according to specified filters |

### Batch

| Activity | Description |
|----------|-------------|
| [Create Multiple Entity Records](activities/CreateMultipleEntityRecords.md) | Creates multiple records in bulk for the selected Entity in Data Service |
| [Update Multiple Entity Records](activities/UpdateMultipleEntityRecords.md) | Updates multiple existing records in bulk for the selected Entity in Data Service |
| [Delete Multiple Entity Records](activities/DeleteMultipleEntityRecords.md) | Deletes multiple records in bulk for the selected Entity from Data Service |

### File

| Activity | Description |
|----------|-------------|
| [Upload File To Record Field](activities/UploadFileToRecordField.md) | Uploads a file to a specified field of an entity record from Data Service |
| [Download File From Record Field](activities/DownloadFileFromRecordField.md) | Downloads a file from a specified field of an entity record from Data Service |
| [Delete File From Record Field](activities/DeleteFileFromRecordField.md) | Deletes a file from a specified field of an entity record from Data Service |
