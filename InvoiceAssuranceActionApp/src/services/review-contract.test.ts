import { describe, expect, it } from 'vitest';
import { managerTaskData, reviewerTaskData } from '../test/fixtures';
import {
  buildCompletionPayload,
  getVisibleOutcomes,
  validateOutcome,
} from './review-contract';

describe('review contract', () => {
  it('shows only Reviewer outcomes in Reviewer mode', () => {
    expect(getVisibleOutcomes('Reviewer')).toEqual(['SubmitReview']);
  });

  it('shows only Manager outcomes in Manager mode', () => {
    expect(getVisibleOutcomes('Manager')).toEqual([
      'Approve',
      'ReturnToReviewer',
      'Reject',
    ]);
  });

  it('requires a reason when a Reviewer changes the register amount', () => {
    const result = validateOutcome('SubmitReview', {
      ...reviewerTaskData,
      correctedRegisterAmount: 950,
      registerCorrectionReason: '',
    });

    expect(result.valid).toBe(false);
    expect(result.errors.registerCorrectionReason).toMatch(/reason/i);
  });

  it('requires uploaded evidence while the task remains AwaitingEvidence', () => {
    const result = validateOutcome('SubmitReview', {
      ...reviewerTaskData,
      correctedRegisterAmount: 1000,
      registerCorrectionReason: 'Corrected from the source register.',
      evidenceStatus: 'Resolved',
      uploadedEvidence: [],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.uploadedEvidence).toMatch(/evidence/i);
  });

  it('requires rationale for Manager return and rejection, but not approval', () => {
    expect(validateOutcome('Approve', managerTaskData).valid).toBe(true);
    expect(validateOutcome('ReturnToReviewer', managerTaskData).valid).toBe(false);
    expect(validateOutcome('Reject', managerTaskData).valid).toBe(false);
  });

  it('builds completion fields without changing runtime-derived financial values', () => {
    const completed = buildCompletionPayload('Approve', managerTaskData, '2026-08-08T20:00:00.000Z');

    expect(completed.submittedMode).toBe('Manager');
    expect(completed.completedAt).toBe('2026-08-08T20:00:00.000Z');
    expect(completed.invoiceSummary).toEqual(managerTaskData.invoiceSummary);
    expect(completed.reviewReady).toBe(true);
  });
});
