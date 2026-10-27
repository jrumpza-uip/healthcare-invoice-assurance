import { X } from 'lucide-react';
import { useEffect } from 'react';

interface DocumentViewerModalProps {
  name: string;
  url: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export function DocumentViewerModal({ name, url, isLoading, error, onClose }: DocumentViewerModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="document-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="document-modal" role="dialog" aria-modal="true" aria-label={name} onClick={(event) => event.stopPropagation()}>
        <div className="document-modal-header">
          <strong title={name}>{name}</strong>
          <button type="button" className="document-modal-close" aria-label="Close" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="document-modal-body">
          {isLoading && <p className="muted-copy">Loading document…</p>}
          {error && <p className="field-error-copy">{error}</p>}
          {url && !isLoading && !error && <iframe title={name} src={url} />}
        </div>
      </div>
    </div>
  );
}
