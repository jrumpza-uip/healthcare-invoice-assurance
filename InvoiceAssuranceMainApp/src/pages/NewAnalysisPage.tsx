import { Alert, AlertDescription } from '@uipath/apollo-wind/components/ui/alert';
import { Button } from '@uipath/apollo-wind/components/ui/button';
import { FilePlus2, Files, Play, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SubmissionDraft, SubmissionErrors } from '../services/submission';
import { validateSubmission } from '../services/submission';

interface NewAnalysisPageProps {
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (draft: SubmissionDraft) => Promise<void>;
}

const initialDraft: SubmissionDraft = { invoiceFiles: [], supportFiles: [], accountId: '', projectId: '', contractProfileId: '', forceManagerReview: true };

export function NewAnalysisPage({ isSubmitting, error, onSubmit }: NewAnalysisPageProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [errors, setErrors] = useState<SubmissionErrors>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateSubmission(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSubmit(draft);
  };

  return (
    <div className="workspace-narrow space-y-8">
      <section><p className="eyebrow">New analysis</p><h2 className="page-title">Submit an invoice package</h2><p className="page-subtitle">Upload immutable source documents, select the project context, and start the governed UiPath Flow.</p></section>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <form className="panel form-panel" onSubmit={submit} noValidate>
        <div className="form-section">
          <div className="section-marker"><UploadCloud className="h-5 w-5" /></div>
          <div className="form-section-body"><h3>Invoice package</h3><p>PDF, PNG, or JPEG. Maximum 25 MB per file.</p>
            <FileField label="Invoice documents" files={draft.invoiceFiles} error={errors.invoiceFiles} onChange={(files) => setDraft((current) => ({ ...current, invoiceFiles: files }))} icon={FilePlus2} required />
            <FileField label="Receipts and support" files={draft.supportFiles} onChange={(files) => setDraft((current) => ({ ...current, supportFiles: files }))} icon={Files} multiple />
          </div>
        </div>
        <div className="form-section">
          <div className="section-marker section-marker-orange"><ShieldMark /></div>
          <div className="form-section-body"><h3>Assurance context</h3><p>Approved fictional identifiers keep the demo deterministic without exposing live client data.</p>
            <div className="form-grid">
              <SelectField label="Account" value={draft.accountId} error={errors.accountId} onChange={(value) => setDraft((current) => ({ ...current, accountId: value }))} options={[['account-lakeshore-regional-health-system', 'Lakeshore Regional Health System']]} />
              <SelectField label="Project" value={draft.projectId} error={errors.projectId} onChange={(value) => setDraft((current) => ({ ...current, projectId: value }))} options={[['project-west-pavilion-renovation', 'West Pavilion Renovation']]} />
              <SelectField label="Contract Profile" value={draft.contractProfileId} error={errors.contractProfileId} onChange={(value) => setDraft((current) => ({ ...current, contractProfileId: value }))} options={[['profile-west-pavilion', 'West Pavilion · 2026 governed stack']]} />
            </div>
          </div>
        </div>
        <div className="form-actions">
          <p>UiPath creates the record, uploads the files, then starts one Maestro instance.</p>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.forceManagerReview}
              onChange={(event) => setDraft((current) => ({ ...current, forceManagerReview: event.target.checked }))}
            />
            <span>Optimize for demo</span>
          </label>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Starting…' : 'Start analysis'} <Play className="h-4 w-4" /></Button>
        </div>
      </form>
    </div>
  );
}

function FileField({ label, files, error, onChange, icon: Icon, multiple = true }: { label: string; files: File[]; error?: string; onChange: (files: File[]) => void; icon: typeof Files; multiple?: boolean; required?: boolean }) {
  return <label className={`upload-field ${error ? 'field-error' : ''}`}><span className="upload-icon"><Icon className="h-5 w-5" /></span><span><strong>{label}</strong><small>{files.length ? files.map((file) => file.name).join(', ') : 'Choose files'}</small>{error && <em>{error}</em>}</span><input aria-label={label} type="file" multiple={multiple} accept="application/pdf,image/png,image/jpeg" onChange={(event) => onChange(Array.from(event.target.files ?? []))} /></label>;
}

function SelectField({ label, value, error, onChange, options }: { label: string; value: string; error?: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className="select-field"><span>{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select…</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>{error && <em>{error}</em>}</label>;
}

function ShieldMark() { return <span aria-hidden="true" className="shield-mark">IA</span>; }
