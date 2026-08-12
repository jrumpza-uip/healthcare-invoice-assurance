import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DocumentTab from './DocumentTab';

vi.mock('react-pdf', async () => {
  const React = await import('react');
  return {
    pdfjs: { version: 'test', GlobalWorkerOptions: { workerSrc: '' } },
    Document: ({ children, onLoadSuccess }: { children: React.ReactNode; onLoadSuccess: (result: { numPages: number }) => void }) => {
      React.useEffect(() => onLoadSuccess({ numPages: 2 }), [onLoadSuccess]);
      return <div data-testid="document">{children}</div>;
    },
    Page: ({ pageNumber, scale }: { pageNumber: number; scale: number }) => (
      <div data-testid="page">page {pageNumber} at {scale}</div>
    ),
  };
});

describe('DocumentTab', () => {
  it('provides named keyboard controls for paging and zoom', async () => {
    const user = userEvent.setup();
    render(<DocumentTab fileUrl="blob:invoice" fileName="invoice.pdf" />);

    const previous = await screen.findByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);
    expect(screen.getByTestId('page')).toHaveTextContent('page 2 at 1');

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByTestId('page')).toHaveTextContent('page 2 at 1.2');

    await user.click(screen.getByRole('button', { name: 'Reset zoom' }));
    expect(screen.getByTestId('page')).toHaveTextContent('page 2 at 1');
  });

  it('shows a stable empty state before a document URL is available', () => {
    render(<DocumentTab fileUrl={null} />);
    expect(screen.getByText(/document will load/i)).toBeInTheDocument();
  });
});
