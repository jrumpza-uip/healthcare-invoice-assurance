import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { MessageSeverity, Theme } from '@uipath/coded-action-app';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@uipath/apollo-wind';
import type { ActionFormData, FindingDisposition, Outcome } from '../models/action';
import { normalizeTaskData } from '../models/action';
import {
  actionWorkspaceServices,
  HLS_FOLDER_ID,
  type ActionWorkspaceServices,
} from '../services/action-services';
import {
  buildCompletionPayload,
  getVisibleOutcomes,
  validateOutcome,
} from '../services/review-contract';
import DocumentTab from './DocumentTab';
import './Form.css';
import './ActionWorkspace.css';

interface ActionWorkspaceProps {
  services?: ActionWorkspaceServices;
  onInitTheme: (isDark: boolean) => void;
  darkTheme: boolean;
  onToggleTheme: () => void;
}

const isDarkTheme = (theme: Theme): boolean =>
  theme === Theme.Dark || theme === Theme.DarkHighContrast;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const formatCurrency = (value: number) => currency.format(Number.isFinite(value) ? value : 0);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export default function ActionWorkspace({
  services = actionWorkspaceServices,
  onInitTheme,
  darkTheme,
  onToggleTheme,
}: ActionWorkspaceProps) {
  const [data, setData] = useState<ActionFormData | null>(null);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blockingError, setBlockingError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const submissionLock = useRef(false);

  useEffect(() => {
    let active = true;
    services.getTask()
      .then(async (task) => {
        if (!active) return;
        if (task.folderId !== HLS_FOLDER_ID) {
          throw new Error(`This task is not scoped to AMER Presales/HLS (expected folder ${HLS_FOLDER_ID}).`);
        }
        const initial = normalizeTaskData(task.data);
        if (!['Reviewer', 'Manager'].includes(initial.taskMode)) {
          throw new Error('Task input is invalid: taskMode must be Reviewer or Manager.');
        }
        if (!initial.invoiceRecordId || !initial.correlationId) {
          throw new Error('Task input is invalid: invoiceRecordId and correlationId are required.');
        }

        let merged = initial;
        if (initial.findings.length === 0 || initial.documents.length === 0 || initial.charges.length === 0) {
          const fallback = await services.loadFallbackRecords(initial.invoiceRecordId);
          if (fallback) {
            merged = normalizeTaskData({
              ...initial,
              ...fallback,
              invoiceSummary: { ...initial.invoiceSummary, ...fallback.invoiceSummary },
              findings: initial.findings.length ? initial.findings : fallback.findings,
              charges: initial.charges.length ? initial.charges : fallback.charges,
              documents: initial.documents.length ? initial.documents : fallback.documents,
              activity: initial.activity.length ? initial.activity : fallback.activity,
            });
          }
        }

        if (!active) return;
        setData(merged);
        setFolderId(task.folderId);
        setIsReadOnly(task.isReadOnly);
        setSelectedDocumentId(merged.documents[0]?.documentId ?? '');
        onInitTheme(isDarkTheme(task.theme));
      })
      .catch((error: unknown) => {
        if (active) setBlockingError(error instanceof Error ? error.message : 'Action Center host session unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [onInitTheme, services]);

  const selectedDocument = useMemo(
    () => data?.documents.find((document) => document.documentId === selectedDocumentId) ?? null,
    [data?.documents, selectedDocumentId],
  );

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setDocumentError('');
    setDocumentUrl(null);
    if (!selectedDocument || folderId === null) return () => { active = false; };

    services.getDocumentUrl(selectedDocument, folderId)
      .then((url) => {
        createdUrl = url;
        if (active) setDocumentUrl(url);
      })
      .catch((error: unknown) => {
        if (active) setDocumentError(error instanceof Error ? error.message : 'Document download failed.');
      });

    return () => {
      active = false;
      if (createdUrl?.startsWith('blob:')) URL.revokeObjectURL(createdUrl);
    };
  }, [folderId, selectedDocument, services]);

  const persist = (updated: ActionFormData) => {
    setData(updated);
    services.setTaskData(updated);
  };

  const updateField = <K extends keyof ActionFormData>(field: K, value: ActionFormData[K]) => {
    if (!data || isReadOnly) return;
    persist({ ...data, [field]: value });
    setValidationErrors((current) => ({ ...current, [field]: '' }));
  };

  const updateDisposition = (findingId: string, patch: Partial<FindingDisposition>) => {
    if (!data || isReadOnly) return;
    const current = data.findingDispositions.find((item) => item.findingId === findingId) ?? {
      findingId,
      status: 'Open',
      notes: '',
    };
    const next = { ...current, ...patch };
    const dispositions = [
      ...data.findingDispositions.filter((item) => item.findingId !== findingId),
      next,
    ];
    persist({
      ...data,
      findingDispositions: dispositions,
      changedFindingIds: Array.from(new Set([...data.changedFindingIds, findingId])),
    });
  };

  const handleEvidenceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !data || folderId === null || isReadOnly) return;
    setUploading(true);
    setValidationErrors((current) => ({ ...current, uploadedEvidence: '' }));
    try {
      const evidence = await services.uploadEvidence(file, data, folderId);
      const updated = {
        ...data,
        evidenceStatus: 'Resolved',
        uploadedEvidence: [...data.uploadedEvidence, evidence],
        changedFindingIds: Array.from(new Set([
          ...data.changedFindingIds,
          ...data.findings.filter((finding) => finding.evidenceState !== 'Satisfied').map((finding) => finding.findingId),
        ])),
      };
      persist(updated);
      services.showMessage('Evidence uploaded and attached to this review.', MessageSeverity.Success);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Evidence upload failed.';
      setValidationErrors((current) => ({ ...current, uploadedEvidence: message }));
      services.showMessage(message, MessageSeverity.Error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSave = () => {
    if (!data || isReadOnly) return;
    services.setTaskData(data);
    services.showMessage('Progress saved. The task remains pending for reopening.', MessageSeverity.Success);
  };

  const handleOutcome = async (outcome: Outcome) => {
    if (!data || isReadOnly || submissionLock.current) return;
    const validation = validateOutcome(outcome, data);
    setValidationErrors(validation.errors);
    if (!validation.valid) {
      services.showMessage('Resolve the highlighted fields before completing the task.', MessageSeverity.Warning);
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);
    try {
      const payload = buildCompletionPayload(outcome, data);
      const result = await services.completeTask(outcome, payload);
      if (!result.success) throw new Error(result.errorMessage || 'Action Center did not complete the task.');
      setData(payload);
      services.showMessage('Task completed successfully.', MessageSeverity.Success);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task completion failed.';
      setBlockingError(message);
      services.showMessage(message, MessageSeverity.Error);
      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="action-loading" aria-live="polite">Loading review task…</main>;
  }

  if (blockingError || !data) {
    return (
      <main className="action-error">
        <Alert variant="destructive" role="alert">
          <AlertTitle>Task unavailable</AlertTitle>
          <AlertDescription>{blockingError || 'Action Center host session unavailable.'}</AlertDescription>
        </Alert>
      </main>
    );
  }

  const outcomes = getVisibleOutcomes(data.taskMode);
  const isReviewer = data.taskMode === 'Reviewer';

  return (
    <main className="review-app">
      <header className="review-header action-header">
        <div className="review-header__icon" aria-hidden="true">IA</div>
        <div className="review-header__titles">
          <p className="action-eyebrow">Healthcare Invoice Assurance</p>
          <h1 className="review-header__title">{isReviewer ? 'Review invoice' : 'Approve invoice'}</h1>
          <p className="review-header__subtitle">
            {data.invoiceSummary.invoiceNumber} · {data.invoiceSummary.supplierName} · Analysis v{data.analysisVersion}
          </p>
        </div>
        <div className="review-header__actions">
          <Badge variant={isReviewer ? 'outline' : 'secondary'}>{data.taskMode}</Badge>
          <Badge variant="outline">{data.processingStatus}</Badge>
          {isReadOnly && <Badge variant="destructive">Read only</Badge>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleTheme}
            aria-label={darkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkTheme ? 'Light' : 'Dark'}
          </Button>
        </div>
      </header>

      <section className="summary-strip" aria-label="Invoice summary">
        <div><span>Submitted</span><strong>{formatCurrency(data.invoiceSummary.submittedTotal)}</strong></div>
        <div><span>Adjustment</span><strong>{formatCurrency(data.invoiceSummary.currentAdjustment)}</strong></div>
        <div><span>Payable</span><strong>{formatCurrency(data.invoiceSummary.currentPayable)}</strong></div>
        <div><span>Open findings</span><strong>{data.invoiceSummary.openFindingCount}</strong></div>
        <div><span>Evidence</span><strong>{data.invoiceSummary.awaitingEvidence ? 'Required' : 'Complete'}</strong></div>
      </section>

      {data.priorManagerRationale && (
        <Alert className="manager-return-alert">
          <AlertTitle>Manager returned this review</AlertTitle>
          <AlertDescription>{data.priorManagerRationale}</AlertDescription>
        </Alert>
      )}

      <div className="action-grid">
        <div className="action-primary-column">
          <section className="action-panel" aria-labelledby="findings-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Runtime analysis</p>
                <h2 id="findings-title">Findings and contract evidence</h2>
              </div>
              <Badge variant="outline">{data.findings.length} findings</Badge>
            </div>
            <div className="finding-list">
              {data.findings.length === 0 && <p className="empty-copy">No findings were supplied for this analysis version.</p>}
              {data.findings.map((finding) => {
                const disposition = data.findingDispositions.find((item) => item.findingId === finding.findingId);
                return (
                  <article className="finding-item" key={finding.findingId}>
                    <div className="finding-heading">
                      <div className="min-width-zero">
                        <div className="badge-row">
                          <Badge variant={finding.severity.toLowerCase() === 'high' ? 'destructive' : 'outline'}>{finding.severity}</Badge>
                          <Badge variant="secondary">{finding.category}</Badge>
                          <Badge variant="outline">{formatPercent(finding.confidence)}</Badge>
                        </div>
                        <h3 title={finding.title}>{finding.title}</h3>
                        <p>{finding.explanation}</p>
                      </div>
                      <strong className="finding-effect">{formatCurrency(finding.financialEffect)}</strong>
                    </div>
                    <div className="clause-evidence">
                      <strong title={finding.contractDocumentTitle}>{finding.contractDocumentTitle}</strong>
                      <span>{finding.contractClause}</span>
                      <p>{finding.contractExcerptSummary}</p>
                      <small>{finding.applicabilityExplanation}</small>
                    </div>
                    {isReviewer && (
                      <div className="disposition-grid">
                        <div>
                          <Label htmlFor={`disposition-${finding.findingId}`}>Disposition</Label>
                          <select
                            id={`disposition-${finding.findingId}`}
                            value={disposition?.status ?? 'Open'}
                            onChange={(event) => updateDisposition(finding.findingId, { status: event.target.value })}
                            disabled={isReadOnly}
                          >
                            <option>Open</option>
                            <option>Accepted</option>
                            <option>Resolved</option>
                            <option>OverrideRequested</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor={`notes-${finding.findingId}`}>Disposition notes</Label>
                          <Input
                            id={`notes-${finding.findingId}`}
                            value={disposition?.notes ?? ''}
                            onChange={(event) => updateDisposition(finding.findingId, { notes: event.target.value })}
                            disabled={isReadOnly}
                          />
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="action-panel" aria-labelledby="charges-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Charge detail</p>
                <h2 id="charges-title">Submitted and allowed values</h2>
              </div>
            </div>
            <div className="table-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Allowed</TableHead>
                    <TableHead>Adjustment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.charges.map((charge) => (
                    <TableRow key={charge.chargeId}>
                      <TableCell className="truncate-cell" title={charge.description}>{charge.description}</TableCell>
                      <TableCell>{formatCurrency(charge.submittedAmount)}</TableCell>
                      <TableCell>{formatCurrency(charge.allowedAmount)}</TableCell>
                      <TableCell>{formatCurrency(charge.adjustment)}</TableCell>
                      <TableCell>{charge.evaluationStatus}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {isReviewer ? (
            <section className="action-panel" aria-labelledby="review-work-title">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Reviewer work</p>
                  <h2 id="review-work-title">Correction and evidence</h2>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <Label htmlFor="correctedRegisterAmount">Corrected register amount</Label>
                  <Input
                    id="correctedRegisterAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.correctedRegisterAmount || ''}
                    onChange={(event) => updateField('correctedRegisterAmount', Number(event.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                  <small>Leave blank when no structured register correction is needed.</small>
                </div>
                <div className="form-group">
                  <Label htmlFor="registerCorrectionReason">Correction reason</Label>
                  <Input
                    id="registerCorrectionReason"
                    value={data.registerCorrectionReason}
                    onChange={(event) => updateField('registerCorrectionReason', event.target.value)}
                    aria-invalid={Boolean(validationErrors.registerCorrectionReason)}
                    disabled={isReadOnly}
                  />
                  {validationErrors.registerCorrectionReason && <small className="field-error">{validationErrors.registerCorrectionReason}</small>}
                </div>
              </div>
              <div className="form-group form-group--spaced">
                <Label htmlFor="evidenceRequestNote">Evidence follow-up</Label>
                <Textarea
                  id="evidenceRequestNote"
                  value={data.evidenceRequestNote}
                  onChange={(event) => updateField('evidenceRequestNote', event.target.value)}
                  disabled={isReadOnly}
                  rows={3}
                />
              </div>
              <div className="evidence-row">
                <div className="form-group">
                  <Label htmlFor="evidenceStatus">Evidence status</Label>
                  <select
                    id="evidenceStatus"
                    value={data.evidenceStatus}
                    onChange={(event) => updateField('evidenceStatus', event.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="AwaitingEvidence">Awaiting evidence</option>
                    <option value="Resolved">Resolved</option>
                    <option value="NotRequired">Not required</option>
                  </select>
                  {validationErrors.evidenceStatus && <small className="field-error">{validationErrors.evidenceStatus}</small>}
                </div>
                <div className="form-group">
                  <Label htmlFor="evidenceUpload">Upload evidence PDF</Label>
                  <Input
                    id="evidenceUpload"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleEvidenceUpload}
                    disabled={isReadOnly || uploading}
                  />
                  <small>{uploading ? 'Uploading…' : 'PDF only, maximum 20 MB'}</small>
                  {validationErrors.uploadedEvidence && <small className="field-error">{validationErrors.uploadedEvidence}</small>}
                </div>
              </div>
              {data.uploadedEvidence.length > 0 && (
                <ul className="evidence-list" aria-label="Uploaded evidence">
                  {data.uploadedEvidence.map((evidence) => (
                    <li key={evidence.evidenceId} title={evidence.bucketPath}>
                      <span>{evidence.displayName}</span>
                      <Badge variant="outline">Uploaded</Badge>
                    </li>
                  ))}
                </ul>
              )}
              <div className="form-group form-group--spaced">
                <Label htmlFor="reviewerNotes">Reviewer notes</Label>
                <Textarea
                  id="reviewerNotes"
                  value={data.reviewerNotes}
                  onChange={(event) => updateField('reviewerNotes', event.target.value)}
                  disabled={isReadOnly}
                  rows={4}
                />
              </div>
            </section>
          ) : (
            <section className="action-panel" aria-labelledby="manager-decision-title">
              <div className="panel-heading">
                <div>
                  <p className="panel-kicker">Manager decision</p>
                  <h2 id="manager-decision-title">Disposition rationale</h2>
                </div>
              </div>
              <div className="form-group">
                <Label htmlFor="managerRationale">Rationale</Label>
                <Textarea
                  id="managerRationale"
                  value={data.managerRationale}
                  onChange={(event) => updateField('managerRationale', event.target.value)}
                  disabled={isReadOnly}
                  rows={5}
                  aria-invalid={Boolean(validationErrors.managerRationale)}
                />
                <small>Required when returning or rejecting; optional when approving.</small>
                {validationErrors.managerRationale && <small className="field-error">{validationErrors.managerRationale}</small>}
              </div>
            </section>
          )}

          <section className="action-panel" aria-labelledby="audit-title">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Audit preview</p>
                <h2 id="audit-title">Recent activity</h2>
              </div>
            </div>
            <ol className="audit-list">
              {data.activity.length === 0 && <li className="empty-copy">No prior activity was supplied.</li>}
              {data.activity.slice(0, 10).map((event, index) => (
                <li key={`${event.eventTimestamp}-${event.eventName}-${index}`}>
                  <time>{event.eventTimestamp}</time>
                  <div><strong>{event.eventName}</strong><p>{event.summary}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="action-document-column" aria-label="Document evidence">
          <div className="document-picker">
            <Label htmlFor="document-select">Document</Label>
            <select
              id="document-select"
              value={selectedDocumentId}
              onChange={(event) => setSelectedDocumentId(event.target.value)}
            >
              {data.documents.map((document) => (
                <option key={document.documentId} value={document.documentId}>{document.displayName}</option>
              ))}
            </select>
          </div>
          {documentError ? (
            <Alert variant="destructive">
              <AlertTitle>Document unavailable</AlertTitle>
              <AlertDescription>{documentError}</AlertDescription>
            </Alert>
          ) : (
            <DocumentTab fileUrl={documentUrl} fileName={selectedDocument?.displayName} />
          )}
        </aside>
      </div>

      {Object.values(validationErrors).some(Boolean) && (
        <div className="validation-summary" role="alert">
          Resolve the highlighted fields before completing this task.
        </div>
      )}

      <footer className="form-buttons action-footer">
        {isReviewer && (
          <Button type="button" variant="outline" onClick={handleSave} disabled={isReadOnly || submitting || uploading}>
            Save and exit
          </Button>
        )}
        <div className="action-footer__spacer" />
        {outcomes.map((outcome) => {
          const validation = validateOutcome(outcome, data);
          const label = outcome === 'SubmitReview' ? 'Submit review' :
            outcome === 'ReturnToReviewer' ? 'Return to reviewer' : outcome;
          const variant = outcome === 'Approve' || outcome === 'SubmitReview' ? 'default' :
            outcome === 'Reject' ? 'destructive' : 'outline';
          return (
            <Button
              key={outcome}
              type="button"
              variant={variant}
              onClick={() => handleOutcome(outcome)}
              disabled={isReadOnly || submitting || uploading || !validation.valid}
            >
              {submitting ? 'Submitting…' : label}
            </Button>
          );
        })}
      </footer>
    </main>
  );
}
