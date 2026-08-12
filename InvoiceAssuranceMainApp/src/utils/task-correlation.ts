export interface CorrelatableTask {
  id: number;
  isCompleted?: boolean;
  status?: string;
  creatorJobKey?: number | string;
}

export function buildCreatorJobKeyFilter(instanceId: string): string {
  if (!/^\d+$/.test(instanceId)) {
    throw new Error('Process instance ID must be numeric.');
  }
  return `CreatorJobKey eq ${instanceId}`;
}

export function findCorrelatedPendingTask<T extends CorrelatableTask>(
  tasks: T[],
  instanceId: string,
): T | null {
  return tasks.find((task) =>
    String(task.creatorJobKey) === instanceId
    && !task.isCompleted
    && task.status !== 'Completed') ?? null;
}
