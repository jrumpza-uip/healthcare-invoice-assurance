export function formatStatusLabel(status: string): string {
  return status.replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim();
}

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'error' | 'warning' | 'info' | 'success' | 'outline';

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  Submitted: 'outline',
  Processing: 'info',
  ReviewerPending: 'warning',
  ManagerPending: 'warning',
  AwaitingEvidence: 'error',
  Approved: 'success',
  Rejected: 'destructive',
};

export function statusVariant(status: string): StatusVariant {
  return STATUS_VARIANTS[status] ?? 'secondary';
}
