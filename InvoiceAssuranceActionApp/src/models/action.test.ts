import { describe, expect, it } from 'vitest';
import { normalizeTaskData } from './action';

describe('normalizeTaskData', () => {
  it('maps evaluator findings into the complete Reviewer display contract', () => {
    const data = normalizeTaskData({
      taskMode: 'Reviewer',
      findings: [{
        findingId: 'finding-1',
        chargeId: 'charge-1',
        ruleId: 'rule-1',
        ruleType: 'PercentageCap',
        status: 'adjusted',
        submittedAmount: 100,
        allowedAmount: 75,
        adjustment: 25,
        sourceDocumentId: 'contract-1',
        sourceClause: 'General Conditions § 5.2',
      }],
    });

    expect(data.findings[0]).toMatchObject({
      findingId: 'finding-1',
      severity: 'High',
      category: 'Percentage Cap',
      title: 'Percentage Cap review',
      financialEffect: 25,
      confidence: 1,
      contractDocumentTitle: 'contract-1',
      contractClause: 'General Conditions § 5.2',
    });
  });

  it('maps canonical Flow charges into the complete charge table contract', () => {
    const data = normalizeTaskData({
      taskMode: 'Reviewer',
      charges: [{
        chargeId: 'charge-1',
        sourceDocumentId: 'invoice-1',
        category: 'labor',
        description: 'Carpenter labor',
        quantity: 10,
        unit: 'hour',
        unitRate: 95,
        submittedAmount: 950,
      }],
    });

    expect(data.charges[0]).toMatchObject({
      chargeId: 'charge-1',
      submittedRate: 95,
      submittedAmount: 950,
      allowedAmount: 950,
      adjustment: 0,
      evaluationStatus: 'Submitted',
    });
  });

  it('starts an evidence-dependent Reviewer task in AwaitingEvidence when no explicit status exists', () => {
    const data = normalizeTaskData({
      taskMode: 'Reviewer',
      invoiceSummary: { awaitingEvidence: true },
    });

    expect(data.evidenceStatus).toBe('AwaitingEvidence');
  });

  it('preserves an explicit evidence status when a saved task is reopened', () => {
    const data = normalizeTaskData({
      taskMode: 'Reviewer',
      invoiceSummary: { awaitingEvidence: true },
      evidenceStatus: 'Resolved',
    });

    expect(data.evidenceStatus).toBe('Resolved');
  });
});
