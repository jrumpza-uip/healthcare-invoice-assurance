import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewAnalysisPage } from './NewAnalysisPage';

describe('NewAnalysisPage', () => {
  it('submits the selected package and approved mock identifiers', async () => {
    const user = userEvent.setup();
    const received: unknown[] = [];
    render(<NewAnalysisPage isSubmitting={false} onSubmit={async (draft) => { received.push(draft); }} />);

    await user.upload(screen.getByLabelText('Invoice documents'), new File(['pdf'], 'invoice.pdf', { type: 'application/pdf' }));
    await user.selectOptions(screen.getByLabelText('Account'), 'account-lakeshore-regional-health-system');
    await user.selectOptions(screen.getByLabelText('Project'), 'project-west-pavilion-renovation');
    await user.selectOptions(screen.getByLabelText('Contract Profile'), 'profile-west-pavilion');
    await user.click(screen.getByRole('button', { name: 'Start analysis' }));

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      accountId: 'account-lakeshore-regional-health-system',
      projectId: 'project-west-pavilion-renovation',
      contractProfileId: 'profile-west-pavilion',
    });
  });

  it('shows inline validation and keeps the selected invoice', async () => {
    const user = userEvent.setup();
    render(<NewAnalysisPage isSubmitting={false} onSubmit={async () => {}} />);
    const input = screen.getByLabelText('Invoice documents');
    await user.upload(input, new File(['pdf'], 'invoice.pdf', { type: 'application/pdf' }));
    await user.click(screen.getByRole('button', { name: 'Start analysis' }));

    expect(screen.getByText('Select an account.')).toBeInTheDocument();
    expect((input as HTMLInputElement).files?.[0]?.name).toBe('invoice.pdf');
  });
});
