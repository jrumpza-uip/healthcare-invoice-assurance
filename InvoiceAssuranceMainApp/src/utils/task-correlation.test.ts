import { buildCreatorJobKeyFilter, findCorrelatedPendingTask } from './task-correlation';

describe('task correlation', () => {
  const tasks = [
    { id: 11, isCompleted: true, status: 'Completed', creatorJobKey: 9001 },
    { id: 12, isCompleted: false, status: 'Unassigned', creatorJobKey: 9001 },
    { id: 13, isCompleted: false, status: 'Pending', creatorJobKey: 9002 },
  ];

  it('builds the only supported server-side correlation filter', () => {
    expect(buildCreatorJobKeyFilter('9001')).toBe('CreatorJobKey eq 9001');
  });

  it('selects only the non-completed task for the requested process instance', () => {
    expect(findCorrelatedPendingTask(tasks, '9001')?.id).toBe(12);
  });

  it('does not widen to an unrelated pending task when correlation has no match', () => {
    expect(findCorrelatedPendingTask(tasks, '9999')).toBeNull();
  });
});
