export interface SubmissionDraft {
  invoiceFiles: File[];
  supportFiles: File[];
  accountId: string;
  projectId: string;
  contractProfileId: string;
}

export type SubmissionErrors = Partial<Record<keyof SubmissionDraft, string>>;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);

export function validateSubmission(draft: SubmissionDraft): SubmissionErrors {
  const errors: SubmissionErrors = {};
  const packageFiles = [...draft.invoiceFiles, ...draft.supportFiles];

  if (draft.invoiceFiles.length === 0) {
    errors.invoiceFiles = 'Add at least one invoice document.';
  } else if (packageFiles.some((file) => !SUPPORTED_FILE_TYPES.has(file.type) || file.size > MAX_FILE_BYTES)) {
    errors.invoiceFiles = 'Use PDF, PNG, or JPEG files no larger than 25 MB each.';
  }
  if (!draft.accountId) errors.accountId = 'Select an account.';
  if (!draft.projectId) errors.projectId = 'Select a project.';
  if (!draft.contractProfileId) errors.contractProfileId = 'Select a Contract Profile.';

  return errors;
}
