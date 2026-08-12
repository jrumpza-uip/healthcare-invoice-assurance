import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@uipath/coded-action-app';
import { describe, expect, it, vi } from 'vitest';
import { managerTaskData, reviewerTaskData } from '../test/fixtures';
import ActionWorkspace from './ActionWorkspace';

vi.mock('./DocumentTab', () => ({
  default: ({ fileName }: { fileName?: string }) => <div data-testid="pdf-viewer">{fileName}</div>,
}));

const task = (data = reviewerTaskData) => ({
  taskId: 42,
  title: 'Invoice review',
  status: 'Pending' as const,
  isReadOnly: false,
  action: null,
  data,
  folderId: 2036001,
  folderName: 'AMER Presales/HLS',
  theme: Theme.Light,
});

const evidence = {
  evidenceId: 'evidence-1',
  bucketPath: 'evidence/invoice-record-test/correlation-test/receipt.pdf',
  displayName: 'receipt.pdf',
  contentType: 'application/pdf',
  size: 9,
  checksum: 'checksum-1',
  uploadedAt: '2026-08-08T20:00:00.000Z',
};

const services = (data = reviewerTaskData) => ({
  getTask: vi.fn().mockResolvedValue(task(data)),
  setTaskData: vi.fn(),
  completeTask: vi.fn().mockResolvedValue({ success: true, errorCode: null, errorMessage: null }),
  showMessage: vi.fn(),
  getDocumentUrl: vi.fn().mockResolvedValue('blob:test-document'),
  uploadEvidence: vi.fn(),
  loadFallbackRecords: vi.fn().mockResolvedValue(null),
});

describe('ActionWorkspace', () => {
  it('renders the Reviewer work surface and persists meaningful edits', async () => {
    const host = services();
    const user = userEvent.setup();
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: /review invoice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^approve$/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/reviewer notes/i), 'Checked source documents.');
    await waitFor(() => expect(host.setTaskData).toHaveBeenCalled());
  });

  it('renders Manager-only decisions and requires rationale for Return', async () => {
    const host = services(managerTaskData);
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: /approve invoice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /return to reviewer/i })).toBeDisabled();
  });

  it('prevents duplicate completion while a submission is in flight', async () => {
    let resolveCompletion!: (value: { success: boolean; errorCode: null; errorMessage: null }) => void;
    const host = services(managerTaskData);
    host.completeTask.mockReturnValue(new Promise((resolve) => { resolveCompletion = resolve; }));
    const user = userEvent.setup();
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);

    const approve = await screen.findByRole('button', { name: /^approve$/i });
    await user.dblClick(approve);
    expect(host.completeTask).toHaveBeenCalledOnce();
    expect(approve).toBeDisabled();
    resolveCompletion({ success: true, errorCode: null, errorMessage: null });
  });

  it('saves Reviewer progress without completing the pending task', async () => {
    const host = services();
    const user = userEvent.setup();
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /save and exit/i }));
    expect(host.setTaskData).toHaveBeenCalledWith(expect.objectContaining({ taskMode: 'Reviewer' }));
    expect(host.completeTask).not.toHaveBeenCalled();
  });

  it('persists uploaded evidence metadata into the task contract', async () => {
    const host = services();
    host.uploadEvidence.mockResolvedValue(evidence);
    const user = userEvent.setup();
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);
    const file = new File(['%PDF-test'], 'receipt.pdf', { type: 'application/pdf' });

    await user.upload(await screen.findByLabelText(/upload evidence pdf/i), file);

    await waitFor(() => expect(host.uploadEvidence).toHaveBeenCalledOnce());
    expect(host.setTaskData).toHaveBeenLastCalledWith(expect.objectContaining({
      evidenceStatus: 'Resolved',
      uploadedEvidence: [evidence],
    }));
  });

  it('keeps hosted task data read-only when Action Center marks the task read-only', async () => {
    const host = services();
    host.getTask.mockResolvedValue({ ...task(), isReadOnly: true });
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);

    expect(await screen.findByText(/read only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reviewer notes/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /save and exit/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /submit review/i })).toBeDisabled();
  });

  it('submits a Manager return exactly once after rationale is entered', async () => {
    const host = services(managerTaskData);
    const user = userEvent.setup();
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);

    await user.type(await screen.findByLabelText(/^rationale$/i), 'Please attach the missing receipt.');
    await user.click(screen.getByRole('button', { name: /return to reviewer/i }));

    expect(host.completeTask).toHaveBeenCalledOnce();
    expect(host.completeTask).toHaveBeenCalledWith(
      'ReturnToReviewer',
      expect.objectContaining({ managerRationale: 'Please attach the missing receipt.' }),
    );
  });

  it('starts keyboard focus at the theme control and progresses into the form', async () => {
    const host = services();
    const user = userEvent.setup();
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);
    await screen.findByRole('heading', { name: /review invoice/i });

    await user.tab();
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText(/^disposition$/i)).toHaveFocus();
  });

  it('shows a blocking host-session error without initiating OAuth', async () => {
    const host = services();
    host.getTask.mockRejectedValue(new Error('Host session unavailable'));
    render(<ActionWorkspace services={host} onInitTheme={vi.fn()} darkTheme={false} onToggleTheme={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/host session unavailable/i);
    expect(window.location.href).not.toContain('connect/authorize');
  });
});
