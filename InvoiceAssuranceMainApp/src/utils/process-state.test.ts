import { accumulateVariables } from './process-state';

describe('partial Maestro poll accumulation', () => {
  it('keeps prior variables, applies newer values, and sorts by name', () => {
    const previous = [
      { id: 'b', name: 'Status', value: 'Processing' },
      { id: 'a', name: 'CorrelationId', value: 'corr-1' },
    ];
    const incoming = [
      { id: 'b', name: 'Status', value: 'AwaitingReviewer' },
      { id: 'c', name: 'TaskId', value: '41' },
    ];

    expect(accumulateVariables(previous, incoming)).toEqual([
      { id: 'a', name: 'CorrelationId', value: 'corr-1' },
      { id: 'b', name: 'Status', value: 'AwaitingReviewer' },
      { id: 'c', name: 'TaskId', value: '41' },
    ]);
  });
});
