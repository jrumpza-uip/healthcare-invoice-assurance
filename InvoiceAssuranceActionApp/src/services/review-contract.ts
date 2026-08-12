import type { ActionFormData, Outcome, TaskMode } from '../models/action';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const outcomesByMode: Record<TaskMode, Outcome[]> = {
  Reviewer: ['SubmitReview'],
  Manager: ['Approve', 'ReturnToReviewer', 'Reject'],
};

export function getVisibleOutcomes(mode: TaskMode): Outcome[] {
  return [...outcomesByMode[mode]];
}

export function validateOutcome(outcome: Outcome, data: ActionFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!outcomesByMode[data.taskMode].includes(outcome)) {
    errors.outcome = `${outcome} is not allowed in ${data.taskMode} mode.`;
  }

  if (outcome === 'SubmitReview') {
    if (data.correctedRegisterAmount > 0 && !data.registerCorrectionReason.trim()) {
      errors.registerCorrectionReason = 'Enter a reason for the register correction.';
    }
    if (data.invoiceSummary.awaitingEvidence && data.evidenceStatus === 'Resolved' && data.uploadedEvidence.length === 0) {
      errors.uploadedEvidence = 'Upload the collected PDF evidence before resolving the evidence request.';
    }
    if (data.evidenceStatus === 'AwaitingEvidence') {
      errors.evidenceStatus = 'Evidence is still outstanding. Save and exit, then reopen this task after evidence is collected.';
    }
  }

  if ((outcome === 'ReturnToReviewer' || outcome === 'Reject') && !data.managerRationale.trim()) {
    errors.managerRationale = `Enter a rationale to ${outcome === 'Reject' ? 'reject' : 'return'} this review.`;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildCompletionPayload(
  outcome: Outcome,
  data: ActionFormData,
  completedAt = new Date().toISOString(),
): ActionFormData {
  const correctionApplied = data.taskMode === 'Reviewer' && data.correctedRegisterAmount > 0;
  const reviewReady = outcome === 'Approve' ||
    (outcome === 'SubmitReview' && data.evidenceStatus !== 'AwaitingEvidence');
  const decisionSummary = outcome === 'SubmitReview'
    ? data.reviewerNotes.trim()
    : data.managerRationale.trim();

  return {
    ...data,
    submittedMode: data.taskMode,
    reviewReady,
    correctionApplied,
    completedAt,
    decisionSummary,
  };
}
