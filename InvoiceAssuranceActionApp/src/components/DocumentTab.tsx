import { useCallback, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './DocumentTab.css';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentTabProps {
  fileUrl: string | null;
  fileName?: string;
}

export default function DocumentTab({ fileUrl, fileName = 'document.pdf' }: DocumentTabProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [pageRendering, setPageRendering] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const goToPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNext = () => setPageNumber((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(2.5, parseFloat((s + 0.2).toFixed(1))));
  const zoomOut = () => setScale((s) => Math.max(0.4, parseFloat((s - 0.2).toFixed(1))));
  const resetZoom = () => setScale(1.0);

  const handleDownload = async () => {
    if (!fileUrl) return;
    let blobUrl: string;
    let tempBlob = false;
    if (fileUrl.startsWith('blob:')) {
      blobUrl = fileUrl;
    } else {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      tempBlob = true;
    }
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    if (tempBlob) URL.revokeObjectURL(blobUrl);
  };

  if (!fileUrl) {
    return (
      <div className="pdf-shell pdf-shell--center">
        <p className="pdf-empty">Document will load when task data is available.</p>
      </div>
    );
  }

  return (
    <div className="pdf-shell">
      <div className="pdf-toolbar">
        <div className="pdf-toolbar__group">
          <button type="button" className="pdf-btn" onClick={goToPrev} disabled={pageNumber <= 1} title="Previous page" aria-label="Previous page">‹</button>
          <span className="pdf-page-info">
            <span className="pdf-page-info__current">{pageNumber}</span>
            <span className="pdf-page-info__sep">/</span>
            <span className="pdf-page-info__total">{numPages}</span>
          </span>
          <button type="button" className="pdf-btn" onClick={goToNext} disabled={pageNumber >= numPages} title="Next page" aria-label="Next page">›</button>
        </div>
        <div className="pdf-toolbar__group">
          <button type="button" className="pdf-btn" onClick={zoomOut} disabled={scale <= 0.4} title="Zoom out" aria-label="Zoom out">−</button>
          <button type="button" className="pdf-btn pdf-btn--zoom-label" onClick={resetZoom} title="Reset zoom" aria-label="Reset zoom">
            {Math.round(scale * 100)}%
          </button>
          <button type="button" className="pdf-btn" onClick={zoomIn} disabled={scale >= 2.5} title="Zoom in" aria-label="Zoom in">+</button>
        </div>
        <div className="pdf-toolbar__group">
          <button type="button" className="pdf-btn pdf-btn--download" onClick={handleDownload} title="Download PDF" aria-label={`Download ${fileName}`}>
            Download
          </button>
        </div>
      </div>
      <div className="pdf-viewport">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="pdf-page-loading">Loading…</div>}
          error={<div className="pdf-page-error">Failed to load PDF.</div>}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            onRenderSuccess={() => setPageRendering(false)}
            onRenderError={() => setPageRendering(false)}
            loading={<div className="pdf-page-loading">Rendering page…</div>}
            className={`pdf-page${pageRendering ? ' pdf-page--rendering' : ''}`}
          />
        </Document>
      </div>
    </div>
  );
}
